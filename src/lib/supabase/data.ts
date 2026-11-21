import { supabase } from "./client";
import { Product } from "../../app/data";

export type Category = {
  id: string;
  name: string;
  image: string;
  thumbnailUrl: string;
  active: boolean;
};

export async function getProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("id,name,slug,category,price,old_price,image,thumbnail_url,badge,discount_percent,discount_active,stock,rating,sold")
    .eq("active", true)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Gagal memuat produk:", error.message);
    return [];
  }
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

export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("id,name,image,thumbnail_url,active")
    .eq("active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Gagal memuat kategori:", error.message);
    return [];
  }
  return data.map((item) => ({
    id: item.id,
    name: item.name,
    image: item.image || "",
    thumbnailUrl: item.thumbnail_url || item.image || "",
    active: item.active,
  }));
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

  if (error) {
    console.error("Gagal memuat detail produk:", error.message);
    return null;
  }
  if (!data) return null;
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
