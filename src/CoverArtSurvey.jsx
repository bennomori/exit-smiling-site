import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { memberNamesBySlug, memberSlugs } from "./memberBioMedia";
import { loginMemberMedia } from "./memberMediaApi";
import { getCoverArtSurvey, saveCoverArtVote, updateCoverArtDesign, uploadCoverArtDesign } from "./coverArtApi";

const memberOptions = Object.entries(memberSlugs).map(([name, slug]) => ({ name, slug }));
const scoreOptions = [5, 4, 3, 2, 1];
const maxSourceUploadBytes = 40 * 1024 * 1024;

function getFeedbackForDesign(feedback, designId) {
  return feedback?.[designId] || {};
}

function getAverageScore(feedbackByMember) {
  const scores = Object.values(feedbackByMember || {})
    .map((vote) => Number(vote?.score || 0))
    .filter((score) => score > 0);

  if (!scores.length) return null;
  return scores.reduce((sum, score) => sum + score, 0) / scores.length;
}

function formatDate(value) {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat("en-AU", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return "";
  }
}

function getVoteComments(vote) {
  if (Array.isArray(vote?.comments) && vote.comments.length) {
    return vote.comments;
  }

  if (vote?.comment) {
    return [{ text: vote.comment, createdAt: vote.updatedAt }];
  }

  return [];
}

function AutoGrowTextarea({ value, onChange, ...props }) {
  const resize = (element) => {
    if (!element) return;
    element.style.height = "auto";
    element.style.height = `${element.scrollHeight}px`;
  };

  return (
    <textarea
      {...props}
      value={value}
      onChange={(event) => {
        onChange(event);
        resize(event.currentTarget);
      }}
      onInput={(event) => resize(event.currentTarget)}
      ref={resize}
    />
  );
}

