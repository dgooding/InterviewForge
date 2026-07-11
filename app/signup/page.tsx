import { redirect } from "next/navigation";

/** Auth removed — redirect legacy /signup links to the app. */
export default function SignupPage() {
  redirect("/dashboard");
}
