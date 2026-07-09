import { createClient } from "@/lib/server";

export async function POST() {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();
    if (error) {
      return Response.json({ error: error?.message }, { status: 400 });
    }
    return Response.json({ success: true }, { status: 200 });
  } catch (err) {
    return Response.json(
      { error: "Server is not able to signout" },
      { status: 500 },
    );
  }
}
