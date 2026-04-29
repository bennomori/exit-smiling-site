import { useEffect, useState } from "react";

const previewAccessStorageKey = "exit_smiling_preview_access";
const previewUsername = "ES";
const previewPassword = "bakedbeans";

export default function PreviewGate({ children }) {
  const [authorized, setAuthorized] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (localStorage.getItem(previewAccessStorageKey) === "granted") {
      setAuthorized(true);
    }
  }, []);

  const handleSubmit = (event) => {
    event.preventDefault();

    if (username.trim() === previewUsername && password === previewPassword) {
      localStorage.setItem(previewAccessStorageKey, "granted");
      setAuthorized(true);
      setError("");
      return;
    }

    setError("Incorrect username or password.");
  };

  if (authorized) {
    return children;
  }

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black">
      <div className="mx-auto flex min-h-screen max-w-md items-center px-6 py-12">
        <div className="w-full rounded-3xl border border-white/10 bg-white/[0.03] p-8 shadow-[0_0_40px_rgba(255,255,255,0.08)]">
          <div className="mb-6 text-center">
            <p className="text-[10px] uppercase tracking-[0.32em] text-white/45">Preview Access</p>
            <h1 className="mt-3 text-3xl font-black uppercase text-white">Exit Smiling</h1>
            <p className="mt-3 text-sm text-white/60">This preview is temporarily password protected.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Username"
              className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/30"
            />
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
              className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/30"
            />
            {error ? <p className="text-sm text-red-400">{error}</p> : null}
            <button
              type="submit"
              className="w-full rounded-full bg-white px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-black transition hover:opacity-90"
            >
              Enter Site
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
