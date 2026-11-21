export type Product = {
  id: string;
  name: string;
  slug?: string;
  category: string;
  price: number;
  oldPrice?: number;
  image: string;
  thumbnailUrl?: string;
  badge?: string;
  discountPercent?: number;
  discountActive?: boolean;
  stock?: number;
  pricingUnit?: "pcs" | "meter";
  minOrder?: number;
  allowCustomSize?: boolean;
  minAreaSqm?: number;
  gallery?: string[];
  variations?: ProductVariations;
  rating: number;
  sold: number;
};

export type VariationOption = { name: string; extra_price: number; charge_type?: "per_unit" | "flat" };
export type VariationGroup = { group_name: string; options: VariationOption[] };
export type ProductVariations = { groups: VariationGroup[] };

export const products: Product[] = [
  { id: "banner-flexi", name: "Banner / Flexy Outdoor", category: "Banner & Spanduk", price: 25000, oldPrice: 32000, image: "https://images.unsplash.com/photo-1557426272-fc759fdf7a8d?auto=format&fit=crop&w=900&q=85", badge: "TERLARIS", rating: 4.9, sold: 1280 },
  { id: "stiker-vinyl", name: "Stiker Vinyl A3+", category: "Stiker", price: 18000, oldPrice: 24000, image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=900&q=85", badge: "FLASH SALE", rating: 4.8, sold: 964 },
  { id: "poster-a3", name: "Cetak Poster A3 Art Carton", category: "Cetak Digital", price: 12000, image: "https://images.unsplash.com/photo-1613909207039-6b173b755cc1?auto=format&fit=crop&w=900&q=85", rating: 4.7, sold: 850 },
  { id: "x-banner", name: "X-Banner 60 x 160 cm", category: "Papan & Stand", price: 85000, oldPrice: 110000, image: "https://images.unsplash.com/photo-1586953208448-b95a79798f07?auto=format&fit=crop&w=900&q=85", badge: "HEMAT 22%", rating: 4.9, sold: 620 },
  { id: "kaos-sablon", name: "Kaos Sablon 1 Warna", category: "Merchandise", price: 45000, image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=85", rating: 4.8, sold: 540 },
  { id: "buku-menu", name: "Cetak Menu & Brosur Lipat", category: "Cetak Digital", price: 22000, image: "https://images.unsplash.com/photo-1545235617-9465d2a55698?auto=format&fit=crop&w=900&q=85", rating: 4.6, sold: 410 },
  { id: "kartu-nama", name: "Cetak Kartu Nama Premium", category: "Cetak Digital", price: 35000, oldPrice: 45000, image: "https://images.unsplash.com/photo-1586953208448-b95a79798f07?auto=format&fit=crop&w=900&q=85", badge: "BEST SELLER", rating: 4.9, sold: 2100 },
  { id: "oneway-vision", name: "One Way Vision Kaca", category: "Stiker", price: 95000, image: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=85", rating: 4.7, sold: 332 },
];

export const categories = [
  ["Banner & Spanduk", "https://images.unsplash.com/photo-1557426272-fc759fdf7a8d?auto=format&fit=crop&w=500&q=80"],
  ["Cetak Digital", "https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=500&q=80"],
  ["Stiker", "https://images.unsplash.com/photo-1613909207039-6b173b755cc1?auto=format&fit=crop&w=500&q=80"],
  ["Papan & Stand", "https://images.unsplash.com/photo-1586953208448-b95a79798f07?auto=format&fit=crop&w=500&q=80"],
  ["Merchandise", "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=500&q=80"],
  ["Undangan", "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=500&q=80"],
] as const;
