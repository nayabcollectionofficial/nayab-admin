import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/session";
import LoginForm from "./LoginForm";

export default async function LoginPage() {
  if (await isAuthenticated()) redirect("/");

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <LoginForm />
    </main>
  );
}
