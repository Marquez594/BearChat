import { createClient } from "@/lib/server";

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: fetchUserError,
    } = await supabase.auth.getUser();
    if (fetchUserError || !user) {
      return Response.json({ error: fetchUserError?.message }, { status: 401 });
    }
    const { data, error: pendingRequestError } = await supabase
      .from("friend_request")
      .select(
        `
    id,
    receiver:users!friend_request_receiver_uid_fkey (
      uid,
      username,
      pfp,
      status
    )
  `,
      )
      .eq("sender_uid", user.id);

    if (pendingRequestError) {
      return Response.json(
        { error: pendingRequestError?.message },
        { status: 400 },
      );
    }

    return Response.json(data);
  } catch (error) {
    return Response.json({ error: "Server Error" }, { status: 500 });
  }
}
