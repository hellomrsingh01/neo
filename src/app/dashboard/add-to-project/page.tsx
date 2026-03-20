"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

type SummaryCard =
  | { key: "totalItems"; label: string; value: string }
  | { key: "totalUnits"; label: string; value: string }
  | { key: "status"; label: string; value: string; tone: "success" };

type Room = {
  id: string;
  name: string;
  itemsCount: number;
  active?: boolean;
};

type ProjectItem = {
  id: string;
  productName: string;
  sku: string;
  manufacturer: string;
  roomId: Room["id"];
  quantity: number;
  imageSrc: string;
};

function Icon({
  name,
  className,
}: {
  name:
    | "share"
    | "export"
    | "plus"
    | "minus"
    | "check"
    | "dots"
    | "chevronDown"
    | "room";
  className?: string;
}) {
  const common = "stroke-current fill-none";

  if (name === "plus") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 5v14M5 12h14"
          className={common}
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (name === "minus") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M5 12h14"
          className={common}
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (name === "check") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M20 6 9 17l-5-5"
          className={common}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (name === "dots") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 6.5h.01M12 12h.01M12 17.5h.01"
          className={common}
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (name === "chevronDown") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M6.5 9.5 12 15l5.5-5.5"
          className={common}
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (name === "share") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M16 8a3 3 0 1 0-2.8-4"
          className={common}
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M8.8 10.9 14.9 7.6"
          className={common}
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M8 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
          className={common}
          strokeWidth="1.8"
        />
        <path
          d="M8.8 13.1 14.9 16.4"
          className={common}
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M16 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
          className={common}
          strokeWidth="1.8"
        />
      </svg>
    );
  }

  if (name === "export") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 3v10"
          className={common}
          strokeWidth="1.9"
          strokeLinecap="round"
        />
        <path
          d="M8.5 6.5 12 3l3.5 3.5"
          className={common}
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M5 13.5v5A2.5 2.5 0 0 0 7.5 21h9A2.5 2.5 0 0 0 19 18.5v-5"
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
      <path
        d="M6.5 21V10.2c0-.8.4-1.5 1.1-2l3.7-2.7a1.9 1.9 0 0 1 2.2 0l3.7 2.7c.7.5 1.1 1.2 1.1 2V21"
        className={common}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M10 21v-6.2c0-.6.5-1.1 1.1-1.1h1.8c.6 0 1.1.5 1.1 1.1V21"
        className={common}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const summaryCards: SummaryCard[] = [
  { key: "totalItems", label: "Total Items", value: "4" },
  { key: "totalUnits", label: "Total Units", value: "28" },
  { key: "status", label: "Status", value: "All changes saved", tone: "success" },
];

const initialRooms: Room[] = [
  { id: "meeting-room", name: "Meeting Room", itemsCount: 12, active: true },
  { id: "workspace-area", name: "Workspace Area", itemsCount: 8 },
  { id: "reception", name: "Reception", itemsCount: 6 },
  { id: "private-cabin", name: "Private Cabin", itemsCount: 2 },
];

const badgeToneByRoomId: Record<
  Room["id"],
  { bg: string; text: string; ring: string }
> = {
  "meeting-room": {
    bg: "bg-sky-50",
    text: "text-sky-800",
    ring: "ring-sky-900/10",
  },
  "workspace-area": {
    bg: "bg-emerald-50",
    text: "text-emerald-800",
    ring: "ring-emerald-900/10",
  },
  "private-cabin": {
    bg: "bg-violet-50",
    text: "text-violet-800",
    ring: "ring-violet-900/10",
  },
  reception: {
    bg: "bg-amber-50",
    text: "text-amber-800",
    ring: "ring-amber-900/10",
  },
};

const items: ProjectItem[] = [
  {
    id: "item-1",
    productName: "Gesture Chair",
    sku: "St-1",
    manufacturer: "Steelcase",
    roomId: "meeting-room",
    quantity: 12,
    imageSrc: "/Rectangle 11.png",
  },
  {
    id: "item-2",
    productName: "Gesture Chair",
    sku: "St-1",
    manufacturer: "Steelcase",
    roomId: "workspace-area",
    quantity: 12,
    imageSrc: "/Rectangle 11.png",
  },
  {
    id: "item-3",
    productName: "Gesture Chair",
    sku: "St-1",
    manufacturer: "Steelcase",
    roomId: "private-cabin",
    quantity: 12,
    imageSrc: "/Rectangle 11.png",
  },
  {
    id: "item-4",
    productName: "Gesture Chair",
    sku: "St-1",
    manufacturer: "Steelcase",
    roomId: "reception",
    quantity: 12,
    imageSrc: "/Rectangle 11.png",
  },
];

