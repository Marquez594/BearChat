import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { firstname, lastname, username, password, confirmPassword } = body;
    if (!firstname || !lastname || !username || !password || !confirmPassword) {
      return Response.json({ error: "All fields required" }, { status: 400 });
    }
    if (password != confirmPassword) {
      return Response.json(
        { error: "Passwords do not match" },
        { status: 400 },
      );
    }

    const { data, error: userAdminError } =
      await supabaseAdmin.auth.admin.createUser({
        email: `${username}@app.local`,
        password,
        email_confirm: true,
      });
    if (userAdminError || !data.user) {
      return Response.json({ error: userAdminError?.message }, { status: 400 });
    }
    const { error: addUserError } = await supabaseAdmin.from("users").insert({
      uid: data.user.id,
      username,
      firstname,
      lastname,
    });
    if (addUserError) {
      await supabaseAdmin.auth.admin.deleteUser(data.user.id);
      return Response.json({ error: addUserError?.message }, { status: 400 });
    }
    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    return Response.json({ error: "Server Error" }, { status: 500 });
  }
}
