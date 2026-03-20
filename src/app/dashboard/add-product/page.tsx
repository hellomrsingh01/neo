"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type TabKey = "details" | "pricing" | "media" | "settings";

type Option = {
  id: string;
  label: string;
};

const subCategories: Option[] = [
  { id: "outdoor-seating", label: "Outdoor Seating" },
  { id: "office-task-chairs", label: "Office / Task Chairs" },
  { id: "meeting-room", label: "Meeting Room" },
];

const manufacturers: Option[] = [
  { id: "steelcase", label: "Steelcase" },
  { id: "orangebox", label: "Orangebox" },
  { id: "hni", label: "HNI" },
];

const categories: Option[] = [
  { id: "seating", label: "Seating" },
  { id: "desks", label: "Desks" },
  { id: "tables", label: "Tables" },
];

const tags = ["Ergonomic", "Office Chair", "Premium"];

const uploadedImages = [
  { id: "img-1", isPrimary: true },
  { id: "img-2", isPrimary: false },
  { id: "img-3", isPrimary: false },
];

function Icon({
  name,
  className,
}: {
  name: "arrowLeft" | "upload" | "image";
  className?: string;
}) {
  const common = "stroke-current fill-none";

  if (name === "arrowLeft") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M14.5 6.5 9 12l5.5 5.5"
          className={common}
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (name === "upload") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 16V7"
          className={common}
          strokeWidth="1.9"
          strokeLinecap="round"
        />
        <path
          d="M8.5 10.5 12 7l3.5 3.5"
          className={common}
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M5 17.5a3.5 3.5 0 0 0 3.5 3.5h7A3.5 3.5 0 0 0 19 17.5"
          className={common}
          strokeWidth="1.9"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="4.5"
        y="6"
        width="15"
        height="12"
        rx="2.2"
        className={common}
        strokeWidth="1.7"
      />
      <path
        d="M7.5 14.5l2.6-2.6 3.2 3.2 2.1-2.1 2.8 2.8"
        className={common}
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.2 10.2h.01"
        className={common}
        strokeWidth="3.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function TabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "relative -mb-px inline-flex h-10 items-center justify-center px-5 text-xs font-semibold transition-colors",
        active ? "text-emerald-900" : "text-gray-500 hover:text-gray-700",
      ].join(" ")}
    >
      {label}
      <span
        className={[
          "absolute inset-x-4 bottom-0 h-[2px] rounded-full transition-opacity",
          active ? "bg-emerald-900 opacity-100" : "bg-transparent opacity-0",
        ].join(" ")}
      />
    </button>
  );
}

