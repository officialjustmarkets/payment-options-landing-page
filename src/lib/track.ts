import { logAuditEvent } from "./audit.functions";

type TrackInput = Omit<Parameters<typeof logAuditEvent>[0]["data"], "session_id">;

function sessionId() {
  const key = "funding_session_id";
  let id = localStorage.getItem(key);
  if (!id) { id = crypto.randomUUID(); localStorage.setItem(key, id); }
  return id;
}

export function newReferenceId() {
  return `TX-${10000 + (crypto.getRandomValues(new Uint32Array(1))[0] % 90000)}`;
}

export function track(event: TrackInput) {
  if (typeof window === "undefined") return;
  logAuditEvent({ data: { ...event, session_id: sessionId() } }).catch(() => {});
}
