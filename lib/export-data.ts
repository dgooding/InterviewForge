import { exportProgressSnapshot } from "./storage";

/** Download a private JSON export of all local progress (user-owned data). */
export function downloadProgressExport(): void {
  const snapshot = exportProgressSnapshot();
  const blob = new Blob([JSON.stringify(snapshot, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const date = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `interviewforge-export-${date}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
