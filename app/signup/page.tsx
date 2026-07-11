import { redirect } from "next/navigation";

/** Signup is handled on the login page create-account tab. */
export default function SignupPage() {
  redirect("/login?mode=signup");
}
