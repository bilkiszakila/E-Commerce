export type { Product, VariationOption, VariationGroup, ProductVariations } from "../app/data";

export type ShippingAddress = {
  name?: string;
  phone?: string;
  province?: string;
  city?: string;
  district?: string;
  address?: string;
  postcode?: string;
  lat?: number;
  lng?: number;
  google_maps_url?: string;
};

export type Order = {
  id: string;
  user_id?: string | null;
  status: string;
  courier?: string | null;
  payment?: string | null;
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  voucher_code?: string | null;
  shipping_address: ShippingAddress;
  payment_proof_url?: string | null;
  tracking_number?: string | null;
  created_at: string;
};

export type BankOption = {
  bank_name: string;
  account_name: string;
  account_number: string;
};

export type ShippingOption = {
  name: string;
  description: string;
  price: number;
};

export type StoreSettings = {
  bankName: string;
  bankAccountName: string;
  bankAccountNumber: string;
  bankOptions: BankOption[];
  shippingOptions: ShippingOption[];
};

export type UserProfile = {
  id: string;
  full_name?: string | null;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: Record<string, string | number>;
  avatar_url?: string | null;
  role?: string;
  member_code?: string | null;
  member_discount_percent?: number;
  is_admin?: boolean;
};
