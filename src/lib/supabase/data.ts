import { supabase } from "./client";
import { products as fallbackProducts, categories as fallbackCategories, Product } from "../../app/data";

export async function getProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("id,name,slug,category,price,old_price,image,thumbnail_url,badge,discount_percent,discount_active,stock,rating,sold")
    .eq("active", true)
    .order("created_at", { ascending: true });

  if (error || !data?.length) return fallbackProducts;
  return data.map((item) => ({
    id: item.id,
    name: item.name,
    slug: item.slug || undefined,
    category: item.category,
    price: item.price,
    oldPrice: item.old_price ?? undefined,
    image: item.thumbnail_url || item.image,
    thumbnailUrl: item.thumbnail_url || item.image,
    badge: item.badge ?? undefined,
    discountPercent: item.discount_percent ?? 0,
    discountActive: item.discount_active ?? false,
    stock: item.stock ?? 0,
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

export async function getProductByIdOrSlug(value: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from("products")
    .select("id,name,slug,category,price,old_price,image,thumbnail_url,badge,discount_percent,discount_active,stock,rating,sold")
    .or(`id.eq.${value},slug.eq.${value}`)
    .eq("active", true)
    .maybeSingle();

  if (error || !data) return null;
  return {
    id: data.id,
    name: data.name,
    slug: data.slug || undefined,
    category: data.category,
    price: data.price,
    oldPrice: data.old_price ?? undefined,
    image: data.thumbnail_url || data.image,
    thumbnailUrl: data.thumbnail_url || data.image,
    badge: data.badge ?? undefined,
    discountPercent: data.discount_percent ?? 0,
    discountActive: data.discount_active ?? false,
    stock: data.stock ?? 0,
    rating: Number(data.rating),
    sold: data.sold,
  };
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
