import { createClient } from "@/lib/server";

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const conversationID = searchParams.get("conversationID");
    if (!conversationID) {
      return Response.json(
        { error: "No conversation id provided" },
        { status: 400 },
      );
    }
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (!user) {
      return Response.json(
        { error: "User could not be retrieved" },
        { status: 400 },
      );
    }
    if (userError) {
      return Response.json({ error: userError?.message }, { status: 400 });
    }
    const { data: conversation, error: conversationError } = await supabase
      .from("conversations")
      .select(
        `
    id,
    user1_uid,
    user2_uid,
    user1:users!conversations_user1_uid_fkey (
      uid,
      username,
      pfp,
      status
    ),
    user2:users!conversations_user2_uid_fkey (
      uid,
      username,
      pfp,
      status
    )
  `,
      )
      .eq("id", conversationID)
      .or(`user1_uid.eq.${user.id},user2_uid.eq.${user.id}`)
      .maybeSingle();

    if (conversationError) {
      return Response.json(
        { error: conversationError?.message },
        { status: 400 },
      );
    }
    if (!conversation) {
      return Response.json(
        { error: "Conversation not found" },
        { status: 403 },
      );
    }
    const otherUser =
      conversation?.user1_uid == user.id
        ? conversation.user2
        : conversation?.user1;
    const { data: messages, error: messagesError } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversation?.id)
      .order("created_at", { ascending: true });

    if (messagesError) {
      return Response.json({ error: messagesError?.message }, { status: 400 });
    }
    return Response.json(
      {
        current_user: user.id,
        otherUser,
        messages,
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    return Response.json({ error: "Server Error" }, { status: 500 });
  }
}
