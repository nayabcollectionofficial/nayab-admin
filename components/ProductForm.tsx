"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { AdminProduct } from "@/lib/products";

const inputCls =
  "w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900";

export default function ProductForm({
  initial,
  existingBrands,
}: {
  initial?: AdminProduct;
  existingBrands: string[];
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const aspectMap = useRef(new Map<string, number>());
  const newUploads = useRef<string[]>([]);
  const imagesRef = useRef<string[]>(initial?.images ?? []);

  const [name, setName] = useState(initial?.name ?? "");
  const [brand, setBrand] = useState(initial?.brand ?? "");
  const [category, setCategory] = useState(initial?.category ?? "two-piece");
  const [price, setPrice] = useState(initial ? String(initial.price) : "");
  const [originalPrice, setOriginalPrice] = useState(
    initial?.original_price ? String(initial.original_price) : ""
  );
  const [images, setImages] = useState<string[]>(initial?.images ?? []);
  const [aspect, setAspect] = useState<number | null>(initial?.aspect ?? null);
  const [description, setDescription] = useState(initial?.description ?? "");
  const [fabric, setFabric] = useState(initial?.fabric ?? "");
  const [care, setCare] = useState(initial?.care ?? "");
  const [stock, setStock] = useState(initial ? String(initial.stock) : "10");
  const [featured, setFeatured] = useState(initial?.featured ?? false);
  const [isNew, setIsNew] = useState(initial?.is_new ?? false);

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const slugPreview = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  useEffect(() => {
    imagesRef.current = images;
  });

  function fireCleanup() {
    const pending = newUploads.current.filter((u) => !imagesRef.current.includes(u));
    if (pending.length === 0) return;
    newUploads.current = [];
    fetch("/api/upload/cleanup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ urls: pending }),
    }).catch(() => {});
  }

  useEffect(() => {
    return fireCleanup;
  }, []);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    const file = files[0];

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file (PNG, JPG or WEBP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5 MB.");
      return;
    }

    let detectedAspect: number | null = null;
    try {
      detectedAspect = await new Promise<number | null>((resolve) => {
        const url = URL.createObjectURL(file);
        const img = new globalThis.Image();
        img.onload = () => {
          resolve(Number((img.naturalWidth / img.naturalHeight).toFixed(3)));
          URL.revokeObjectURL(url);
        };
        img.onerror = () => {
          resolve(null);
          URL.revokeObjectURL(url);
        };
        img.src = url;
      });
    } catch {
      detectedAspect = null;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      setUploading(true);
      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dataUrl: reader.result }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Upload failed.");
          return;
        }
        if (detectedAspect) aspectMap.current.set(data.url, detectedAspect);
        if (imagesRef.current.length === 0 && detectedAspect) {
          setAspect(detectedAspect);
        }
        setImages((prev) => [...prev, data.url]);
        newUploads.current.push(data.url);
      } catch {
        setError("Upload failed. Please try again.");
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  }

  function removeImage(url: string) {
    const idx = imagesRef.current.indexOf(url);
    const remaining = imagesRef.current.filter((u) => u !== url);
    setImages(remaining);
    if (idx === 0) {
      const nextMain = remaining[0];
      setAspect(nextMain ? (aspectMap.current.get(nextMain) ?? null) : null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const payload = {
      name,
      brand,
      category,
      price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : null,
      images,
      description,
      fabric,
      care,
      featured,
      isNew: isNew,
      stock: Number(stock),
      aspect,
    };

    setSaving(true);
    try {
      const res = await fetch(
        initial ? `/api/products/${initial.id}` : "/api/products",
        {
          method: initial ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to save product.");
        setSaving(false);
        return;
      }
      newUploads.current = [];
      router.push("/products");
      router.refresh();
    } catch {
      setError("Failed to save product. Please try again.");
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start"
    >
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="font-medium text-slate-900">Details</h2>
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium uppercase tracking-wider text-slate-500 mb-1.5">
                Product Name *
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Golden Embroidered Chiffon Three-Piece"
                className={inputCls}
              />
              {name && (
                <p className="mt-1.5 text-xs text-slate-400">
                  Link: /product/{slugPreview || "…"}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-slate-500 mb-1.5">
                Brand *
              </label>
              <input
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g. Bin Naem"
                className={inputCls}
              />
              {existingBrands.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {existingBrands.map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setBrand(b)}
                      className={
                        "text-xs px-2.5 py-1 rounded-full border transition-colors " +
                        (brand === b
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-white text-slate-600 border-slate-300 hover:border-slate-500")
                      }
                    >
                      {b}
                    </button>
                  ))}
                </div>
              )}
              <p className="mt-1.5 text-xs text-slate-400">
                Nayi brand add karni ho to bas naam type kar do — save hone par apne aap ban jayegi.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-slate-500 mb-1.5">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={inputCls}
              >
                <option value="two-piece">Two-Piece Suit</option>
                <option value="three-piece">Three-Piece Suit</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-slate-500 mb-1.5">
                Price (Rs.) *
              </label>
              <input
                type="number"
                min="1"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="e.g. 4950"
                className={inputCls}
              />
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-slate-500 mb-1.5">
                Original Price (Rs.) — sale banane ke liye
              </label>
              <input
                type="number"
                min="1"
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value)}
                placeholder="Khaali chhoren to regular price"
                className={inputCls}
              />
              {originalPrice && Number(originalPrice) > Number(price) && (
                <p className="mt-1.5 text-xs text-emerald-600">
                  On Sale — store ke Sales section me ayega
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-slate-500 mb-1.5">
                Stock *
              </label>
              <input
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className={inputCls}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium uppercase tracking-wider text-slate-500 mb-1.5">
                Description
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Fabric feel, embroidery, fit notes…"
                className={inputCls}
              />
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-slate-500 mb-1.5">
                Fabric
              </label>
              <input
                value={fabric}
                onChange={(e) => setFabric(e.target.value)}
                placeholder="e.g. Premium Chiffon"
                className={inputCls}
              />
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-slate-500 mb-1.5">
                Care
              </label>
              <input
                value={care}
                onChange={(e) => setCare(e.target.value)}
                placeholder="e.g. Dry clean recommended"
                className={inputCls}
              />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-6">
            <label className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="w-4 h-4 accent-slate-900"
              />
              Featured (home page spotlight)
            </label>
            <label className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={isNew}
                onChange={(e) => setIsNew(e.target.checked)}
                className="w-4 h-4 accent-slate-900"
              />
              New badge
            </label>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="font-medium text-slate-900">Photos</h2>
          <p className="text-xs text-slate-400 mt-1">
            Pehli photo main image hogi. PNG, JPG, WEBP — 5 MB tak.
          </p>

          <div className="mt-4 grid grid-cols-3 gap-3">
            {images.map((url, idx) => (
              <div
                key={url}
                className="relative aspect-[3/4] bg-slate-100 rounded-lg overflow-hidden"
              >
                <Image
                  src={url}
                  alt={`Image ${idx + 1}`}
                  fill
                  sizes="150px"
                  className="object-cover"
                />
                {idx === 0 && (
                  <span className="absolute top-1 left-1 bg-slate-900 text-white text-[10px] px-1.5 py-0.5 rounded">
                    Main
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(url)}
                  className="absolute top-1 right-1 bg-red-600 text-white w-6 h-6 rounded-full text-xs flex items-center justify-center"
                  aria-label="Remove image"
                >
                  ×
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="relative aspect-[3/4] border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center text-slate-400 hover:border-slate-500 hover:text-slate-600 transition-colors disabled:opacity-50"
            >
              {uploading ? (
                <span className="text-xs">Uploading…</span>
              ) : (
                <>
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                  </svg>
                  <span className="mt-1.5 text-[11px]">Add Photo</span>
                </>
              )}
            </button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => {
              handleFiles(e.target.files);
              e.target.value = "";
            }}
          />

          {aspect && (
            <p className="mt-3 text-xs text-slate-400">
              Image ratio: {aspect} — gallery crop ke bina full image dikhayega
            </p>
          )}
        </div>

        {error && (
          <p className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving || uploading}
            className="flex-1 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-sm font-medium rounded-lg py-2.5 transition-colors"
          >
            {saving
              ? "Saving…"
              : initial
                ? "Save Changes"
                : "Create Product"}
          </button>
          <button
            type="button"
            onClick={() => {
              fireCleanup();
              router.push("/products");
            }}
            className="px-4 py-2.5 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
}
