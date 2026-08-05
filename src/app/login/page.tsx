import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import LoginForm from "./LoginForm";
import { APP_VERSION } from "@/lib/version";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const session = await getSession();
  if (session.user) {
    redirect("/");
  }
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 px-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-xl ring-1 ring-slate-200 p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-lg bg-brand-600 text-white grid place-items-center font-bold">
              T
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-900">Tickets</h1>
              <p className="text-xs text-slate-500">Task notes for your team</p>
            </div>
          </div>
          <LoginForm />
        </div>
        <p className="text-center text-xs text-slate-400 mt-6">
          Tickets {APP_VERSION}
        </p>
      </div>
    </main>
  );
}
