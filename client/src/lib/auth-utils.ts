import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";


export async function getAuthSession(redirectTo = "/auth/signin") {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect(redirectTo);
  }
  
  return session;
}


export async function checkUserRole(allowedRoles: string[], redirectTo = "/unauthorized") {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/auth/signin");
  }
  
  if (!allowedRoles.includes(session.user.role)) {
    redirect(redirectTo);
  }
  
  return session;
}
