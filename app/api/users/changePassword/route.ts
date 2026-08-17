import { createClient } from "@/lib/server";

export async function PATCH(req: Request) {
  try {
    const supabase = await createClient();
    const { currentPassword, newPassword } = await req.json();
    if (!currentPassword || !newPassword) {
      return Response.json(
        { error: "Missing Values provided" },
        { status: 400 },
      );
    }
    if (typeof newPassword != "string" || !newPassword.trim()) {
      return Response.json({ error: "Invalid new Password" }, { status: 400 });
    }
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError) {
      return Response.json({ error: userError.message }, { status: 400 });
    }
    if (!user) {
      return Response.json({ error: "User not found" }, { status: 400 });
    }
    if (!user.email) {
      return Response.json({ error: "User email not found" }, { status: 400 });
    }
    const { error: passwordError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });
    if (passwordError) {
      return Response.json(
        { error: "Current Password is incorrect" },
        { status: 400 },
      );
    }
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (updateError) {
      return Response.json(
        { error: updateError.message},
        { status: 400 },
      );
    }
    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    return Response.json({ error: "Server Error" }, { status: 500 });
  }
}
