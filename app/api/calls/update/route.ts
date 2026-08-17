import { createClient } from "@/lib/server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { callID, status } = await req.json();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (!user || userError) {
      return Response.json(
        { error: userError?.message || "No user found" },
        { status: 401 },
      );
    }

    if (!callID || !status || !["accepted", "declined"].includes(status)) {
      return Response.json({ error: "Invalid data" }, { status: 400 });
    }

    const { data: call, error: callError } = await supabase
      .from("calls")
      .select("receiver_id")
      .eq("id", callID)
      .single();

    if (callError) {
      return Response.json({ error: callError.message }, { status: 400 });
    }

    if (call.receiver_id !== user.id) {
      return Response.json({ error: "Not authorized" }, { status: 403 });
    }

    const { data, error } = await supabase
      .from("calls")
      .update({
        status,
      })
      .eq("id", callID)
      .select()
      .single();

    if (error) {
      return Response.json({ error: error?.message }, { status: 400 });
    }
    return Response.json(data, { status: 200 });
  } catch (error) {
    return Response.json({ error: "Server Error" }, { status: 500 });
  }
}