export default function AddToProjectPage() {
  const totalUnits = 28;
  const [isAddRoomOpen, setIsAddRoomOpen] = useState(false);
  const [rooms, setRooms] = useState<Room[]>(() => initialRooms);

  const addRoomOptions = useMemo(() => initialRooms, []);

  return (
    <main className="mt-6 w-full">
      {/* Add To Project Header */}
      <section>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-[34px]">
              Add to Project <span className="font-medium">+</span>
            </h1>
            <p className="mt-1 text-sm font-semibold text-emerald-100/75">
              Section 1 • 4 items • 28 units
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-start gap-2 sm:justify-end">
            <button
              type="button"
              className="inline-flex h-10 items-center gap-2 rounded-full bg-emerald-900 px-4 text-xs font-semibold text-white shadow-sm ring-1 ring-emerald-900/10 transition-colors hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
            >
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/15">
                <Icon name="share" className="h-4 w-4 text-white" />
              </span>
              Share
            </button>

            <button
              type="button"
              className="inline-flex h-10 items-center gap-2 rounded-full bg-emerald-900 px-4 text-xs font-semibold text-white shadow-sm ring-1 ring-emerald-900/10 transition-colors hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
            >
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/15">
                <Icon name="export" className="h-4 w-4 text-white" />
              </span>
              Export
            </button>

            <button
              type="button"
              className="inline-flex h-10 items-center gap-2 rounded-full bg-white px-4 text-xs font-semibold text-emerald-950 shadow-sm ring-1 ring-black/10 transition-colors hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/35"
            >
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-900/10 text-emerald-900">
                <Icon name="plus" className="h-4 w-4" />
              </span>
              Add Products
            </button>
          </div>
        </div>
      </section>

      {/* Summary Cards */}
      <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {summaryCards.map((card) => {
          const isStatus = card.key === "status";
          return (
            <div
              key={card.key}
              className="rounded-[18px] bg-white px-5 py-4 text-gray-900 shadow-[0_18px_50px_rgba(0,0,0,0.18)] ring-1 ring-black/5"
            >
              <div className="text-xs font-semibold text-gray-500">
                {card.label}
              </div>

              {isStatus ? (
                <div className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-emerald-900">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 ring-1 ring-emerald-900/10">
                    <Icon name="check" className="h-3.5 w-3.5" />
                  </span>
                  {card.value}
                </div>
              ) : (
                <div className="mt-1 text-3xl font-semibold text-emerald-950">
                  {card.value}
                </div>
              )}
            </div>
          );
        })}
      </section>

      <section className="mt-6 grid grid-cols-1 items-stretch gap-6 lg:grid-cols-[260px_1fr]">
        {/* Rooms Sections Panel */}
        <aside className="flex h-full flex-col rounded-[18px] bg-white p-4 text-gray-900 shadow-[0_18px_50px_rgba(0,0,0,0.18)] ring-1 ring-black/5">
          {/* Rooms Sections Header */}
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-emerald-950">
              Rooms / Sections
            </h2>
          </div>

          {/* Add New Room Button */}
          <div className="relative mt-4">
            <button
              type="button"
              onClick={() => setIsAddRoomOpen((v) => !v)}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[12px] bg-white px-4 text-xs font-semibold text-emerald-900 ring-1 ring-gray-200/80 shadow-[0_10px_30px_rgba(0,0,0,0.06)] transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/30"
              aria-haspopup="menu"
              aria-expanded={isAddRoomOpen}
            >
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 ring-1 ring-emerald-900/10">
              </span>
              + Add New Room
            </button>

            {/* Add New Room Dropdown */}
            {isAddRoomOpen ? (
              <div
                role="menu"
                className="absolute left-0 right-0 top-[calc(100%+10px)] z-20 overflow-hidden rounded-[14px] bg-white shadow-[0_18px_50px_rgba(0,0,0,0.14)] ring-1 ring-gray-200/80"
              >
                {addRoomOptions.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setRooms((prev) => {
                        if (prev.some((r) => r.id === opt.id)) return prev;
                        return [...prev, { ...opt, active: false }];
                      });
                      setIsAddRoomOpen(false);
                    }}
                    className="flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left text-xs font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    <span>{opt.name}</span>
                    <span className="text-[11px] font-semibold text-gray-400">+</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          {/* Room List Items */}
          <div className="mt-4 flex-1 space-y-2">
            {rooms.map((room) => {
              const active = Boolean(room.active);
              return (
                <button
                  key={room.id}
                  type="button"
                  className={[
                    "flex w-full items-center gap-3 rounded-[14px] px-3 py-3 text-left ring-1 transition-colors",
                    active
                      ? "bg-emerald-50/60 ring-emerald-900/10"
                      : "bg-white ring-gray-200/70 hover:bg-gray-50",
                  ].join(" ")}
                  aria-current={active ? "true" : undefined}
                >
                  <span
                    className={[
                      "inline-flex h-9 w-9 items-center justify-center rounded-xl ring-1",
                      active
                        ? "bg-white text-emerald-900 ring-emerald-900/10"
                        : "bg-[#f3f6f5] text-emerald-900 ring-emerald-900/10",
                    ].join(" ")}
                  >
                    <Icon name="room" className="h-5 w-5" />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-emerald-950">
                      {room.name}
                    </span>
                    <span className="mt-0.5 block text-xs font-semibold text-gray-500">
                      {room.itemsCount} Items
                    </span>
                  </span>

                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#f3f6f5] text-emerald-900 ring-1 ring-emerald-900/10 hover:bg-emerald-50">
                    <Icon name="dots" className="h-4.5 w-4.5" />
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-4" />
        </aside>

        {/* Project Items Panel */}
        <section className="h-full rounded-[22px] bg-white p-4 text-gray-900 shadow-[0_18px_50px_rgba(0,0,0,0.18)] ring-1 ring-black/5 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-base font-semibold text-emerald-950">
              Project Items
            </h2>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                className="inline-flex h-10 items-center gap-2 rounded-full bg-gray-100 px-4 text-xs font-semibold text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50"
              >
                All Rooms
                <Icon name="chevronDown" className="h-4 w-4" />
              </button>

              <button
                type="button"
                aria-label="Add item"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-900 text-white shadow-sm ring-1 ring-emerald-900/10 hover:bg-emerald-800"
              >
                <Icon name="plus" className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="mt-4 overflow-hidden rounded-[16px] ring-1 ring-gray-200/80">
            <div className="grid grid-cols-[1.5fr_.9fr_.9fr_.7fr] gap-4 bg-[#f4f7f6] px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              <div>Product</div>
              <div>Manufacturer</div>
              <div>Room</div>
              <div className="text-right">Quantity</div>
            </div>

            <div className="divide-y divide-gray-100 bg-white">
              {items.map((item) => {
                const room = rooms.find((r) => r.id === item.roomId);
                const badgeTone = badgeToneByRoomId[item.roomId];

                return (
                  <div
                    key={item.id}
                    className="grid grid-cols-[1.5fr_.9fr_.9fr_.7fr] items-center gap-4 px-4 py-3.5"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="relative h-12 w-12 overflow-hidden rounded-[14px] bg-[#eef3f2] ring-1 ring-black/5">
                        <Image
                          src={item.imageSrc}
                          alt={item.productName}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-emerald-950">
                          {item.productName}
                        </div>
                        <div className="mt-0.5 text-xs font-semibold text-gray-500">
                          SKU: {item.sku}
                        </div>
                      </div>
                    </div>

                    <div className="text-sm font-semibold text-gray-600">
                      {item.manufacturer}
                    </div>

                    <div>
                      <span
                        className={[
                          "inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold ring-1",
                          badgeTone.bg,
                          badgeTone.text,
                          badgeTone.ring,
                        ].join(" ")}
                      >
                        {room?.name ?? "—"}
                      </span>
                    </div>

                    <div className="flex items-center justify-end">
                      <div className="inline-flex items-center overflow-hidden rounded-full bg-gray-100 ring-1 ring-gray-200">
                        <button
                          type="button"
                          aria-label="Decrease quantity"
                          className="inline-flex h-9 w-9 items-center justify-center text-gray-600 hover:bg-gray-50"
                        >
                          <Icon name="minus" className="h-4 w-4" />
                        </button>
                        <div className="min-w-10 px-3 text-center text-sm font-semibold text-gray-800">
                          {item.quantity}
                        </div>
                        <button
                          type="button"
                          aria-label="Increase quantity"
                          className="inline-flex h-9 w-9 items-center justify-center text-gray-600 hover:bg-gray-50"
                        >
                          <Icon name="plus" className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-3 flex flex-col gap-2 text-xs font-semibold text-gray-500 sm:flex-row sm:items-center sm:justify-between">
            <div>Showing 4 of 4 items</div>
            <div>Total Units: {totalUnits}</div>
          </div>
        </section>
      </section>
    </main>
  );
}

