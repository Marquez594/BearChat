import { createClient } from "@/lib/server";

export async function DELETE(req: Request) {
  try {
    const { pendingID } = await req.json();
    const supabase = await createClient();
    if (!pendingID) {
      return Response.json({ error: "No id provided" }, { status: 400 });
    }
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return Response.json({ error: "Not logged in" }, { status: 400 });
    }

    const { data: validPendingID, error: validatingPendingIDError } =
      await supabase.from("users").select("uid").eq("uid", pendingID).single();
    if (!validPendingID || validatingPendingIDError) {
      return Response.json(
        { error: "Could not validate pending id" },
        { status: 400 },
      );
    }

    const { error: requestRemovalError } = await supabase
      .from("friend_request")
      .delete()
      .eq("sender_uid", user.id)
      .eq("receiver_uid", validPendingID.uid);

    if (requestRemovalError) {
      return Response.json(
        { error: "Error in removing request" },
        { status: 400 },
      );
    }
    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    return Response.json({ error: "Server Error" }, { status: 500 });
  }
}
