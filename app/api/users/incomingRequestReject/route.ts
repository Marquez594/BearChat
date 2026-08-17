import { createClient } from "@/lib/server";

export async function DELETE(req: Request) {
  try {
    const supabase = await createClient();
    const { friendID } = await req.json();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (!user || userError) {
      return Response.json(
        { error: userError?.message || "User not logged in" },
        { status: 404 },
      );
    }
    const { data: validFriendID, error: validFriendIDError } = await supabase
      .from("users")
      .select("uid")
      .eq("uid", friendID)
      .single();

    if (validFriendIDError) {
      return Response.json(
        { error: validFriendIDError?.message },
        { status: 400 },
      );
    }

    const { error: deleteError } = await supabase
      .from("friend_request")
      .delete()
      .eq("receiver_uid", user.id)
      .eq("sender_uid", validFriendID.uid);

    if (deleteError) {
      return Response.json({ error: deleteError?.message }, { status: 400 });
    }
    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    return Response.json({ error: "Server Error" }, { status: 500 });
  }
}
