import { redirect } from "next/navigation";

/** Signup redirects to login (Google is the account path). */
export default function SignupPage() {
  redirect("/login");
}
