"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  ClipboardEdit,
  FileCheck2,
  Landmark,
  MapPin,
  Navigation,
  QrCode,
  ShieldCheck,
  TicketPercent,
  Truck,
  Upload,
  X,
} from "lucide-react";
import { useStore } from "@/app/store";
import { formatRupiah } from "@/app/components";
import { findVoucher, findMemberCode } from "@/services/productService";
import {
  getStoreSettings,
  ShippingOption,
  BankOption,
} from "@/services/settingsService";
import { supabase } from "@/lib/supabase/client";

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, cartTotal, clearCart } = useStore();

  const [courier, setCourier] = useState("JNE Reg");
  // Format paymentMethod: "qris" atau "bank:Nama Bank"
  const [paymentMethod, setPaymentMethod] = useState<string>("qris");

  const [voucherCode, setVoucherCode] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState<{
    code: string;
    type: "fixed" | "percent";
    value: number;
  } | null>(null);
  const [promoMessage, setPromoMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    province: "DKI Jakarta",
    city: "Jakarta Selatan",
    district: "",
    address: "",
    postcode: "",
  });
  const [isEditingAddress, setIsEditingAddress] = useState(false);

  // State lokal per item keranjang (key -> File / Note / Error)
  const [itemFiles, setItemFiles] = useState<Record<string, File | undefined>>({});
  const [itemNotes, setItemNotes] = useState<Record<string, string>>({});
  const [itemFileErrors, setItemFileErrors] = useState<Record<string, string>>({});

  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([
    { name: "JNE Reg", description: "Estimasi 2–3 hari", price: 17000 },
    { name: "J&T Express", description: "Estimasi 1–2 hari", price: 19000 },
    { name: "Ambil Sendiri", description: "Store Utama", price: 0 },
  ]);
  const [bankOptions, setBankOptions] = useState<BankOption[]>([]);
  const [locationLoading, setLocationLoading] = useState(false);
  const [coordinates, setCoordinates] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [addressErrors, setAddressErrors] = useState<Record<string, string>>({});

  // Sinkronkan file & catatan awal dari cart ke state checkout
  useEffect(() => {
    setItemFiles((prev) => {
      const next = { ...prev };
      cart.forEach((item) => {
        if (item.designFile && !next[item.key]) {
          next[item.key] = item.designFile;
        }
      });
      return next;
    });
    setItemNotes((prev) => {
      const next = { ...prev };
      cart.forEach((item) => {
        if (item.note && next[item.key] === undefined) {
          next[item.key] = item.note;
        }
      });
      return next;
    });
  }, [cart]);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        router.replace("/login?next=/checkout");
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name,name,phone,address")
        .eq("id", data.session.user.id)
        .maybeSingle();

      if (profile) {
        const address = (profile.address as Record<string, string>) || {};
        const loadedForm = {
          name: profile.full_name || profile.name || "",
          phone: profile.phone || "",
          province: address.province || "DKI Jakarta",
          city: address.city || "Jakarta Selatan",
          district: address.district || "",
          postcode: address.postcode || "",
          address: address.address || "",
        };
        setForm(loadedForm);

        // Jika alamat profil belum lengkap, otomatis buka mode edit alamat
        if (
          !loadedForm.name ||
          !loadedForm.phone ||
          !loadedForm.district ||
          !loadedForm.address ||
          !loadedForm.postcode
        ) {
          setIsEditingAddress(true);
        }
      } else {
        setIsEditingAddress(true);
      }
    });

    getStoreSettings().then((settings) => {
      if (settings?.shippingOptions.length) {
        setShippingOptions(settings.shippingOptions);
        setCourier(settings.shippingOptions[0].name);
      }
      if (settings?.bankOptions.length) {
        setBankOptions(settings.bankOptions);
        // Default pilih bank pertama jika tersedia (seperti desain Figma)
        setPaymentMethod(`bank:${settings.bankOptions[0].bank_name}`);
      }
    });
  }, [router]);

  const selectedShipping =
    shippingOptions.find((option) => option.name === courier) ||
    shippingOptions[0];
  const shipping = selectedShipping?.price || 0;
  const discount = appliedVoucher
    ? appliedVoucher.type === "percent"
      ? Math.round((cartTotal * appliedVoucher.value) / 100)
      : Math.min(appliedVoucher.value, cartTotal)
    : 0;
  const total = Math.max(0, cartTotal + shipping - discount);
  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  function handleItemFileChange(
    key: string,
    e: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = e.target.files?.[0];
    setItemFileErrors((prev) => ({ ...prev, [key]: "" }));
    if (!file) return;

    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      setItemFileErrors((prev) => ({
        ...prev,
        [key]: "Ukuran file melebihi batas maksimal 50MB.",
      }));
      e.target.value = "";
      return;
    }

    setItemFiles((prev) => ({ ...prev, [key]: file }));
  }

  function handleRemoveItemFile(key: string, e: React.MouseEvent) {
    e.preventDefault();
    setItemFiles((prev) => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
    setItemFileErrors((prev) => ({ ...prev, [key]: "" }));
  }

  async function useCurrentLocation() {
    if (!navigator.geolocation) {
      alert("Browser tidak mendukung lokasi.");
      return;
    }
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setCoordinates({ lat, lng });
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=id`,
          );
          if (!response.ok) throw new Error("Reverse geocoding gagal.");
          const data = await response.json();
          const address = data.address || {};
          setForm((old) => ({
            ...old,
            province: address.state || address.region || old.province,
            city:
              address.city ||
              address.county ||
              address.municipality ||
              address.town ||
              old.city,
            district:
              address.subdistrict ||
              address.village ||
              address.suburb ||
              address.municipality ||
              old.district,
            postcode: String(address.postcode || old.postcode)
              .replace(/\D/g, "")
              .slice(0, 5),
            address:
              [
                address.road,
                address.house_number,
                address.neighbourhood,
                address.suburb,
              ]
                .filter(Boolean)
                .join(", ") || old.address,
          }));
        } catch (error) {
          console.error(error);
          alert("Lokasi ditemukan, tetapi alamat belum dapat diisi otomatis.");
        } finally {
          setLocationLoading(false);
        }
      },
      (error) => {
        setLocationLoading(false);
        alert(
          error.code === 1
            ? "Izin lokasi ditolak. Aktifkan izin lokasi di browser."
            : "Lokasi saat ini tidak dapat ditemukan.",
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 },
    );
  }

  async function applyPromo() {
    const code = voucherCode.trim().toUpperCase();
    if (!code) {
      setPromoMessage("Masukkan kode promo atau member.");
      return;
    }
    const voucher = await findVoucher(code);
    if (!voucher) {
      const member = await findMemberCode(code);
      if (!member || member.discountPercent <= 0) {
        setAppliedVoucher(null);
        setPromoMessage("Kode promo/member tidak ditemukan atau tidak aktif.");
        return;
      }
      setAppliedVoucher({
        code: member.code,
        type: "percent",
        value: member.discountPercent,
      });
      setPromoMessage(`Kode member ${member.code} berhasil diterapkan.`);
      return;
    }
    if ((voucher.minimum_purchase || 0) > cartTotal) {
      setAppliedVoucher(null);
      setPromoMessage(
        `Minimal belanja ${formatRupiah(voucher.minimum_purchase)}.`,
      );
      return;
    }
    if (voucher.usage_limit !== null && voucher.used_count >= voucher.usage_limit) {
      setAppliedVoucher(null);
      setPromoMessage("Batas penggunaan voucher sudah tercapai.");
      return;
    }
    setAppliedVoucher(voucher);
    setPromoMessage(`Kode ${voucher.code} berhasil diterapkan.`);
  }

  async function uploadDesignFile(orderId: string, file: File): Promise<string | null> {
    try {
      const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const filePath = `orders/${orderId}/${Date.now()}-${cleanName}`;

      // Coba upload ke bucket "designs" atau "products"
      const buckets = ["designs", "design-files", "products"];
      for (const bucket of buckets) {
        const { error } = await supabase.storage
          .from(bucket)
          .upload(filePath, file, { upsert: true });
        if (!error) {
          const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
          return data.publicUrl;
        }
      }
      return null;
    } catch {
      return null;
    }
  }

  async function pay() {
    const errors: Record<string, string> = {};
    const phoneDigits = form.phone.replace(/\D/g, "");
    if (form.name.trim().length < 3)
      errors.name = "Nama penerima minimal 3 karakter.";
    if (
      !(form.phone.startsWith("08") || form.phone.startsWith("+62")) ||
      phoneDigits.length < 10 ||
      phoneDigits.length > 14
    ) {
      errors.phone =
        "Nomor WhatsApp harus diawali 08 atau +62 dan berisi 10–14 digit.";
    }
    if (!form.province) errors.province = "Provinsi wajib dipilih.";
    if (!form.city) errors.city = "Kota/Kabupaten wajib dipilih.";
    if (!form.district) errors.district = "Kecamatan wajib dipilih.";
    if (!/^\d{5}$/.test(form.postcode))
      errors.postcode = "Kode Pos harus 5 digit angka.";
    if (form.address.trim().length < 15)
      errors.address = "Alamat lengkap minimal 15 karakter.";

    setAddressErrors(errors);
    if (Object.keys(errors).length) {
      setIsEditingAddress(true);
      const firstError = Object.values(errors)[0];
      alert(firstError);
      return;
    }

    setLoading(true);
    const orderId = `AC-${Date.now().toString().slice(-8)}`;
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user.id || null;

    const isBankTransfer = paymentMethod.startsWith("bank:");
    const selectedBankName = isBankTransfer
      ? paymentMethod.replace("bank:", "")
      : "";
    const selectedBankObj = isBankTransfer
      ? bankOptions.find((bank) => bank.bank_name === selectedBankName) || null
      : null;

    // Upload file desain masing-masing item (jika ada)
    const uploadedUrls: Record<string, string | null> = {};
    for (const item of cart) {
      const fileToUpload = itemFiles[item.key];
      if (fileToUpload) {
        uploadedUrls[item.key] = await uploadDesignFile(orderId, fileToUpload);
      }
    }

    const { error: orderError } = await supabase.from("orders").insert({
      id: orderId,
      user_id: userId,
      status: "pending",
      courier,
      payment: isBankTransfer
        ? `Transfer Bank - ${selectedBankName}`
        : "QRIS",
      subtotal: cartTotal,
      shipping,
      discount,
      total,
      voucher_code: appliedVoucher?.code || null,
      shipping_address: {
        name: form.name,
        phone: form.phone,
        province: form.province,
        city: form.city,
        district: form.district,
        address: form.address,
        postcode: form.postcode,
        lat: coordinates?.lat || null,
        lng: coordinates?.lng || null,
        google_maps_url: coordinates
          ? `https://maps.google.com/?q=${coordinates.lat},${coordinates.lng}`
          : null,
        selected_bank: selectedBankObj,
      },
    });

    if (orderError) {
      setLoading(false);
      alert(`Pesanan gagal dibuat: ${orderError.message}`);
      return;
    }

    // Simpan order_items beserta catatan & link file desain
    const payloadWithExtras = cart.map((item) => {
      const noteText = (itemNotes[item.key] ?? item.note ?? "").trim();
      const fileUrl = uploadedUrls[item.key];
      const fileName = itemFiles[item.key]?.name || item.designFileName;

      // Gabungkan info file & catatan ke variants sebagai fallback aman jika kolom baru belum ada
      const extraInfo = [
        fileName ? `File: ${fileName}` : "",
        noteText ? `Catatan: ${noteText}` : "",
      ]
        .filter(Boolean)
        .join(" | ");

      return {
        order_id: orderId,
        product_id: item.product.id,
        name: item.product.name,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        variants: extraInfo ? `${item.variants} (${extraInfo})` : item.variants,
        note: noteText || null,
        design_file_url: fileUrl || null,
      };
    });

    let { error: itemsError } = await supabase
      .from("order_items")
      .insert(payloadWithExtras);

    // Fallback otomatis jika tabel order_items belum memiliki kolom note / design_file_url
    if (itemsError && /column/i.test(itemsError.message)) {
      const fallbackPayload = payloadWithExtras.map(
        ({ note: _n, design_file_url: _u, ...base }) => base,
      );
      const retry = await supabase.from("order_items").insert(fallbackPayload);
      itemsError = retry.error;
    }

    if (itemsError) {
      await supabase.from("orders").delete().eq("id", orderId);
      setLoading(false);
      alert(`Item pesanan gagal disimpan: ${itemsError.message}`);
      return;
    }

    clearCart();
    router.push(`/payment/${orderId}`);
  }

  if (cart.length === 0) {
    return (
      <main className="mx-auto max-w-[1180px] px-5 py-12 text-center">
        <h1 className="text-xl font-black">Keranjang kosong</h1>
        <button
          onClick={() => router.push("/")}
          className="mt-5 rounded-lg bg-[#1D4ED8] px-5 py-3 text-sm font-bold text-white"
        >
          Belanja Sekarang
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[1180px] px-4 py-6 md:px-5">
      <div className="grid gap-5 lg:grid-cols-[1fr_370px]">
        {/* ================= KOLOM KIRI ================= */}
        <div className="space-y-4">
          {/* 1. CARD ALAMAT PENGIRIMAN */}
          <section className="rounded-2xl bg-white p-5 shadow-xs">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-blue-200">
                  Alamat Pengiriman
                </h2>

                {!isEditingAddress && (
                  <div className="mt-3">
                    <p className="flex flex-wrap items-center gap-1.5 text-sm font-black uppercase text-slate-900">
                      <MapPin
                        size={16}
                        className="shrink-0 fill-[#1D4ED8] text-white"
                      />
                      <span>{form.name || "Nama Penerima"}</span>
                      <span className="text-slate-400">•</span>
                      <span>
                        {form.phone
                          ? `(${form.phone})`
                          : "(Nomor WhatsApp belum diisi)"}
                      </span>
                    </p>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                      {[
                        form.address,
                        form.district,
                        form.city,
                        form.province,
                        form.postcode ? `ID ${form.postcode}` : "",
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setIsEditingAddress((prev) => !prev)}
                className="shrink-0 rounded-xl border border-blue-200 bg-white px-4 py-2 text-xs font-bold text-[#1D4ED8] transition hover:bg-blue-50"
              >
                {isEditingAddress ? "Selesai" : "Ganti"}
              </button>
            </div>

            {/* Form Input Alamat (Muncul saat tombol "Ganti" diklik atau alamat belum lengkap) */}
            {isEditingAddress && (
              <div className="mt-4 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2">
                <Field
                  label="Nama Penerima"
                  placeholder="Masukkan nama lengkap"
                  value={form.name}
                  onChange={(v) => setForm({ ...form, name: v })}
                  error={addressErrors.name}
                />
                <Field
                  label="Nomor WhatsApp"
                  placeholder="Contoh: 085721314868"
                  value={form.phone}
                  onChange={(v) => setForm({ ...form, phone: v })}
                  error={addressErrors.phone}
                />
                <Field
                  label="Provinsi"
                  placeholder="Masukkan provinsi"
                  value={form.province}
                  onChange={(v) => setForm({ ...form, province: v })}
                  error={addressErrors.province}
                />
                <Field
                  label="Kota / Kabupaten"
                  placeholder="Masukkan kota atau kabupaten"
                  value={form.city}
                  onChange={(v) => setForm({ ...form, city: v })}
                  error={addressErrors.city}
                />
                <Field
                  label="Kecamatan"
                  placeholder="Masukkan kecamatan"
                  value={form.district}
                  onChange={(v) => setForm({ ...form, district: v })}
                  error={addressErrors.district}
                />
                <Field
                  label="Kode Pos"
                  placeholder="5 digit kode pos"
                  value={form.postcode}
                  onChange={(v) =>
                    setForm({
                      ...form,
                      postcode: v.replace(/\D/g, "").slice(0, 5),
                    })
                  }
                  error={addressErrors.postcode}
                />
                <label className="text-xs font-bold text-slate-600 sm:col-span-2">
                  Alamat Lengkap
                  <textarea
                    value={form.address}
                    onChange={(e) =>
                      setForm({ ...form, address: e.target.value })
                    }
                    className="mt-2 h-20 w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-normal text-slate-800 outline-none focus:border-[#1D4ED8]"
                    placeholder="Nama jalan, RT/RW, nomor rumah, gedung, patokan..."
                  />
                  {addressErrors.address && (
                    <span className="mt-1 block text-[11px] text-red-500">
                      {addressErrors.address}
                    </span>
                  )}
                </label>
                <button
                  type="button"
                  onClick={useCurrentLocation}
                  disabled={locationLoading}
                  className="flex h-11 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50/40 text-xs font-bold text-[#1D4ED8] transition hover:bg-blue-50 disabled:opacity-60 sm:col-span-2"
                >
                  <Navigation size={15} />
                  {locationLoading
                    ? "Mencari lokasi..."
                    : "Gunakan Lokasi Saat Ini"}
                </button>
              </div>
            )}
          </section>

          {/* 2. CARD PESANAN PER ITEM (Pesanan 1, Pesanan 2, dst.) */}
          {cart.map((item, idx) => {
            const activeFile = itemFiles[item.key];
            const displayFileName =
              activeFile?.name || item.designFileName || "";
            const currentNote = itemNotes[item.key] ?? item.note ?? "";
            const fileErr = itemFileErrors[item.key];
            const itemSubtotal =
              item.unitPrice * item.quantity + (item.fixedExtra || 0);

            return (
              <section
                key={item.key}
                className="rounded-2xl bg-white p-5 shadow-xs"
              >
                <h2 className="text-base font-black text-slate-900">
                  Pesanan {idx + 1}
                </h2>

                {/* Info Produk & Harga */}
                <div className="mt-3 flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-start gap-3.5">
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="h-16 w-16 shrink-0 rounded-xl bg-blue-100/70 object-cover"
                    />
                    <div className="min-w-0">
                      <h3 className="line-clamp-2 text-base font-black text-slate-900">
                        {item.product.name}
                      </h3>
                      <p className="mt-0.5 text-xs text-slate-400">Variasi :</p>
                      <p className="text-xs font-medium text-slate-700">
                        {item.variants}
                      </p>
                    </div>
                  </div>

                  <p className="shrink-0 text-sm font-black text-[#1D4ED8] md:text-base">
                    {item.quantity} x{" "}
                    {formatRupiah(Math.round(itemSubtotal / item.quantity))}
                  </p>
                </div>

                {/* Upload File Design & Catatan Produksi */}
                <div className="mt-4 space-y-2.5 md:pl-[78px]">
                  <label
                    className={`flex w-full cursor-pointer items-center gap-3.5 rounded-2xl border border-dashed p-3.5 transition ${
                      displayFileName
                        ? "border-emerald-300 bg-emerald-50/40"
                        : "border-blue-200 bg-white hover:border-blue-400 hover:bg-blue-50/30"
                    }`}
                  >
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white ${
                        displayFileName ? "bg-emerald-600" : "bg-[#1D4ED8]"
                      }`}
                    >
                      {displayFileName ? (
                        <FileCheck2 size={20} />
                      ) : (
                        <Upload size={20} strokeWidth={2.2} />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-slate-900 md:text-sm">
                        {displayFileName || "Upload File Design"}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        {activeFile
                          ? `${(activeFile.size / (1024 * 1024)).toFixed(2)} MB • Klik untuk ganti file`
                          : displayFileName
                            ? "File siap • Klik untuk ganti file"
                            : "PDF, TIFF, PNG, JPG, ZIP, RAR (maks. 50Mb)"}
                      </p>
                    </div>

                    {activeFile && (
                      <button
                        type="button"
                        onClick={(e) => handleRemoveItemFile(item.key, e)}
                        title="Hapus file"
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-slate-500 shadow-xs hover:bg-red-50 hover:text-red-500"
                      >
                        <X size={15} />
                      </button>
                    )}

                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf,.cdr,.ai,.tiff,.tif,.zip,.rar"
                      onChange={(e) => handleItemFileChange(item.key, e)}
                      className="hidden"
                    />
                  </label>

                  {fileErr && (
                    <p className="text-xs font-bold text-red-500">{fileErr}</p>
                  )}

                  <div className="flex h-11 w-full items-center gap-2.5 rounded-2xl border border-blue-200 bg-white px-3.5 transition focus-within:border-[#1D4ED8]">
                    <ClipboardEdit
                      size={16}
                      className="shrink-0 text-slate-400"
                    />
                    <input
                      type="text"
                      value={currentNote}
                      onChange={(e) =>
                        setItemNotes((prev) => ({
                          ...prev,
                          [item.key]: e.target.value,
                        }))
                      }
                      placeholder="Kasih Catatan Untuk Tim Produksi/Link Desain"
                      className="h-full w-full bg-transparent text-xs font-normal text-slate-700 placeholder:text-slate-400 outline-none"
                    />
                  </div>
                </div>
              </section>
            );
          })}

          {/* 3. CARD PILIHAN PENGIRIMAN (Grid 2 Kolom + Corner Ribbon Centang) */}
          <section className="rounded-2xl bg-white p-5 shadow-xs">
            <h2 className="text-base font-black text-slate-900">
              Pilihan Pengiriman
            </h2>
            <div className="mt-3.5 grid gap-3 sm:grid-cols-2">
              {shippingOptions.map((option) => {
                const isSelected = courier === option.name;
                return (
                  <button
                    key={option.name}
                    type="button"
                    onClick={() => setCourier(option.name)}
                    className={`relative overflow-hidden rounded-xl border p-4 text-left transition ${
                      isSelected
                        ? "border-blue-300 bg-blue-50/60"
                        : "border-blue-100 bg-white hover:border-blue-200"
                    }`}
                  >
                    {/* Corner Ribbon Centang Biru di Pojok Kiri Atas */}
                    {isSelected && (
                      <div className="absolute left-0 top-0 h-7 w-7 bg-[#1D4ED8] [clip-path:polygon(0_0,100%_0,0_100%)]">
                        <Check
                          size={11}
                          strokeWidth={3}
                          className="ml-1 mt-1 text-white"
                        />
                      </div>
                    )}

                    <div className={isSelected ? "pl-3" : ""}>
                      <p className="text-sm font-black text-slate-900">
                        {option.name}{" "}
                        <span className="font-normal text-slate-700">
                          {option.price === 0
                            ? "Gratis"
                            : formatRupiah(option.price)}
                        </span>
                      </p>
                      <p className="mt-1.5 flex items-center gap-1.5 text-[11px] font-medium text-[#1D4ED8]">
                        <Truck size={13} className="shrink-0" />
                        <span>{option.description}</span>
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        {/* ================= SIDEBAR KANAN ================= */}
        <aside className="h-fit rounded-2xl bg-white p-5 shadow-xs">
          {/* 1. Metode Pembayaran */}
          <div>
            <h2 className="text-base font-black text-slate-900">
              Metode Pembayaran
            </h2>
            <div className="mt-3 divide-y divide-slate-100">
              {/* Daftar Bank dari Store Settings */}
              {bankOptions.map((bank) => {
                const value = `bank:${bank.bank_name}`;
                const checked = paymentMethod === value;
                return (
                  <label
                    key={bank.bank_name}
                    className="flex cursor-pointer items-center justify-between gap-3 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-7 w-11 shrink-0 items-center justify-center rounded border border-slate-100 bg-slate-50 text-[10px] font-black uppercase text-[#1D4ED8]">
                        {bank.bank_name.slice(0, 6)}
                      </span>
                      <div>
                        <span className="block text-xs font-semibold text-slate-800">
                          Transfer {bank.bank_name}
                        </span>
                        {checked && (
                          <span className="block text-[10px] text-slate-400">
                            {bank.account_number} • a.n {bank.account_name}
                          </span>
                        )}
                      </div>
                    </div>
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={checked}
                      onChange={() => setPaymentMethod(value)}
                      className="h-4 w-4 accent-[#1D4ED8]"
                    />
                  </label>
                );
              })}

              {/* Opsi QRIS (Xendit) */}
              <label className="flex cursor-pointer items-center justify-between gap-3 py-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-11 shrink-0 items-center justify-center rounded border border-slate-100 bg-slate-50 text-slate-700">
                    <QrCode size={16} />
                  </span>
                  <span className="text-xs font-semibold text-slate-800">
                    QRIS (E-Wallet / M-Banking)
                  </span>
                </div>
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === "qris"}
                  onChange={() => setPaymentMethod("qris")}
                  className="h-4 w-4 accent-[#1D4ED8]"
                />
              </label>
            </div>
          </div>

          {/* 2. Kode Promo / Member */}
          <div className="mt-2 border-t border-slate-100 pt-4">
            <h3 className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <TicketPercent size={16} className="text-[#1D4ED8]" />
              <span>Kode Promo / Member</span>
            </h3>
            <div className="mt-2.5 flex gap-2">
              <input
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                placeholder="KODE PROMO"
                className="h-10 min-w-0 flex-1 rounded-xl border border-blue-200 px-3 text-center text-xs font-bold uppercase text-[#1D4ED8] placeholder:font-normal placeholder:text-slate-400 outline-none focus:border-[#1D4ED8]"
              />
              <button
                type="button"
                onClick={applyPromo}
                className="h-10 shrink-0 rounded-xl bg-[#1D4ED8] px-4 text-xs font-bold text-white transition hover:bg-blue-800"
              >
                Terapkan
              </button>
            </div>
            {promoMessage && (
              <p
                className={`mt-2 text-[11px] font-medium ${
                  appliedVoucher ? "text-emerald-600" : "text-red-500"
                }`}
              >
                {promoMessage}
              </p>
            )}
            {appliedVoucher && (
              <div className="mt-3 flex items-center justify-between text-xs font-bold">
                <span className="text-slate-900">Diskon Member / Promo</span>
                <span className="text-red-500">- {formatRupiah(discount)}</span>
              </div>
            )}
          </div>

          {/* 3. Ringkasan Transaksi */}
          <div className="mt-4 border-t border-slate-100 pt-4">
            <h3 className="text-base font-black text-slate-900">
              Ringkasan Transaksi
            </h3>
            <div className="mt-3 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-700">
                  Total Harga ({totalItemsCount} Barang)
                </span>
                <b className="text-[#1D4ED8]">{formatRupiah(cartTotal)}</b>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-700">Total Ongkos Kirim</span>
                <b className="text-[#1D4ED8]">{formatRupiah(shipping)}</b>
              </div>
              {discount > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-700">Diskon</span>
                  <b className="text-red-500">- {formatRupiah(discount)}</b>
                </div>
              )}
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
              <span className="text-sm font-black text-slate-900">
                Total Tagihan
              </span>
              <span className="text-xl font-black text-[#1D4ED8]">
                {formatRupiah(total)}
              </span>
            </div>

            <button
              type="button"
              onClick={pay}
              disabled={loading}
              className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1D4ED8] text-sm font-bold text-white transition hover:bg-blue-800 disabled:opacity-60"
            >
              <ShieldCheck size={18} />
              <span>{loading ? "Memproses Pesanan..." : "Bayar Sekarang"}</span>
            </button>

            <p className="mt-2.5 text-center text-[10px] leading-relaxed text-slate-400">
              Dengan melanjutkan pembayaran, kamu menyetujui S&K Asuransi
              Pengiriman & Proteksi.
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
}) {
  return (
    <label className="text-xs font-bold text-slate-600">
      {label}
      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`mt-2 h-11 w-full rounded-xl border px-3 text-xs font-normal text-slate-800 outline-none focus:border-[#1D4ED8] ${
          error ? "border-red-500" : "border-slate-200"
        }`}
      />
      {error && (
        <span className="mt-1 block text-[11px] text-red-500">{error}</span>
      )}
    </label>
  );
}