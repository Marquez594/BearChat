import { createClient } from "@/lib/server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { content } = await req.json();

    if (!content?.trim()) {
      return Response.json(
        { error: "Message cannot be empty" },
        { status: 400 },
      );
    }
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
      .select("id")
      .eq("id", conversationID)
      .or(`user1_uid.eq.${user.id},user2_uid.eq.${user.id}`)
      .maybeSingle();

    if (conversationError) {
      return Response.json(
        { error: conversationError.message },
        { status: 400 },
      );
    }

    if (!conversation) {
      return Response.json(
        { error: "Conversation not found or access denied" },
        { status: 403 },
      );
    }
    const { data: newMessage, error: newMessageError } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversation.id,
        sender_id: user.id,
        content,
      })
      .select()
      .single();
    if (newMessageError) {
      return Response.json(
        { error: newMessageError?.message },
        { status: 400 },
      );
    }
    const { error: updateLastMessageIdError } = await supabase
      .from("conversations")
      .update({
        last_message_id: newMessage.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", conversation.id);
    if (updateLastMessageIdError) {
      return Response.json(
        { error: updateLastMessageIdError?.message },
        { status: 400 },
      );
    }
    return Response.json(newMessage, { status: 201 });
  } catch (error) {
    return Response.json({ error: "Server Error" }, { status: 500 });
  }
}
