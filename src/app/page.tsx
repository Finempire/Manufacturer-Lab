import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getRoleDashboardPath } from "@/lib/rbac";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (session?.user) {
    redirect(getRoleDashboardPath(session.user.role));
  }

  redirect("/login");
}
