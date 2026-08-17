import { createClient } from "@/lib/server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { receiverID, type } = await req.json();
    if (!receiverID || !type || (type !== "audio" && type !== "video")) {
      return Response.json(
        { error: "Missing reciever id and/or type" },
        { status: 400 },
      );
    }
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (!user || userError) {
      return Response.json(
        { error: userError?.message || "User not logged in" },
        { status: 401 },
      );
    }

    const { data: validReceiverID, error: validReceiverIDError } =
      await supabase.from("users").select("uid").eq("uid", receiverID).single();

    if (validReceiverIDError) {
      return Response.json(
        { error: validReceiverIDError?.message },
        { status: 400 },
      );
    }

    const { data: call, error: callError } = await supabase
      .from("calls")
      .insert({
        caller_id: user.id,
        receiver_id: validReceiverID.uid,
        type,
        status: "ringing",
      })
      .select()
      .single();

    if (callError) {
      return Response.json({ error: callError?.message }, { status: 400 });
    }
    return Response.json(call, { status: 201 });
  } catch (error) {
    return Response.json({ error: "Server Error" }, { status: 500 });
  }
}
