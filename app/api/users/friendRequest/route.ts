import { createClient } from "@/lib/server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return Response.json({ error: "User not authorized" }, { status: 401 });
    }
    const { receiverID } = await req.json();
    if (!receiverID) {
      return Response.json({ error: "Receiver id required" }, { status: 400 });
    }

    const { data: receiver, error } = await supabase
      .from("users")
      .select("uid")
      .eq("uid", receiverID)
      .single();

    if (!receiver || error) {
      return Response.json({ error: "User does not exist" }, { status: 404 });
    }
    if (user.id == receiver.uid) {
      return Response.json(
        { error: "Sending friend request to yourself" },
        { status: 400 },
      );
    }

    const { data: existing } = await supabase
      .from("friend_request")
      .select("id")
      .eq("sender_uid", user.id)
      .eq("receiver_uid", receiver.uid)
      .maybeSingle();

    if (existing) {
      return Response.json(
        { error: "Friend Request already sent" },
        { status: 409 },
      );
    }

    const { error: friendRequestError } = await supabase
      .from("friend_request")
      .insert({
        sender_uid: user.id,
        receiver_uid: receiver.uid,
      });
    if (friendRequestError) {
      return Response.json(
        { error: friendRequestError?.message },
        { status: 400 },
      );
    }
    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    return Response.json({ error: "Server Error" }, { status: 500 });
  }
}
