import { createClient } from "@/lib/server";

type Conversation = {
  id: string;
  created_at: string;
  updated_at: string;
  last_message: {
    content: string;
  };
  user1: {
    uid: string;
    username: string;
    pfp: string;
    status: string;
  };
  user2: {
    uid: string;
    username: string;
    pfp: string;
    status: string;
  };
};

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (!user) {
      return Response.json({ error: "User does not exist" }, { status: 400 });
    }
    if (userError) {
      return Response.json({ error: userError?.message }, { status: 400 });
    }
    const { data, error } = await supabase
      .from("conversations")
      .select(
        `
    id,
    created_at,
    updated_at,
    last_message:messages!conversations_last_message_id_fkey (
        content
    ),
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
      .or(`user1_uid.eq.${user.id},user2_uid.eq.${user.id}`)
      .returns<Conversation[]>();

    const conversations = data?.map((conversation) => {
      const user1 = conversation.user1;
      const user2 = conversation.user2;

      const otherUser = user1.uid === user.id ? user2 : user1;

      return {
        id: conversation.id,
        otherUser,
        updated_at: conversation.updated_at,
        last_message: conversation.last_message.content,
      };
    });

    return Response.json(conversations);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Server Error" }, { status: 500 });
  }
}
