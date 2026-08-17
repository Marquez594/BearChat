import { createClient } from "@/lib/server";

export async function POST(req: Request) {
  try {
    const { friendID } = await req.json();
    if (!friendID) {
      return Response.json({ error: "Missing friend id" }, { status: 400 });
    }
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return Response.json({ error: "User not permitted" }, { status: 401 });
    }
    const { data: friendData, error: friendError } = await supabase
      .from("users")
      .select("uid")
      .eq("uid", friendID)
      .single();

    if (!friendData || friendError) {
      return Response.json(
        { error: "Error in validating friend id" },
        { status: 400 },
      );
    }

    const { data: request, error: deleteRequest } = await supabase
      .from("friend_request")
      .delete()
      .eq("sender_uid", friendData.uid)
      .eq("receiver_uid", user.id)
      .select();

    if (deleteRequest) {
      return Response.json(
        { error: "Error in deleting friend request" },
        { status: 400 },
      );
    }
    if (request.length === 0) {
      return Response.json(
        {
          error: "Friend Request does not exist",
        },
        { status: 404 },
      );
    }
    const { error: addFriendError } = await supabase.from("friends").insert({
      user1_uid: user.id,
      user2_uid: friendData.uid,
    });

    if (addFriendError) {
      return Response.json({ error: addFriendError?.message }, { status: 400 });
    }
    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    return Response.json({ error: "Server Error" }, { status: 500 });
  }
}
