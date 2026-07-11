import { redirect } from "next/navigation";

/** Alias route — keeps existing /interview page as source of truth. */
export default function MockInterviewAliasPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const mode = searchParams?.mode;
  const q =
    typeof mode === "string" && mode
      ? `?mode=${encodeURIComponent(mode)}`
      : "";
  redirect(`/interview${q}`);
}
