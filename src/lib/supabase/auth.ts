import { supabase } from "./client";

export async function getIsAdmin(userId: string): Promise<boolean> {
  const { data: rpcIsAdmin, error: rpcError } = await supabase.rpc("is_admin");
  if (!rpcError && typeof rpcIsAdmin === "boolean") return rpcIsAdmin;

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("Gagal membaca role admin:", error.message);
    return false;
  }
  return profile?.is_admin === true;
}
