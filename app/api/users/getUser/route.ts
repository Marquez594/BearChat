import { supabase } from "@/lib/supabase";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userID = searchParams.get("friend");
    if (!userID) {
      return Response.json({ error: "No user id provided" }, { status: 400 });
    }
    const { data: validUserID, error: validIDError } = await supabase
      .from("users")
      .select("uid")
      .eq("uid", userID)
      .single();
    if (validIDError) {
      return Response.json({ error: validIDError?.message }, { status: 400 });
    }

    const { data: userData, error: userDataError } = await supabase
      .from("users")
      .select("uid,username,status,pfp")
      .eq("uid", validUserID.uid)
      .single();
    if (userDataError) {
      return Response.json({ error: userDataError?.message }, { status: 400 });
    }
    return Response.json(userData, { status: 200 });
  } catch (error) {
    return Response.json({ error: "Server Error" }, { status: 500 });
  }
}
