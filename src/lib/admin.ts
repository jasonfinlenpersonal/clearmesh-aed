import "server-only";
import { redirect } from "next/navigation";
import { auth, isAdminEmail } from "@/auth";

/** For admin pages: sends anyone who isn't an admin to the sign-in page. */
export async function requireAdminPage(): Promise<string> {
  const session = await auth();
  const email = session?.user?.email;
  if (!email || !isAdminEmail(email)) redirect("/admin/signin");
  return email;
}

/** For server actions and API routes: throws instead of redirecting. */
export async function requireAdmin(): Promise<string> {
  const session = await auth();
  const email = session?.user?.email;
  if (!email || !isAdminEmail(email)) throw new Error("Not authorised");
  return email;
}

export async function currentAdminEmail(): Promise<string | null> {
  const session = await auth();
  const email = session?.user?.email;
  return email && isAdminEmail(email) ? email : null;
}
