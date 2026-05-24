const baseUrl = import.meta.env.VITE_MEDUSA_URL || "";
const publishableKey = import.meta.env.VITE_MEDUSA_PUBLISHABLE_KEY;

const commonHeaders = {
  "x-publishable-api-key": publishableKey,
  "Content-Type": "application/json",
};

const optimizedImageMaxDimension = 1800;
const optimizedImageQuality = 0.86;

async function parseResponse(response, fallbackMessage) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.message || fallbackMessage);
  }

  return data;
}

export async function getPublicMemberMedia() {
  const response = await fetch(`${baseUrl}/store/member-media/public`, {
    method: "GET",
    headers: commonHeaders,
    cache: "no-store",
  });

  return parseResponse(response, "Failed to load member media.");
}

export async function loginMemberMedia({ member, passcode }) {
  const response = await fetch(`${baseUrl}/store/member-media/login`, {
    method: "POST",
    headers: commonHeaders,
    body: JSON.stringify({ member, passcode }),
  });

  return parseResponse(response, "Failed to log in.");
}

export async function saveMemberMedia({ token, member, media }) {
  const response = await fetch(`${baseUrl}/store/member-media/save`, {
    method: "POST",
    headers: commonHeaders,
    body: JSON.stringify({ token, member, media }),
  });

  return parseResponse(response, "Failed to save member media.");
}

export async function uploadMemberMedia({ token, member, file, dataBase64, orientation }) {
  let response;

  try {
    response = await fetch(`${baseUrl}/store/member-media/upload`, {
      method: "POST",
      headers: commonHeaders,
      body: JSON.stringify({
        token,
        member,
        fileName: file.name,
        contentType: file.type || "application/octet-stream",
        size: file.size,
        orientation,
        dataBase64,
      }),
    });
  } catch (error) {
    throw new Error("Upload could not reach the backend. Try refreshing the page, then upload a smaller image.");
  }

  return parseResponse(response, "Failed to upload member media.");
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      resolve({
        image,
        width: image.naturalWidth || image.width,
        height: image.naturalHeight || image.height,
        close: () => URL.revokeObjectURL(url),
      });
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read this image. Try a JPG or PNG file."));
    };
    image.src = url;
  });
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
          return;
        }

        reject(new Error("Could not prepare this image for upload."));
      },
      type,
      quality,
    );
  });
}

export async function prepareImageForUpload(file) {
  if (!file?.type?.startsWith("image/")) {
    throw new Error("Upload an image file for the bio rotation.");
  }

  const loaded = await loadImage(file);

  try {
    const scale = Math.min(1, optimizedImageMaxDimension / Math.max(loaded.width, loaded.height));
    const width = Math.max(1, Math.round(loaded.width * scale));
    const height = Math.max(1, Math.round(loaded.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Could not prepare this image for upload.");
    }

    context.drawImage(loaded.image, 0, 0, width, height);

    const blob = await canvasToBlob(canvas, "image/jpeg", optimizedImageQuality);
    const baseName =
      file.name
        .replace(/\.[^.]+$/, "")
        .replace(/[^a-z0-9]+/gi, "-")
        .replace(/^-+|-+$/g, "")
        .toLowerCase() || "member-bio-image";

    const optimizedFile = new File([blob], `${baseName}.jpg`, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });

    return {
      file: optimizedFile,
      width,
      height,
      orientation: height > width ? "portrait" : "landscape",
    };
  } finally {
    loaded.close();
  }
}

export function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      resolve(result.includes(",") ? result.split(",").pop() : result);
    };
    reader.onerror = () => reject(reader.error || new Error("Failed to read file."));
    reader.readAsDataURL(file);
  });
}
