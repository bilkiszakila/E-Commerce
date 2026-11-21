import { supabase } from "./client";
import { Product, ProductVariations } from "../../app/data";

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
    .select("id,name,slug,category,price,old_price,image,thumbnail_url,badge,discount_percent,discount_active,stock,pricing_unit,min_order,allow_custom_size,min_area_sqm,gallery,variations,rating,sold")
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
    pricingUnit: item.pricing_unit || "pcs",
    minOrder: item.min_order || 1,
    allowCustomSize: item.allow_custom_size || false,
    minAreaSqm: Number(item.min_area_sqm) || 1,
    gallery: Array.isArray(item.gallery) ? item.gallery : [],
    variations: normalizeVariations(item.variations),
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
    .select("id,name,slug,category,price,old_price,image,thumbnail_url,badge,discount_percent,discount_active,stock,pricing_unit,min_order,allow_custom_size,min_area_sqm,gallery,variations,rating,sold")
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
    pricingUnit: data.pricing_unit || "pcs",
    minOrder: data.min_order || 1,
    allowCustomSize: data.allow_custom_size || false,
    minAreaSqm: Number(data.min_area_sqm) || 1,
    gallery: Array.isArray(data.gallery) ? data.gallery : [],
    variations: normalizeVariations(data.variations),
    rating: Number(data.rating),
    sold: data.sold,
  };
}

export function normalizeVariations(value: unknown): ProductVariations {
  const raw = value && typeof value === "object" ? value as Record<string, unknown> : {};
  if (Array.isArray(raw.groups)) {
    const groups = raw.groups
      .filter((group): group is Record<string, unknown> => Boolean(group) && typeof group === "object")
      .map((group) => ({
        group_name: typeof group.group_name === "string" ? group.group_name : "",
        options: Array.isArray(group.options)
          ? group.options
              .filter((option): option is Record<string, unknown> => Boolean(option) && typeof option === "object")
              .map((option) => ({
                name: typeof option.name === "string" ? option.name : "",
                extra_price: Number(option.extra_price) || 0,
                charge_type: (option.charge_type === "flat" ? "flat" : "per_unit") as "per_unit" | "flat",
              }))
              .filter((option) => option.name)
          : [],
      }))
      .filter((group) => group.group_name);
    return { groups };
  }

  const normalizeLegacy = (items: unknown) => Array.isArray(items)
    ? items
        .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
        .map((item) => ({
          name: typeof item.name === "string" ? item.name : "",
          extra_price: Number(item.extra_price) || 0,
          charge_type: (item.charge_type === "flat" ? "flat" : "per_unit") as "per_unit" | "flat",
        }))
        .filter((item) => item.name)
    : [];
  const groups = [
    { group_name: "Jenis Bahan", options: normalizeLegacy(raw.materials) },
    { group_name: "Ukuran", options: normalizeLegacy(raw.sizes) },
    { group_name: "Finishing", options: normalizeLegacy(raw.finishings) },
  ].filter((group) => group.options.length > 0);
  return { groups };
}

export async function findVoucher(code: string) {
  const { data, error } = await supabase
    .from("vouchers")
    .select("code,type,value,minimum_purchase,usage_limit,used_count")
    .eq("active", true)
    .eq("code", code)
    .maybeSingle();

  if (error) {
    console.error("Gagal memuat voucher:", error.message);
    return null;
  }
  return data;
}

export async function findMemberCode(code: string): Promise<{ code: string; discountPercent: number } | null> {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id;
  if (!userId) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("member_code,member_discount_percent")
    .eq("id", userId)
    .maybeSingle();
  if (error) {
    console.error("Gagal memuat kode member:", error.message);
    return null;
  }
  if (!data?.member_code || data.member_code.toUpperCase() !== code) return null;
  return {
    code: data.member_code,
    discountPercent: Number(data.member_discount_percent) || 0,
  };
}

export type ShippingOption = {
  name: string;
  description: string;
  price: number;
};

export type BankOption = {
  bank_name: string;
  account_name: string;
  account_number: string;
};

export type StoreSettings = {
  bankName: string;
  bankAccountName: string;
  bankAccountNumber: string;
  bankOptions: BankOption[];
  shippingOptions: ShippingOption[];
};

export async function getStoreSettings(): Promise<StoreSettings | null> {
  const { data, error } = await supabase
    .from("store_settings")
    .select("bank_name,bank_account_name,bank_account_number,bank_options,shipping_options")
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    console.error("Gagal memuat pengaturan toko:", error.message);
    return null;
  }
  if (!data) return null;

  return {
    bankName: data.bank_name,
    bankAccountName: data.bank_account_name,
    bankAccountNumber: data.bank_account_number,
    bankOptions: Array.isArray(data.bank_options)
      ? data.bank_options.map((bank: Record<string, string>) => ({
          bank_name: bank.bank_name || bank.name || "",
          account_name: bank.account_name || bank.accountName || "",
          account_number: bank.account_number || bank.accountNumber || "",
        })).filter((bank: BankOption) => bank.bank_name && bank.account_number)
      : [],
    shippingOptions: Array.isArray(data.shipping_options)
      ? data.shipping_options
      : [],
  };
}
