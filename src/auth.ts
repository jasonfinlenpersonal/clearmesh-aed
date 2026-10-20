import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

// Re-read on every check, so removing an address from ADMIN_EMAILS (and
// restarting the container) revokes access even for existing sessions.
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const allowed = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return allowed.includes(email.toLowerCase());
}

// Reads AUTH_SECRET, AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET and AUTH_URL from the environment.
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  // TLS ends at Cloudflare; nginx forwards the original host.
  trustHost: true,
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  pages: { signIn: "/admin/signin", error: "/admin/signin" },
  callbacks: {
    signIn({ account, profile }) {
      return (
        account?.provider === "google" &&
        profile?.email_verified === true &&
        isAdminEmail(profile.email)
      );
    },
  },
});
