import { redirect } from "next/navigation";

/** Auth removed — redirect legacy /login links to the app. */
export default function LoginPage() {
  redirect("/dashboard");
}
