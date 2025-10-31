import { NextResponse } from "next/server";
import { createSupabaseWithHeaders } from "../../../lib/supabaseClient";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  const auth = request.headers.get("authorization");
  const supabase = createSupabaseWithHeaders(auth ? { Authorization: auth } : {});
  const query = supabase.from("recipes").select("*").order("created_at", { ascending: false });
  const { data, error } = userId ? await query.eq("user_id", userId) : await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ recipes: data || [] });
}

export async function POST(request) {
  const auth = request.headers.get("authorization");
  const supabase = createSupabaseWithHeaders(auth ? { Authorization: auth } : {});
  const body = await request.json();
  const payload = Array.isArray(body) ? body : [body];
  const { data, error } = await supabase.from("recipes").insert(payload).select("*");
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ recipes: data || [] }, { status: 201 });
}


