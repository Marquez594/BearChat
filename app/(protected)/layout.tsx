import { createClient } from "@/lib/server";
import { redirect } from "next/navigation";
import SideBar from "./sidebar";
import IncomingCalls from "./incomingCall";
import { UserProvider } from "@/components/userContext";

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
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("uid", user.id)
    .single();

  if (error) {
    console.log(error?.message);
  }
  return (
    <UserProvider user={data}>
      <div className="flex min-h-screen">
        <SideBar user={user}></SideBar>
        <IncomingCalls userID={user.id}></IncomingCalls>
        <div className="min-h-screen w-screen bg-[#1c2626]">{children}</div>
      </div>
    </UserProvider>
  );
}