function CoverArtCard({
  design,
  feedbackByMember,
  currentMember,
  voteDraft,
  onDraftChange,
  onSaveVote,
  savingVote,
  attributionOptions,
  editDraft,
  onEditDraftChange,
  onSaveDesign,
  savingDesign,
}) {
  const averageScore = getAverageScore(feedbackByMember);
  const voteCount = Object.values(feedbackByMember || {}).filter((vote) => Number(vote?.score || 0) > 0).length;
  const memberVote = currentMember ? feedbackByMember?.[currentMember] : null;
  const draft = voteDraft || {
    score: memberVote?.score || 0,
    comment: "",
  };

  return (
    <article className="group overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.035] shadow-[0_24px_70px_rgba(0,0,0,0.34)]">
      <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="relative bg-black/60 p-4">
          <div className="absolute left-5 top-5 z-10 rounded-full border border-yellow-100/30 bg-black/60 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-yellow-100/85 backdrop-blur">
            {design.source === "starter" ? "Starter concept" : "Uploaded concept"}
          </div>
          <button
            type="button"
            className="block w-full overflow-hidden rounded-[1.5rem] border border-white/10 bg-black text-left"
            onClick={() => window.open(design.src, "_blank", "noopener,noreferrer")}
          >
            <img
              src={design.src}
              alt={design.title}
              loading="lazy"
              decoding="async"
              className="max-h-[560px] w-full object-contain transition duration-500 group-hover:scale-[1.015]"
            />
          </button>
        </div>

        <div className="flex flex-col p-5 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-white/38">Debut single vinyl artwork</p>
              <h2 className="mt-2 text-2xl font-black uppercase leading-none text-white md:text-3xl">{design.title}</h2>
              <p className="mt-2 text-sm text-white/48">
                Uploaded by <span className="font-semibold text-white/80">{design.uploadedBy}</span>
                {design.uploadedAt ? ` / ${formatDate(design.uploadedAt)}` : ""}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-right">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">Band average</p>
              <p className="mt-1 text-3xl font-black text-yellow-100">
                {averageScore ? averageScore.toFixed(1) : "-"}
              </p>
              <p className="text-[10px] uppercase tracking-[0.18em] text-white/35">{voteCount} votes</p>
            </div>
          </div>

          <div className="mt-5 rounded-3xl border border-white/10 bg-white/[0.025] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-white/52">Artwork details</p>
              <p className="text-[10px] uppercase tracking-[0.16em] text-white/32">Edit title / attribution</p>
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-[1fr_190px]">
              <input
                type="text"
                value={editDraft?.title ?? design.title}
                disabled={!currentMember}
                onChange={(event) => onEditDraftChange(design.id, {
                  title: event.target.value,
                  uploadedBy: editDraft?.uploadedBy ?? design.uploadedBy,
                })}
                className="rounded-full border border-white/12 bg-black/45 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/24 focus:border-yellow-100/55 disabled:cursor-not-allowed disabled:opacity-40"
                placeholder="Artwork title"
              />
              <select
                value={editDraft?.uploadedBy ?? design.uploadedBy}
                disabled={!currentMember}
                onChange={(event) => onEditDraftChange(design.id, {
                  title: editDraft?.title ?? design.title,
                  uploadedBy: event.target.value,
                })}
                className="rounded-full border border-white/12 bg-black/45 px-4 py-3 text-sm text-white outline-none transition focus:border-yellow-100/55 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {(attributionOptions.length ? attributionOptions : ["Joey", "Cadence", "Lando", "Julian", "Max", "Band"]).map((option) => (
                  <option key={`${design.id}-${option}`} value={option}>{option}</option>
                ))}
              </select>
            </div>
            <button
              type="button"
              disabled={!currentMember || savingDesign}
              onClick={() => onSaveDesign(design.id)}
              className="mt-3 w-full rounded-full border border-white/16 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-white/72 transition hover:border-white/35 hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
            >
              {savingDesign ? "Saving details..." : "Save artwork details"}
            </button>
          </div>

          <div className="mt-6 rounded-3xl border border-white/10 bg-black/28 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-white/52">Your preference</p>
              {memberVote?.updatedAt ? (
                <p className="text-[10px] uppercase tracking-[0.16em] text-white/32">Saved {formatDate(memberVote.updatedAt)}</p>
              ) : null}
            </div>

            <div className="mt-3 grid grid-cols-5 gap-2">
              {scoreOptions.map((score) => (
                <button
                  key={`${design.id}-${score}`}
                  type="button"
                  disabled={!currentMember}
                  onClick={() => onDraftChange(design.id, { ...draft, score })}
                  className={`rounded-2xl border px-2 py-3 text-center transition ${
                    Number(draft.score) === score
                      ? "border-yellow-100 bg-yellow-100 text-black"
                      : "border-white/12 bg-white/[0.035] text-white/58 hover:border-white/30 hover:text-white"
                  } disabled:cursor-not-allowed disabled:opacity-35`}
                >
                  <span className="block text-lg font-black">{score}</span>
                  <span className="block text-[9px] font-black uppercase tracking-[0.12em]">
                    {score === 5 ? "Top" : score === 1 ? "Low" : "Vote"}
                  </span>
                </button>
              ))}
            </div>

            <AutoGrowTextarea
              value={draft.comment}
              disabled={!currentMember}
              onChange={(event) => onDraftChange(design.id, { ...draft, comment: event.target.value })}
              rows={2}
              className="mt-3 min-h-[72px] w-full resize-none overflow-hidden rounded-2xl border border-white/12 bg-black/55 px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-white/24 focus:border-yellow-100/55 disabled:cursor-not-allowed disabled:opacity-40"
              placeholder="Add a new comment. Earlier comments are kept below."
            />
            <button
              type="button"
              disabled={!currentMember || savingVote}
              onClick={() => onSaveVote(design.id)}
              className="mt-3 w-full rounded-full bg-white px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-35"
            >
              {savingVote ? "Saving..." : "Save vote / add comment"}
            </button>
          </div>

          <div className="mt-5">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-white/42">Band feedback</p>
            <div className="mt-3 space-y-2">
              {Object.entries(feedbackByMember || {}).length ? (
                Object.entries(feedbackByMember).map(([member, vote]) => (
                  <div key={`${design.id}-${member}`} className="rounded-2xl border border-white/8 bg-white/[0.025] p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-white/72">
                        {memberNamesBySlug[member] || member}
                      </p>
                      <p className="rounded-full border border-yellow-100/20 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-yellow-100">
                        {vote.score}/5
                      </p>
                    </div>
                    {getVoteComments(vote).length ? (
                      <div className="mt-3 space-y-2">
                        {getVoteComments(vote).map((comment, index) => (
                          <div key={`${design.id}-${member}-comment-${index}`} className="rounded-xl border border-white/8 bg-black/24 px-3 py-2">
                            <p className="text-sm leading-6 text-white/58">{comment.text}</p>
                            {comment.createdAt ? (
                              <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-white/28">
                                {formatDate(comment.createdAt)}
                              </p>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))
              ) : (
                <p className="rounded-2xl border border-white/8 bg-white/[0.025] p-3 text-sm text-white/38">
                  No votes yet.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function CoverArtSurvey() {
  const [selectedMember, setSelectedMember] = useState("joey");
  const [passcode, setPasscode] = useState("");
  const [token, setToken] = useState("");
  const [designs, setDesigns] = useState([]);
  const [feedback, setFeedback] = useState({});
  const [attributionOptions, setAttributionOptions] = useState([]);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadedBy, setUploadedBy] = useState("Joey");
  const [status, setStatus] = useState({ tone: "idle", message: "" });
  const [uploading, setUploading] = useState(false);
  const [savingDesignId, setSavingDesignId] = useState("");
  const [savingEditDesignId, setSavingEditDesignId] = useState("");
  const [voteDrafts, setVoteDrafts] = useState({});
  const [editDrafts, setEditDrafts] = useState({});

  const memberName = memberNamesBySlug[selectedMember] || selectedMember;
  const isLoggedIn = Boolean(token);

  const rankedDesigns = useMemo(() => {
    return [...designs].sort((a, b) => {
      const aAverage = getAverageScore(getFeedbackForDesign(feedback, a.id)) || 0;
      const bAverage = getAverageScore(getFeedbackForDesign(feedback, b.id)) || 0;
      if (aAverage !== bAverage) return bAverage - aAverage;
      return new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
    });
  }, [designs, feedback]);

  const loadSurvey = async () => {
    const data = await getCoverArtSurvey();
    setDesigns(data.designs || []);
    setFeedback(data.feedback || {});
    setAttributionOptions(data.attributionOptions || []);
  };

  useEffect(() => {
    loadSurvey().catch((error) => {
      setStatus({ tone: "error", message: error.message || "Could not load cover-art survey." });
    });
  }, []);

  const handleLogin = async (event) => {
    event.preventDefault();
    setStatus({ tone: "pending", message: "Checking passcode..." });

    try {
      const result = await loginMemberMedia({ member: selectedMember, passcode });
      setToken(result.token);
      setStatus({ tone: "success", message: `Logged in as ${result.memberName || memberName}.` });
    } catch (error) {
      setToken("");
      setStatus({ tone: "error", message: error.message || "Login failed." });
    }
  };

  const handleDraftChange = (designId, draft) => {
    setVoteDrafts((current) => ({
      ...current,
      [designId]: draft,
    }));
  };

  const handleEditDraftChange = (designId, draft) => {
    setEditDrafts((current) => ({
      ...current,
      [designId]: draft,
    }));
  };

  const handleSaveDesign = async (designId) => {
    const design = designs.find((item) => item.id === designId);
    const draft = editDrafts[designId] || design;
    setSavingEditDesignId(designId);
    setStatus({ tone: "pending", message: "Saving artwork details..." });

    try {
      const result = await updateCoverArtDesign({
        token,
        member: selectedMember,
        designId,
        title: draft.title || design?.title || "",
        uploadedBy: draft.uploadedBy || design?.uploadedBy || "Band",
      });
      setDesigns(result.designs || []);
      setStatus({ tone: "success", message: "Artwork details saved." });
    } catch (error) {
      setStatus({ tone: "error", message: error.message || "Artwork update failed." });
    } finally {
      setSavingEditDesignId("");
    }
  };

  const handleSaveVote = async (designId) => {
    const existing = feedback?.[designId]?.[selectedMember] || {};
    const draft = voteDrafts[designId] || existing;
    setSavingDesignId(designId);
    setStatus({ tone: "pending", message: "Saving vote..." });

    try {
      const result = await saveCoverArtVote({
        token,
        member: selectedMember,
        designId,
        score: draft.score || 0,
        comment: draft.comment || "",
      });
      setFeedback(result.feedback || {});
      setVoteDrafts((current) => ({
        ...current,
        [designId]: {
          score: draft.score || 0,
          comment: "",
        },
      }));
      setStatus({ tone: "success", message: "Vote saved." });
    } catch (error) {
      setStatus({ tone: "error", message: error.message || "Vote save failed." });
    } finally {
      setSavingDesignId("");
    }
  };

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;
    if (!token) {
      setStatus({ tone: "error", message: "Log in before uploading artwork." });
      return;
    }
    if (!file.type.startsWith("image/")) {
      setStatus({ tone: "error", message: "Upload an image file." });
      return;
    }
    if (file.size > maxSourceUploadBytes) {
      setStatus({ tone: "error", message: "File is over 40MB. Use a smaller image." });
      return;
    }

    setUploading(true);
    setStatus({ tone: "pending", message: "Optimising and uploading artwork..." });

    try {
      const result = await uploadCoverArtDesign({
        token,
        member: selectedMember,
        file,
        title: uploadTitle,
        uploadedBy,
      });
      setDesigns((current) => [...current, result.design]);
      setUploadTitle("");
      setStatus({ tone: "success", message: "Artwork uploaded. Band members can now vote on it." });
    } catch (error) {
      setStatus({ tone: "error", message: error.message || "Upload failed." });
    } finally {
      setUploading(false);
    }
  };

  const statusClass =
    status.tone === "error"
      ? "border-red-400/30 bg-red-500/10 text-red-100"
      : status.tone === "success"
        ? "border-emerald-300/30 bg-emerald-400/10 text-emerald-100"
        : status.tone === "pending"
          ? "border-yellow-200/30 bg-yellow-200/10 text-yellow-50"
          : "border-white/10 bg-white/[0.035] text-white/60";

  return (
    <main className="min-h-screen bg-[#050505] px-5 py-8 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="relative overflow-hidden rounded-[2.4rem] border border-white/10 bg-[radial-gradient(circle_at_18%_12%,rgba(250,204,21,0.18),transparent_28%),linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-6 shadow-[0_30px_100px_rgba(0,0,0,0.42)] md:p-8">
          <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-yellow-100/12 blur-3xl" />
          <div className="relative z-10 flex flex-wrap items-start justify-between gap-5">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.35em] text-yellow-100/65">Exit Smiling Private Survey</p>
              <h1 className="mt-3 max-w-4xl text-4xl font-black uppercase leading-[0.9] md:text-6xl">
                Debut Single Vinyl Cover Vote
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-white/62">
                Upload artwork concepts, vote from 1-5, and leave clear feedback so the band can choose the strongest cover direction.
              </p>
            </div>
            <Link to="/" className="rounded-full border border-white/18 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-white/70 transition hover:border-white/40 hover:text-white">
              Back to site
            </Link>
          </div>
        </div>

        <section className="mt-6 grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          <form onSubmit={handleLogin} className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-white/42">Member login</p>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5 lg:grid-cols-3">
              {memberOptions.map((member) => (
                <button
                  key={member.slug}
                  type="button"
                  onClick={() => {
                    setSelectedMember(member.slug);
                    setToken("");
                    setPasscode("");
                  }}
                  className={`rounded-2xl border px-4 py-3 text-left text-xs font-black uppercase tracking-[0.14em] transition ${
                    selectedMember === member.slug
                      ? "border-yellow-100 bg-yellow-100 text-black"
                      : "border-white/10 bg-black/35 text-white/62 hover:border-white/30 hover:text-white"
                  }`}
                >
                  {member.name}
                </button>
              ))}
            </div>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <input
                type="password"
                value={passcode}
                onChange={(event) => setPasscode(event.target.value)}
                className="min-w-0 flex-1 rounded-full border border-white/15 bg-black px-4 py-3 text-sm text-white outline-none transition focus:border-yellow-100/60"
                placeholder={`${memberName} passcode`}
              />
              <button type="submit" className="rounded-full bg-white px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-black transition hover:opacity-90">
                Log in
              </button>
            </div>
          </form>

          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-white/42">Upload concept</p>
                <p className="mt-2 text-sm leading-6 text-white/52">Uploads are stored in R2 and added to the voting lineup immediately.</p>
              </div>
              <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${isLoggedIn ? "border-emerald-300/35 text-emerald-100" : "border-white/12 text-white/38"}`}>
                {isLoggedIn ? `Logged in: ${memberName}` : "Login required"}
              </span>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-[1fr_180px_auto]">
              <input
                type="text"
                value={uploadTitle}
                onChange={(event) => setUploadTitle(event.target.value)}
                className="rounded-full border border-white/15 bg-black px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/24 focus:border-yellow-100/60"
                placeholder="Artwork title, e.g. Yellow rounded mark"
              />
              <select
                value={uploadedBy}
                onChange={(event) => setUploadedBy(event.target.value)}
                className="rounded-full border border-white/15 bg-black px-4 py-3 text-sm text-white outline-none transition focus:border-yellow-100/60"
              >
                {(attributionOptions.length ? attributionOptions : ["Joey", "Cadence", "Lando", "Julian", "Max", "Band"]).map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              <label className={`cursor-pointer rounded-full border px-5 py-3 text-center text-xs font-black uppercase tracking-[0.16em] transition ${
                isLoggedIn && !uploading
                  ? "border-yellow-100 bg-yellow-100 text-black hover:opacity-90"
                  : "cursor-not-allowed border-white/10 text-white/30"
              }`}>
                {uploading ? "Uploading..." : "Upload image"}
                <input
                  type="file"
                  accept="image/*"
                  disabled={!isLoggedIn || uploading}
                  onChange={handleUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </section>

        <div className={`mt-5 rounded-2xl border p-4 text-sm ${statusClass}`}>
          {status.message || "Select your name, log in, then vote or upload artwork."}
        </div>

        <section className="mt-8 space-y-6">
          {rankedDesigns.length ? (
            rankedDesigns.map((design) => (
              <CoverArtCard
                key={design.id}
                design={design}
                feedbackByMember={getFeedbackForDesign(feedback, design.id)}
                currentMember={isLoggedIn ? selectedMember : ""}
                voteDraft={voteDrafts[design.id]}
                onDraftChange={handleDraftChange}
                onSaveVote={handleSaveVote}
                savingVote={savingDesignId === design.id}
                attributionOptions={attributionOptions}
                editDraft={editDrafts[design.id]}
                onEditDraftChange={handleEditDraftChange}
                onSaveDesign={handleSaveDesign}
                savingDesign={savingEditDesignId === design.id}
              />
            ))
          ) : (
            <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-8 text-center text-white/50">
              No artwork concepts loaded yet.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
