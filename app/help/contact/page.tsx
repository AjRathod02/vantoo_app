import { redirect } from "next/navigation";

/** Legacy Help Center contact path — canonical page is /contact */
export default function HelpContactRedirect() {
  redirect("/contact");
}
