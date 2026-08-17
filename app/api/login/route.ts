import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@/lib/server";

export async function POST(req: Request) {
  console.log("hello");
  const supabase = await createClient();
  const { username, password } = await req.json();

  const email = `${username}@app.local`;

  const { data, error: loginError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (loginError) {
    console.log("Login error:", loginError.message);
    return Response.json({ error: loginError.message }, { status: 400 });
  }

  console.log("Logged in user:", data.user.id);

  return Response.json({ success: true, user: data.user }, { status: 200 });
}
