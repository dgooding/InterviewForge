import { redirect } from "next/navigation";

/** Alias route — keeps existing /resume page as source of truth. */
export default function AnalyzeResumeAliasPage() {
  redirect("/resume");
}
