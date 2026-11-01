import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { UserRole, ROLE_CONFIGS } from "@/types/roles";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/login");
  }

  const role = (session.user.role as UserRole) || UserRole.STAFF;
  const targetPath = ROLE_CONFIGS[role]?.defaultPath || "/dashboard/staff";

  redirect(targetPath);
}
