"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ClipboardEdit,
  FileCheck2,
  Heart,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingCart,
  Truck,
  Upload,
  X,
} from "lucide-react";
import { formatRupiah } from "@/app/components";
import { useStore } from "@/app/store";
import { getProductByIdOrSlug } from "@/services/productService";
import { Product } from "@/app/data";

function ProductContent() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [selectedVariations, setSelectedVariations] = useState<
    Record<string, string>
  >({});
  const [selectedImage, setSelectedImage] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [customLength, setCustomLength] = useState(100);
  const [customWidth, setCustomWidth] = useState(100);
  const [sizeMode, setSizeMode] = useState("");

  // State untuk Upload Desain & Catatan Produksi
  const [designFile, setDesignFile] = useState<File | null>(null);
  const [productionNote, setProductionNote] = useState("");
  const [fileError, setFileError] = useState("");

  const { addToCart } = useStore();

  useEffect(() => {
    const value = Array.isArray(params.id) ? params.id[0] : params.id;
    if (!value) return;
    getProductByIdOrSlug(value).then((item) => {
      if (item) {
        setProduct(item);
        const defaults: Record<string, string> = {};
        item.variations?.groups.forEach((group) => {
          if (group.options[0])
            defaults[group.group_name] = group.options[0].name;
        });
        setSelectedVariations(defaults);
        setSelectedImage(item.thumbnailUrl || item.image);
        setQuantity(item.pricingUnit === "pcs" ? item.minOrder || 1 : 1);
        const hasSizeGroup = item.variations?.groups.some((group) =>
          /ukuran/i.test(group.group_name),
        );
        if (
          item.pricingUnit === "meter" &&
          item.allowCustomSize &&
          !hasSizeGroup
        )
          setSizeMode("custom");
      }
      setLoadingProduct(false);
    });
  }, [params.id]);

  const variationGroups = product?.variations?.groups || [];

  const pricing = useMemo(() => {
    if (!product)
      return {
        unitPrice: 0,
        fixedExtra: 0,
        totalPrice: 0,
        billedArea: 1,
        actualArea: 1,
      };
    const basePrice = product.discountActive
      ? Math.round(product.price * (1 - (product.discountPercent || 0) / 100))
      : product.price;
    let perUnitExtra = 0;
    let flatExtra = 0;
    variationGroups.forEach((group) => {
      const selectedName = selectedVariations[group.group_name];
      const option = group.options.find((item) => item.name === selectedName);
      if (!option) return;
      if ((option.charge_type || "per_unit") === "flat")
        flatExtra += option.extra_price;
      else perUnitExtra += option.extra_price;
    });

    if (product.pricingUnit === "meter") {
      let actualArea = (customLength * customWidth) / 10000;
      const sizeName = selectedVariations["Ukuran"] || "";
      const sizeMatch = sizeName.match(
        /(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)\s*cm/i,
      );
      if (sizeMode !== "custom" && sizeMatch) {
        actualArea = (Number(sizeMatch[1]) * Number(sizeMatch[2])) / 10000;
      }
      const billedArea = Math.max(actualArea, product.minAreaSqm || 1);
      const pricePerSheet = (basePrice + perUnitExtra) * billedArea + flatExtra;
      return {
        unitPrice: Math.round(pricePerSheet),
        fixedExtra: 0,
        totalPrice: Math.round(pricePerSheet * quantity),
        billedArea,
        actualArea,
      };
    }

    const unitPrice = Math.max(5000, Math.round(basePrice + perUnitExtra));
    return {
      unitPrice,
      fixedExtra: Math.round(flatExtra),
      totalPrice: Math.round(unitPrice * quantity + flatExtra),
      billedArea: 1,
      actualArea: 1,
    };
  }, [
    product,
    selectedVariations,
    variationGroups,
    quantity,
    customLength,
    customWidth,
    sizeMode,
  ]);

  const galleryImages = useMemo(() => {
    if (!product) return [];
    const primary = product.thumbnailUrl || product.image;
    return Array.from(
      new Set([primary, ...(product.gallery || [])].filter(Boolean)),
    );
  }, [product]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setFileError("");

    if (!file) return;

    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      setFileError("Ukuran file melebihi batas maksimal 50MB.");
      e.target.value = "";
      return;
    }

    setDesignFile(file);
  }

  function handleRemoveFile(e: React.MouseEvent) {
    e.preventDefault();
    setDesignFile(null);
    setFileError("");
  }

  function add() {
    if (!product) return;
    const labels = variationGroups
      .map((group) => selectedVariations[group.group_name])
      .filter(Boolean);
    if (product.pricingUnit === "meter" && sizeMode === "custom") {
      labels.push(
        `Ukuran Custom ${customLength} × ${customWidth} cm (${pricing.actualArea.toFixed(2)} m²)`,
      );
    }

    const trimmedNote = productionNote.trim();
    const key = `${product.id}-${labels.join("-")}-${designFile?.name || ""}-${trimmedNote}`;

    addToCart({
      key,
      product,
      quantity,
      variants: labels.join(" · ") || "Tanpa variasi",
      unitPrice: pricing.unitPrice,
      fixedExtra: pricing.fixedExtra,
      note: trimmedNote || undefined,
      designFile: designFile || undefined,
      designFileName: designFile?.name || undefined,
    });
  }

  if (loadingProduct) {
    return (
      <main className="grid min-h-[50vh] place-items-center text-sm text-slate-500">
        Memuat produk...
      </main>
    );
  }
  if (!product) {
    return (
      <main className="grid min-h-[50vh] place-items-center px-4 text-center text-sm text-slate-500">
        Produk tidak ditemukan atau sudah tidak aktif.
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-295 px-4 py-6 md:px-5">
      <div className="grid gap-6 rounded-xl bg-white p-4 md:grid-cols-[1fr_1fr] md:p-6">
        <div>
          <div className="aspect-square overflow-hidden rounded-lg bg-slate-100 md:h-130 md:aspect-auto">
            <img
              src={selectedImage || product.image}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          </div>
          {galleryImages.length > 0 && (
            <div className="mt-3 grid grid-cols-4 gap-2">
              {galleryImages.map((img) => (
                <button
                  key={img}
                  onClick={() => setSelectedImage(img)}
                  className={`h-20 overflow-hidden rounded border ${selectedImage === img ? "border-red-500" : "border-slate-200"}`}
                >
                  <img
                    src={img}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
        <div>
          <p className="text-xs font-bold text-red-500">{product.category}</p>
          <h1 className="mt-2 text-2xl font-black leading-tight md:text-3xl">
            {product.name}
          </h1>
          <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="13"
              viewBox="0 0 14 13"
              fill="none"
            >
              <path
                d="M5.79101 0.617157C6.05837 -0.205719 7.22253 -0.205719 7.48989 0.617157L8.44519 3.55725C8.56476 3.92525 8.90769 4.17441 9.29463 4.17441H12.386C13.2513 4.17441 13.611 5.28158 12.911 5.79015L10.41 7.60722C10.097 7.83466 9.96599 8.2378 10.0856 8.6058L11.0409 11.5459C11.3082 12.3688 10.3664 13.053 9.66643 12.5445L7.16543 10.7274C6.85239 10.5 6.4285 10.5 6.11546 10.7274L3.61447 12.5445C2.91449 13.053 1.97267 12.3688 2.24004 11.5459L3.19534 8.6058C3.31491 8.2378 3.18392 7.83466 2.87088 7.60722L0.369885 5.79015C-0.330095 5.28158 0.0296472 4.17441 0.89487 4.17441H3.98627C4.37321 4.17441 4.71614 3.92525 4.83571 3.55725L5.79101 0.617157Z"
                fill="#FFB42F"
              />
            </svg>
            {product.rating} · Terjual {product.sold}+ · Garansi kualitas cetak
          </p>
          <div className="mt-4 bg-brand-surface p-4">
            <p className="text-sm text-slate-500">Harga mulai</p>
            <p className="mt-1 text-3xl font-black text-red-500">
              {formatRupiah(
                product.pricingUnit === "meter"
                  ? pricing.totalPrice
                  : pricing.unitPrice,
              )}{" "}
              <span className="text-xs font-normal text-slate-400">
                {product.pricingUnit === "meter"
                  ? `/ ${quantity} lembar/pcs`
                  : `/ item`}
              </span>
            </p>
            {(product.oldPrice || product.discountActive) && (
              <p className="text-xs text-slate-400">
                Harga normal{" "}
                <span className="line-through">
                  {formatRupiah(product.oldPrice || product.price)}
                </span>
                {product.discountActive && (
                  <span className="ml-2 font-bold text-orange-500">
                    -{product.discountPercent || 0}%
                  </span>
                )}
              </p>
            )}
          </div>

          <div className="mt-5 space-y-5">
            {variationGroups.map((group) => (
              <VariationOption
                key={group.group_name}
                label={group.group_name}
                value={selectedVariations[group.group_name] || ""}
                setValue={(value) => {
                  setSelectedVariations((old) => ({
                    ...old,
                    [group.group_name]: value,
                  }));
                  if (/ukuran/i.test(group.group_name))
                    setSizeMode(
                      value === "Ukuran Custom" ? "custom" : "option",
                    );
                }}
                options={
                  product.pricingUnit === "meter" &&
                  /ukuran/i.test(group.group_name) &&
                  product.allowCustomSize
                    ? [
                        ...group.options,
                        {
                          name: "Ukuran Custom",
                          extra_price: 0,
                          charge_type: "per_unit" as const,
                        },
                      ]
                    : group.options
                }
              />
            ))}
            {product.pricingUnit === "meter" && sizeMode === "custom" && (
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="mb-3 text-sm font-bold">Ukuran Custom</p>
                <div className="grid grid-cols-2 gap-3">
                  <label className="text-xs font-bold text-slate-600">
                    Panjang (cm)
                    <input
                      type="number"
                      min="1"
                      value={customLength}
                      onChange={(e) =>
                        setCustomLength(
                          Math.max(1, Number(e.target.value) || 1),
                        )
                      }
                      className="mt-2 h-11 w-full rounded border bg-white px-3"
                    />
                  </label>
                  <label className="text-xs font-bold text-slate-600">
                    Lebar (cm)
                    <input
                      type="number"
                      min="1"
                      value={customWidth}
                      onChange={(e) =>
                        setCustomWidth(Math.max(1, Number(e.target.value) || 1))
                      }
                      className="mt-2 h-11 w-full rounded border bg-white px-3"
                    />
                  </label>
                </div>
                <p className="mt-3 text-xs text-slate-500">
                  Luas aktual: <b>{pricing.actualArea.toFixed(2)} m²</b> · Luas
                  ditagih: <b>{pricing.billedArea.toFixed(2)} m²</b>
                </p>
              </div>
            )}
            <div>
              <p className="mb-2 text-sm font-bold">Jumlah</p>
              {product.pricingUnit === "pcs" && (
                <p className="mb-2 text-xs text-slate-500">
                  Minimal order: {product.minOrder || 1} pcs
                </p>
              )}
              <div className="flex w-fit items-center overflow-hidden rounded-lg border">
                <button
                  onClick={() =>
                    setQuantity(
                      Math.max(
                        product.pricingUnit === "pcs"
                          ? product.minOrder || 1
                          : 1,
                        quantity - 1,
                      ),
                    )
                  }
                  className="grid h-11 w-11 place-items-center"
                >
                  <Minus size={16} />
                </button>
                <input
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(
                      Math.max(
                        product.pricingUnit === "pcs"
                          ? product.minOrder || 1
                          : 1,
                        Number(e.target.value) || 1,
                      ),
                    )
                  }
                  className="h-11 w-14 border-x text-center outline-none"
                />
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="grid h-11 w-11 place-items-center"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {/* 1. Kotak Upload File Design (Interaktif) */}
              <label
                className={`flex w-full cursor-pointer items-center gap-4 rounded-2xl border border-dashed p-4 transition ${
                  designFile
                    ? "border-emerald-300 bg-emerald-50/40"
                    : "border-blue-200 bg-white hover:border-blue-400 hover:bg-blue-50/30"
                }`}
              >
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white ${
                    designFile ? "bg-emerald-600" : "bg-[#1D4ED8]"
                  }`}
                >
                  {designFile ? (
                    <FileCheck2 size={22} />
                  ) : (
                    <Upload size={22} strokeWidth={2.2} />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-900">
                    {designFile ? designFile.name : "Upload File Design"}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {designFile
                      ? `${(designFile.size / (1024 * 1024)).toFixed(2)} MB • Klik kotak untuk ganti file`
                      : "PDF, TIFF, PNG, JPG, ZIP, RAR (maks. 50Mb)"}
                  </p>
                </div>

                {designFile && (
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    title="Hapus file"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm hover:bg-red-50 hover:text-red-500"
                  >
                    <X size={16} />
                  </button>
                )}

                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf,.cdr,.ai,.tiff,.tif,.zip,.rar"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              {fileError && (
                <p className="text-xs font-bold text-red-500">{fileError}</p>
              )}

              {/* 2. Input Catatan / Link Desain */}
              <div className="flex h-12 w-full items-center gap-3 rounded-2xl border border-blue-200 bg-white px-4 transition focus-within:border-blue-500">
                <ClipboardEdit size={18} className="shrink-0 text-slate-400" />
                <input
                  type="text"
                  value={productionNote}
                  onChange={(e) => setProductionNote(e.target.value)}
                  placeholder="Kasih Catatan Untuk Tim Produksi/Link Desain"
                  className="h-full w-full bg-transparent text-xs font-normal text-slate-700 placeholder:text-slate-400 outline-none"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-[52px_1fr] gap-3">
            <button className="grid h-12 place-items-center rounded-lg border text-slate-500">
              <Heart size={20} />
            </button>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={add}
                className="flex h-12 items-center justify-center gap-2 rounded-lg border border-red-500 font-bold text-red-500"
              >
                <ShoppingCart size={18} /> Keranjang
              </button>
              <button
                onClick={() => {
                  add();
                  router.push("/cart");
                }}
                className="h-12 rounded-lg bg-red-500 font-bold text-white"
              >
                Beli Sekarang
              </button>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-2">
              <Truck size={16} /> Cek ongkir tersedia
            </span>
            <span className="flex items-center gap-2">
              <ShieldCheck size={16} /> Kualitas terjamin
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}

function VariationOption({
  label,
  value,
  setValue,
  options,
}: {
  label: string;
  value: string;
  setValue: (v: string) => void;
  options: { name: string; extra_price: number }[];
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-bold">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.name}
            onClick={() => setValue(option.name)}
            className={`rounded-lg border px-3 py-2 text-xs ${value === option.name ? "border-red-500 bg-red-50 font-bold text-red-500" : "border-slate-200 text-slate-600"}`}
          >
            <span>{option.name}</span>
            {option.extra_price !== 0 && (
              <span className="ml-1 text-[10px] text-slate-400">
                {option.extra_price > 0
                  ? `+${formatRupiah(option.extra_price)}`
                  : formatRupiah(option.extra_price)}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ProductPage() {
  return (
    <Suspense
      fallback={<div className="p-10 text-center">Memuat produk...</div>}
    >
      <ProductContent />
    </Suspense>
  );
}