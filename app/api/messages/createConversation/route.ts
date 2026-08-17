import { createClient } from "@/lib/server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError) {
      return Response.json({ error: userError?.message }, { status: 400 });
    }
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { user2 } = await req.json();
    if (!user2) {
      return Response.json(
        { error: "No user id provided for other user" },
        { status: 400 },
      );
    }
    if (user.id === user2) {
      return Response.json(
        { error: "You cannot message yourself." },
        { status: 400 },
      );
    }

    const { data: validUser2ID, error: validUser2IDError } = await supabase
      .from("users")
      .select("uid")
      .eq("uid", user2)
      .single();
    if (validUser2IDError) {
      return Response.json(
        { error: validUser2IDError?.message },
        { status: 404 },
      );
    }

    const { data: conversation, error: conversationError } = await supabase
      .from("conversations")
      .select("id")
      .or(
        `and(user1_uid.eq.${user?.id},user2_uid.eq.${validUser2ID.uid}),and(user1_uid.eq.${validUser2ID.uid},user2_uid.eq.${user?.id})`,
      )
      .maybeSingle();

    if (conversationError) {
      return Response.json(
        { error: conversationError?.message },
        { status: 400 },
      );
    }
    if (conversation) {
      return Response.json(
        { conversationID: conversation.id },
        { status: 200 },
      );
    }

    const { data: newConversation, error: newConversationError } =
      await supabase
        .from("conversations")
        .insert({
          user1_uid: user?.id,
          user2_uid: validUser2ID.uid,
        })
        .select("id")
        .single();
    if (newConversationError) {
      return Response.json(
        { error: newConversationError?.message },
        { status: 400 },
      );
    }
    return Response.json(
      {
        conversationID: newConversation.id,
      },
      { status: 200 },
    );
  } catch (error) {
    return Response.json({ error: "Server Error" }, { status: 500 });
  }
}
