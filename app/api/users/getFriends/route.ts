import { createClient } from "@/lib/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (!user || userError) {
      return Response.json(
        { error: userError?.message || "User not logged in" },
        { status: 400 },
      );
    }

    const { data: user1Friends, error: user1FriendsError } = await supabase
      .from("friends")
      .select(
        `
    id,
    friend:users!friends_user2_uid_fkey (
      uid,
      username,
      pfp,
      status
    )
  `,
      )
      .eq("user1_uid", user.id);

    if (user1FriendsError) {
      return Response.json(
        { error: user1FriendsError?.message },
        { status: 400 },
      );
    }

    const { data: user2Friends, error: user2FriendsError } = await supabase
      .from("friends")
      .select(
        `
    id,
    friend:users!friends_user1_uid_fkey (
      uid,
      username,
      pfp,
      status
    )
  `,
      )
      .eq("user2_uid", user.id);

    if (user2FriendsError) {
      return Response.json(
        { error: user2FriendsError?.message },
        { status: 400 },
      );
    }
    const friends = [...(user1Friends ?? []), ...(user2Friends ?? [])];

    return Response.json(friends, { status: 200 });
  } catch (error) {
    return Response.json({ error: "Server Error" }, { status: 500 });
  }
}
