import { redirect } from "next/navigation";

/**
 * Alias for the mock interview simulator.
 * Supports /mock-interview and /mock-interview?mode=behavioral
 */
export default function MockInterviewAliasPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const mode = searchParams?.mode;
  const q = searchParams?.q;
  const category = searchParams?.category;
  const autostart = searchParams?.autostart;

  if (typeof mode === "string" && mode) {
    const params = new URLSearchParams();
    if (typeof q === "string") params.set("q", q);
    if (typeof category === "string") params.set("category", category);
    if (typeof autostart === "string") params.set("autostart", autostart);
    const qs = params.toString();
    redirect(`/interview/${mode}${qs ? `?${qs}` : ""}`);
  }

  if (typeof q === "string" && q) {
    redirect(
      `/interview?q=${encodeURIComponent(q)}${
        autostart === "1" ? "&autostart=1" : ""
      }`
    );
  }

  redirect("/interview");
}
