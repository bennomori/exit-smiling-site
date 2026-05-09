const CONTENT_TYPES = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  mp4: "video/mp4",
  mov: "video/quicktime",
};

function getContentType(key) {
  const extension = key.split(".").pop()?.toLowerCase();
  return CONTENT_TYPES[extension] || "application/octet-stream";
}

function parseRange(rangeHeader, size) {
  if (!rangeHeader) return null;

  const match = rangeHeader.match(/^bytes=(\d*)-(\d*)$/);
  if (!match) return null;

  const startValue = match[1];
  const endValue = match[2];

  let start;
  let end;

  if (startValue === "" && endValue !== "") {
    const suffixLength = Number(endValue);
    if (!Number.isFinite(suffixLength) || suffixLength <= 0) return null;
    start = Math.max(size - suffixLength, 0);
    end = size - 1;
  } else {
    start = Number(startValue);
    end = endValue === "" ? size - 1 : Number(endValue);
  }

  if (
    !Number.isFinite(start) ||
    !Number.isFinite(end) ||
    start < 0 ||
    end < start ||
    start >= size
  ) {
    return null;
  }

  return {
    offset: start,
    length: Math.min(end, size - 1) - start + 1,
  };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const key = decodeURIComponent(url.pathname.replace(/^\/+/, ""));

    if (!key) {
      return new Response("Exit Smiling media bucket", {
        headers: { "content-type": "text/plain; charset=utf-8" },
      });
    }

    const metadata = await env.EXIT_SMILING_MEDIA.head(key);

    if (!metadata) {
      return new Response("Not found", { status: 404 });
    }

    const range = parseRange(request.headers.get("range"), metadata.size);
    const object = await env.EXIT_SMILING_MEDIA.get(key, range ? { range } : undefined);

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);
    headers.set("content-type", object.httpMetadata?.contentType || getContentType(key));
    headers.set("cache-control", "public, max-age=31536000, immutable");
    headers.set("access-control-allow-origin", "*");
    headers.set("accept-ranges", "bytes");

    if (range) {
      const start = range.offset;
      const end = range.offset + range.length - 1;
      headers.set("content-range", `bytes ${start}-${end}/${metadata.size}`);
      headers.set("content-length", String(range.length));
      return new Response(request.method === "HEAD" ? null : object.body, {
        status: 206,
        headers,
      });
    }

    headers.set("content-length", String(metadata.size));

    return new Response(request.method === "HEAD" ? null : object.body, { headers });
  },
};
