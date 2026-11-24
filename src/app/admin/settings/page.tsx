"use client";

import { useEffect, useState } from "react";
import { ImagePlus, Save, Trash2 } from "lucide-react";
import { supabase } from "../../../lib/supabase/client";
import {
  getStoreSettings,
  ShippingOption,
  BankOption,
} from "@/services/settingsService";
import { getActiveBanner } from "@/services/productService";

type BankSettings = { bank: string; accountName: string; accountNumber: string };
type PromoBannerSettings = {
  dataUrl: string;
  name: string;
  file?: File;
};
const PROMO_BANNER_SIZE = { width: 1180, height: 290 };

export default function AdminSettingsPage() {
  const [bank, setBank] = useState<BankSettings>({
    bank: "BCA",
    accountName: "PT Adi Cetak",
    accountNumber: "1234567890",
  });
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([
    { name: "JNE Reg", description: "Estimasi 2–3 hari", price: 17000 },
    { name: "J&T Express", description: "Estimasi 1–2 hari", price: 19000 },
    { name: "Ambil Sendiri", description: "Store Utama", price: 0 },
  ]);
  const [bankOptions, setBankOptions] = useState<BankOption[]>([
    {
      bank_name: "BCA",
      account_name: "PT Adi Cetak",
      account_number: "1234567890",
    },
  ]);
  const [promoBanner, setPromoBanner] = useState<PromoBannerSettings>({
    dataUrl: "",
    name: "",
  });
  const [bannerError, setBannerError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getStoreSettings().then((settings) => {
      if (!settings) return;
      setBank({
        bank: settings.bankName,
        accountName: settings.bankAccountName,
        accountNumber: settings.bankAccountNumber,
      });
      if (settings.shippingOptions.length)
        setShippingOptions(settings.shippingOptions);
      if (settings.bankOptions.length) setBankOptions(settings.bankOptions);
    });

    getActiveBanner().then((activeUrl) => {
      if (activeUrl) {
        setPromoBanner({
          dataUrl: activeUrl,
          name: activeUrl.split("/").pop() || "Banner Aktif",
        });
      }
    });
  }, []);

  async function uploadBannerFile(file: File): Promise<string> {
    const ext = file.name.split(".").pop() || "png";
    const filePath = `promo-${Date.now()}.${ext}`;

    const buckets = ["banners", "products", "designs"];
    for (const bucket of buckets) {
      const { error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, { upsert: true, contentType: file.type });

      if (!error) {
        const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
        return data.publicUrl;
      }
    }

    throw new Error(
      "Gagal mengunggah gambar banner ke Supabase Storage. Pastikan bucket 'banners' sudah dibuat.",
    );
  }

  async function save() {
    const validBankOptions = bankOptions.filter(
      (option) => option.bank_name && option.account_name && option.account_number,
    );
    const firstBank = validBankOptions[0];
    if (!firstBank) {
      alert("Minimal satu bank tujuan harus diisi.");
      return;
    }

    setSaving(true);
    setBannerError("");

    try {
      const { error } = await supabase.from("store_settings").upsert(
        {
          id: 1,
          bank_name: firstBank.bank_name,
          bank_account_name: firstBank.account_name,
          bank_account_number: firstBank.account_number,
          bank_options: validBankOptions,
          shipping_options: shippingOptions,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" },
      );

      if (error) throw new Error(error.message);

      if (promoBanner.file) {
        const publicUrl = await uploadBannerFile(promoBanner.file);

        await supabase
          .from("promo_banners")
          .update({ active: false })
          .eq("active", true);

        const { error: bannerInsertErr } = await supabase
          .from("promo_banners")
          .insert({
            image_url: publicUrl,
            active: true,
          });

        if (bannerInsertErr) throw new Error(bannerInsertErr.message);

        setPromoBanner({
          dataUrl: publicUrl,
          name: promoBanner.name,
          file: undefined,
        });
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gagal menyimpan.";
      alert(msg);
    } finally {
      setSaving(false);
    }
  }

  function handleBannerUpload(file?: File) {
    setBannerError("");
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setBannerError("Format banner harus PNG, JPEG, atau WebP.");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setBannerError("Ukuran file maksimal 3 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result);
      const image = new Image();
      image.onload = () => {
        if (
          image.width !== PROMO_BANNER_SIZE.width ||
          image.height !== PROMO_BANNER_SIZE.height
        ) {
          setBannerError(
            `Ukuran gambar harus tepat ${PROMO_BANNER_SIZE.width} × ${PROMO_BANNER_SIZE.height} px (gambar kamu: ${image.width} × ${image.height} px).`,
          );
          return;
        }
        setPromoBanner({ dataUrl, name: file.name, file });
      };
      image.onerror = () => setBannerError("File gambar tidak dapat dibaca.");
      image.src = dataUrl;
    };
    reader.readAsDataURL(file);
  }

  function removeBank(index: number) {
    if (bankOptions.length <= 1) return;
    setBankOptions((old) => old.filter((_, i) => i !== index));
  }

  function removeShipping(index: number) {
    if (shippingOptions.length <= 1) return;
    setShippingOptions((old) => old.filter((_, i) => i !== index));
  }

  return (
    <main className="mx-auto max-w-[1180px] px-4 py-8 md:px-5">
      <h1 className="mb-5 text-2xl font-black text-slate-900">
        Pengaturan Toko & Pembayaran
      </h1>
      <div className="grid gap-5 md:grid-cols-2">
        <section className="h-fit rounded-2xl border border-slate-100 bg-white p-5 shadow-xs">
          <h2 className="font-black text-slate-900">Rekening Transfer Manual</h2>
          <div className="mt-4 space-y-3">
            <Field
              label="Nama Bank Utama"
              value={bank.bank}
              onChange={(bankName) => setBank({ ...bank, bank: bankName })}
            />
            <Field
              label="Nama Pemilik Rekening"
              value={bank.accountName}
              onChange={(accountName) =>
                setBank({ ...bank, accountName })
              }
            />
            <Field
              label="Nomor Rekening"
              value={bank.accountNumber}
              onChange={(accountNumber) =>
                setBank({ ...bank, accountNumber })
              }
            />
            <div className="border-t pt-3">
              <p className="mb-2 text-xs font-bold text-slate-600">
                Pilihan Bank Tujuan (Tampil di Checkout)
              </p>
              {bankOptions.map((option, index) => (
                <div
                  key={index}
                  className="mb-2 flex items-center gap-2 rounded-xl border border-slate-200 p-2.5"
                >
                  <div className="grid flex-1 gap-2 sm:grid-cols-3">
                    <input
                      aria-label="Nama bank"
                      value={option.bank_name}
                      onChange={(e) =>
                        setBankOptions((old) =>
                          old.map((item, i) =>
                            i === index
                              ? { ...item, bank_name: e.target.value }
                              : item,
                          ),
                        )
                      }
                      className="h-9 rounded-lg border px-2.5 text-xs"
                      placeholder="Nama bank"
                    />
                    <input
                      aria-label="Atas nama rekening"
                      value={option.account_name}
                      onChange={(e) =>
                        setBankOptions((old) =>
                          old.map((item, i) =>
                            i === index
                              ? { ...item, account_name: e.target.value }
                              : item,
                          ),
                        )
                      }
                      className="h-9 rounded-lg border px-2.5 text-xs"
                      placeholder="Atas nama"
                    />
                    <input
                      aria-label="Nomor rekening"
                      value={option.account_number}
                      onChange={(e) =>
                        setBankOptions((old) =>
                          old.map((item, i) =>
                            i === index
                              ? { ...item, account_number: e.target.value }
                              : item,
                          ),
                        )
                      }
                      className="h-9 rounded-lg border px-2.5 text-xs"
                      placeholder="Nomor rekening"
                    />
                  </div>
                  {bankOptions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeBank(index)}
                      className="p-1.5 text-slate-400 hover:text-red-500"
                      title="Hapus bank"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  setBankOptions((old) => [
                    ...old,
                    { bank_name: "", account_name: "", account_number: "" },
                  ])
                }
                className="h-10 w-full rounded-xl border border-dashed border-blue-200 text-xs font-bold text-[#1D4ED8] hover:bg-blue-50/50"
              >
                + Tambah Bank
              </button>
            </div>
          </div>
        </section>

        <section className="h-fit rounded-2xl border border-slate-100 bg-white p-5 shadow-xs">
          <h2 className="font-black text-slate-900">Opsi Ongkos Kirim</h2>
          <div className="mt-4 space-y-3">
            {shippingOptions.map((option, index) => (
              <div
                key={index}
                className="flex items-center gap-2 rounded-xl border border-slate-200 p-2.5"
              >
                <div className="grid flex-1 gap-2 sm:grid-cols-[1fr_1fr_100px]">
                  <input
                    aria-label="Nama kurir"
                    value={option.name}
                    onChange={(e) =>
                      setShippingOptions((old) =>
                        old.map((item, i) =>
                          i === index ? { ...item, name: e.target.value } : item,
                        ),
                      )
                    }
                    className="h-9 rounded-lg border px-2.5 text-xs"
                  />
                  <input
                    aria-label="Deskripsi ongkir"
                    value={option.description}
                    onChange={(e) =>
                      setShippingOptions((old) =>
                        old.map((item, i) =>
                          i === index
                            ? { ...item, description: e.target.value }
                            : item,
                        ),
                      )
                    }
                    className="h-9 rounded-lg border px-2.5 text-xs"
                  />
                  <input
                    aria-label="Tarif ongkir"
                    type="number"
                    value={option.price}
                    onChange={(e) =>
                      setShippingOptions((old) =>
                        old.map((item, i) =>
                          i === index
                            ? { ...item, price: Number(e.target.value) || 0 }
                            : item,
                        ),
                      )
                    }
                    className="h-9 rounded-lg border px-2.5 text-xs"
                  />
                </div>
                {shippingOptions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeShipping(index)}
                    className="p-1.5 text-slate-400 hover:text-red-500"
                    title="Hapus kurir"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                setShippingOptions((old) => [
                  ...old,
                  {
                    name: "Kurir Baru",
                    description: "Estimasi pengiriman",
                    price: 0,
                  },
                ])
              }
              className="h-10 w-full rounded-xl border border-dashed border-blue-200 text-xs font-bold text-[#1D4ED8] hover:bg-blue-50/50"
            >
              + Tambah Opsi Ongkir
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs md:col-span-2">
          <h2 className="font-black text-slate-900">Banner Promo Utama</h2>
          <p className="mt-1 text-xs text-slate-500">
            Ukuran tetap: 1180 × 290 px · Format PNG atau JPEG · Maksimal 3 MB
          </p>
          <div className="mt-4">
            {promoBanner.dataUrl ? (
              <img
                src={promoBanner.dataUrl}
                alt="Preview banner promo"
                className="w-full rounded-xl border object-cover"
                style={{ aspectRatio: "1180 / 290" }}
              />
            ) : (
              <div className="grid aspect-[1180/290] place-items-center rounded-xl border border-dashed bg-slate-50 text-slate-400">
                <div className="text-center">
                  <ImagePlus className="mx-auto mb-2" size={28} />
                  <span className="text-xs">Belum ada banner promo</span>
                </div>
              </div>
            )}
            <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-blue-200 bg-blue-50/40 px-4 py-2.5 text-xs font-bold text-[#1D4ED8] hover:bg-blue-50">
              <ImagePlus size={16} />
              <span>
                {promoBanner.name ? "Ganti Banner" : "Upload Banner"}
              </span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(event) => handleBannerUpload(event.target.files?.[0])}
                className="hidden"
              />
            </label>
            {promoBanner.name && (
              <span className="ml-3 text-xs text-slate-500">
                {promoBanner.name}
                {promoBanner.file ? " (belum disimpan)" : ""}
              </span>
            )}
            {bannerError && (
              <p className="mt-2 text-xs font-bold text-red-500">
                {bannerError}
              </p>
            )}
          </div>
        </section>
      </div>

      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="mt-5 flex h-12 items-center justify-center gap-2 rounded-xl bg-[#1D4ED8] px-6 text-sm font-bold text-white transition hover:bg-blue-800 disabled:opacity-60"
      >
        <Save size={17} />
        <span>
          {saving
            ? "Menyimpan..."
            : saved
              ? "Tersimpan ke Database!"
              : "Simpan Pengaturan"}
        </span>
      </button>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-xs font-bold text-slate-600">
      {label}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-xs font-normal outline-none focus:border-[#1D4ED8]"
      />
    </label>
  );
}