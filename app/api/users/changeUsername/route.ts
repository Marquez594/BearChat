import { createClient } from "@/lib/server";

export async function PATCH(req: Request) {
  try {
    const supabase = await createClient();
    const { newUsername } = await req.json();
    if (typeof newUsername != "string") {
      return Response.json({ error: "Invalid Username" }, { status: 400 });
    }
    const username = newUsername.trim();
    if (!username) {
      return Response.json(
        { error: "No new username provided" },
        { status: 400 },
      );
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return Response.json(
        { error: userError?.message || "User not found" },
        { status: 401 },
      );
    }
    const { error: updateError } = await supabase
      .from("users")
      .update({
        username: username,
      })
      .eq("uid", user.id);
    if (updateError) {
      return Response.json({ error: updateError.message }, { status: 400 });
    }
    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    return Response.json({ error: "Server Error" }, { status: 500 });
  }
}
