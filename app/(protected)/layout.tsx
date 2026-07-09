import { createClient } from "@/lib/server";
import { redirect } from "next/navigation";
import SideBar from "./sidebar";

export default async function ProtectedLayer({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }
  return (
    <div className="flex min-h-screen">
      <SideBar user={user}></SideBar>
      <div className="min-h-screen w-screen bg-[#1c2626]">{children}</div>
    </div>
  );
}