export default function AddProductPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>("details");
  const [description, setDescription] = useState("");

  const tabs = useMemo(
    () =>
      [
        { key: "details" as const, label: "Product Details" },
        { key: "pricing" as const, label: "Pricing & Stock" },
        { key: "media" as const, label: "Media & Assets" },
        { key: "settings" as const, label: "Settings" },
      ] satisfies Array<{ key: TabKey; label: string }>,
    [],
  );

  return (
    <>
      {/* Add Product Header Card */}
      <section className="mt-5 rounded-[18px] bg-white px-5 py-4 text-gray-900 shadow-[0_18px_50px_rgba(0,0,0,0.18)] ring-1 ring-black/5 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <button
              type="button"
              aria-label="Go back"
              onClick={() => router.back()}
              className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50"
            >
              <Icon name="arrowLeft" className="h-5 w-5" />
            </button>

            <div>
              <h1 className="text-xl font-semibold text-emerald-950 sm:text-2xl">
                Add New Product
              </h1>
              <p className="mt-0.5 text-xs font-semibold text-gray-500">
                Create a new product entry
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => router.push("/dashboard/product-catalogue")}
              className="inline-flex h-9 items-center justify-center rounded-full bg-gray-100 px-4 text-xs font-semibold text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              className="inline-flex h-9 items-center justify-center rounded-full bg-emerald-900 px-4 text-xs font-semibold text-white shadow-sm ring-1 ring-emerald-900/10 hover:bg-emerald-800"
            >
              Save Changes
            </button>
          </div>
        </div>
      </section>

      {/* Add Product Tabs */}
      <section className="mt-5 overflow-hidden rounded-[18px] bg-white text-gray-900 shadow-[0_18px_50px_rgba(0,0,0,0.18)] ring-1 ring-black/5">
        <div className="border-b border-gray-100 px-3">
          <nav className="flex flex-wrap items-center gap-1">
            {tabs.map((t) => (
              <TabButton
                key={t.key}
                label={t.label}
                active={activeTab === t.key}
                onClick={() => setActiveTab(t.key)}
              />
            ))}
          </nav>
        </div>

        <div className="p-5 sm:p-6">
          {/* Product Details Tab */}
          {activeTab === "details" ? (
            <div className="space-y-6">
              <section>
                <h2 className="text-sm font-semibold text-emerald-950">
                  Basic Information
                </h2>

                <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
                  <div className="space-y-2">
                    <label className="block text-[11px] font-semibold text-gray-600">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      placeholder="Enter product name"
                      className="h-10 w-full rounded-[12px] bg-gray-100 px-3.5 text-sm text-gray-900 placeholder:text-gray-400 ring-1 ring-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-600/35"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[11px] font-semibold text-gray-600">
                      Sub Category
                    </label>
                    <select className="h-10 w-full rounded-[12px] bg-gray-100 px-3.5 text-sm text-gray-900 ring-1 ring-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-600/35">
                      {subCategories.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[11px] font-semibold text-gray-600">
                      Enter New Manufacturers
                    </label>
                    <select className="h-10 w-full rounded-[12px] bg-gray-100 px-3.5 text-sm text-gray-900 ring-1 ring-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-600/35">
                      <option value="">Select</option>
                      {manufacturers.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[11px] font-semibold text-gray-600">
                      Manufacturer
                    </label>
                    <select className="h-10 w-full rounded-[12px] bg-gray-100 px-3.5 text-sm text-gray-900 ring-1 ring-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-600/35">
                      {manufacturers.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[11px] font-semibold text-gray-600">
                      Category
                    </label>
                    <select className="h-10 w-full rounded-[12px] bg-gray-100 px-3.5 text-sm text-gray-900 ring-1 ring-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-600/35">
                      {categories.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[11px] font-semibold text-gray-600">
                      Product Website Address
                    </label>
                    <input
                      type="url"
                      placeholder="Enter product website address"
                      className="h-10 w-full rounded-[12px] bg-gray-100 px-3.5 text-sm text-gray-900 placeholder:text-gray-400 ring-1 ring-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-600/35"
                    />
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-sm font-semibold text-emerald-950">
                  Description
                </h2>

                <div className="mt-4 space-y-2">
                  <label className="block text-[11px] font-semibold text-gray-600">
                    Product Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter detailed product description"
                    rows={5}
                    className="w-full resize-none rounded-[12px] bg-gray-100 px-3.5 py-3 text-sm text-gray-900 placeholder:text-gray-400 ring-1 ring-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-600/35"
                  />
                  <div className="text-[10px] font-semibold text-gray-400">
                    {Math.min(description.length, 500)} / 500 characters
                  </div>
                </div>
              </section>

              <section className="border-t border-gray-100 pt-5">
                <h2 className="text-sm font-semibold text-emerald-950">Tags</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {tags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-900 ring-1 ring-emerald-900/10"
                    >
                      {t}
                      <button
                        type="button"
                        className="text-emerald-900/55 hover:text-emerald-900"
                        aria-label={`Remove ${t}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </section>
            </div>
          ) : null}

          {/* Media & Assets Tab */}
          {activeTab === "media" ? (
            <div className="-mx-5 -my-5 px-6 pt-6 pb-8 sm:-mx-6 sm:-my-6">
              <div className="space-y-5">
                <section>
                  <h2 className="text-sm font-semibold text-emerald-950">
                    Product Images
                  </h2>

                  <div className="mt-3 w-full max-w-[590px]">
                    <div className="h-[190px] rounded-[16px] border border-dashed border-gray-200 bg-gray-50">
                      <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-900 ring-1 ring-emerald-900/10">
                          <Icon name="upload" className="h-6 w-6" />
                        </div>
                        <div className="mt-3 text-xs font-semibold text-gray-800">
                          Upload product images
                        </div>
                        <div className="mt-1 text-[11px] font-medium text-gray-500">
                          Drag and drop or click to browse · PNG, JPG up to 10MB
                        </div>
                        <button
                          type="button"
                          className="mt-4 inline-flex h-9 items-center justify-center rounded-[12px] bg-emerald-100 px-5 text-xs font-semibold text-emerald-900 ring-1 ring-emerald-900/10 hover:bg-emerald-50"
                        >
                          Choose Files
                        </button>
                      </div>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-xs font-semibold text-gray-700">
                    Uploaded Images (3)
                  </h3>

                  <div className="mt-3 w-full max-w-[440px]">
                    <div className="grid grid-cols-3 gap-4">
                      {uploadedImages.map((img) => (
                        <div
                          key={img.id}
                          className="relative h-[140px] w-[136px] overflow-hidden rounded-2xl bg-white p-3 ring-1 ring-gray-200/80 shadow-[0_10px_30px_rgba(0,0,0,0.06)]"
                        >
                          {img.isPrimary ? (
                            <span className="absolute left-3 top-3 inline-flex items-center rounded-full bg-emerald-900 px-2 py-0.5 text-[10px] font-semibold text-white">
                              Primary
                            </span>
                          ) : null}

                          <div className="flex h-full items-center justify-center rounded-[14px] bg-gradient-to-br from-emerald-50 to-white ring-1 ring-black/5">
                            <span className="inline-flex h-9 w-9 items-center justify-center rounded-[12px] bg-white text-gray-500 ring-1 ring-gray-200">
                              <Icon name="image" className="h-5 w-5" />
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              </div>
            </div>
          ) : null}

          {/* Pricing & Stock Tab */}
          {activeTab === "pricing" ? (
            <section className="rounded-[16px] bg-gray-50 p-6 ring-1 ring-gray-200">
              <h2 className="text-sm font-semibold text-emerald-950">
                Pricing &amp; Stock
              </h2>
              <p className="mt-1 text-xs font-medium text-gray-500">
                Coming soon
              </p>
            </section>
          ) : null}

          {/* Settings Tab */}
          {activeTab === "settings" ? (
            <section className="rounded-[16px] bg-gray-50 p-6 ring-1 ring-gray-200">
              <h2 className="text-sm font-semibold text-emerald-950">
                Settings
              </h2>
              <p className="mt-1 text-xs font-medium text-gray-500">
                Coming soon
              </p>
            </section>
          ) : null}
        </div>
      </section>
    </>
  );
}

