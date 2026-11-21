import { supabase } from "./client";
import { products as fallbackProducts, categories as fallbackCategories, Product } from "../../app/data";

export async function getProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("id,name,category,price,old_price,image,badge,rating,sold")
    .eq("active", true)
    .order("created_at", { ascending: true });

  if (error || !data?.length) return fallbackProducts;
  return data.map((item) => ({
    id: item.id,
    name: item.name,
    category: item.category,
    price: item.price,
    oldPrice: item.old_price ?? undefined,
    image: item.image,
    badge: item.badge ?? undefined,
    rating: Number(item.rating),
    sold: item.sold,
  }));
}

export async function getCategories(): Promise<readonly (readonly [string, string])[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("name,image")
    .order("sort_order", { ascending: true });

  if (error || !data?.length) return fallbackCategories;
  return data.map((item) => [item.name, item.image || ""] as const);
}

export async function getActiveBanner(): Promise<string | null> {
  const { data, error } = await supabase
    .from("promo_banners")
    .select("image_url")
    .eq("active", true)
    .limit(1)
    .maybeSingle();

  return error ? null : data?.image_url || null;
}

export async function findVoucher(code: string) {
  const { data, error } = await supabase
    .from("vouchers")
    .select("code,type,value")
    .eq("active", true)
    .eq("code", code)
    .maybeSingle();

  return error ? null : data;
}
