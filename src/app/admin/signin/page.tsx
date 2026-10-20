import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { signIn } from "@/auth";
import { currentAdminEmail } from "@/lib/admin";

export const metadata: Metadata = { title: "Volunteer sign-in", robots: { index: false } };
export const dynamic = "force-dynamic";

const ERRORS: Record<string, string> = {
  AccessDenied: "That Google account isn't on the volunteer list. Ask the site owner to add it.",
  Configuration: "Sign-in isn't configured on this server yet.",
};

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await currentAdminEmail()) redirect("/admin");
  const { error } = await searchParams;

  return (
    <div className="mx-auto w-full max-w-sm space-y-4 px-4 py-12">
      <h1 className="text-2xl font-bold">Volunteer sign-in</h1>
      <p className="text-slate-600">For people who review AED submissions. Everyone else can use the site without signing in.</p>
      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{ERRORS[error] ?? "Sign-in failed. Please try again."}</p>}
      <form
        action={async () => {
          "use server";
          await signIn("google", { redirectTo: "/admin" });
        }}
      >
        <button type="submit" className="btn-primary w-full">
          Sign in with Google
        </button>
      </form>
    </div>
  );
}
