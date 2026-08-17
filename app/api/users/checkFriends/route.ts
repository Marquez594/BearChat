import { createClient } from "@/lib/server";

export async function POST(req: Request) {
  try {
    const { friendID } = await req.json();
    if (!friendID) {
      return Response.json(
        { error: "Friend ID not provided" },
        { status: 400 },
      );
    }
    const supabase = await createClient();
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

    const { data: friendship, error: friendError } = await supabase
      .from("friends")
      .select("id")
      .or(
        `and(user1_uid.eq.${user.id},user2_uid.eq.${friendID}),and(user1_uid.eq.${friendID},user2_uid.eq.${user.id})`,
      )
      .maybeSingle();

    if (friendError) {
      return Response.json({ error: friendError?.message }, { status: 400 });
    }

    return Response.json({ isFriend: !!friendship }, { status: 200 });
  } catch (error) {
    return Response.json({ error: "Server Error" }, { status: 500 });
  }
}
