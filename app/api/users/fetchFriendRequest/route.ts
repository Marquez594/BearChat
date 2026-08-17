import { createClient } from "@/lib/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: fetchUserError,
    } = await supabase.auth.getUser();
    if (!user || fetchUserError) {
      return Response.json({ error: "Not logged in" }, { status: 401 });
    }

    const { data, error: fetchRequestError } = await supabase
      .from("friend_request")
      .select(
        `
    id,
    sender:users!friend_request_sender_uid_fkey (
      uid,
      username,
      pfp,
      status
    )
  `,
      )
      .eq("receiver_uid", user.id);
    if (fetchRequestError) {
      return Response.json(
        { error: fetchRequestError?.message },
        { status: 400 },
      );
    }
    return Response.json(data, { status: 200 });
  } catch (error) {
    return Response.json({ error: "Server Error" }, { status: 500 });
  }
}
