import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

type RoomInfo = {
  id: string;
  name: string;
  itemsCount: number;
};

type RoomItem = {
  id: string;
  productName: string;
  sku: string;
  manufacturer: string;
  quantity: number;
  imageSrc: string;
};

const roomMap: Record<string, RoomInfo> = {
  "meeting-room": { id: "meeting-room", name: "Meeting Room", itemsCount: 12 },
  "workspace-area": { id: "workspace-area", name: "Workspace Area", itemsCount: 8 },
  reception: { id: "reception", name: "Reception", itemsCount: 6 },
  "private-cabin": { id: "private-cabin", name: "Private Cabin", itemsCount: 2 },
};

const itemsByRoomId: Record<string, RoomItem[]> = {
  "meeting-room": [
    {
      id: "meeting-1",
      productName: "Gesture Chair",
      sku: "St-1",
      manufacturer: "Steelcase",
      quantity: 12,
      imageSrc: "/Rectangle 11.png",
    },
  ],
  "workspace-area": [
    {
      id: "workspace-1",
      productName: "Gesture Chair",
      sku: "St-1",
      manufacturer: "Steelcase",
      quantity: 12,
      imageSrc: "/Rectangle 11.png",
    },
  ],
  reception: [
    {
      id: "reception-1",
      productName: "Gesture Chair",
      sku: "St-1",
      manufacturer: "Steelcase",
      quantity: 12,
      imageSrc: "/Rectangle 11.png",
    },
  ],
  "private-cabin": [
    {
      id: "private-1",
      productName: "Gesture Chair",
      sku: "St-1",
      manufacturer: "Steelcase",
      quantity: 12,
      imageSrc: "/Rectangle 11.png",
    },
  ],
};

export default async function RoomDetailPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;
  const room = roomMap[roomId];

  if (!room) {
    notFound();
  }

  const items = itemsByRoomId[room.id] ?? [];
  const totalUnits = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <main className="mt-6 w-full">
      <section>
        <div className="flex flex-col gap-2">
          <Link
            href="/dashboard/add-to-project"
            className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-900 px-3 py-1.5 text-xs font-semibold text-white ring-1 ring-emerald-900/10 transition-colors hover:bg-emerald-800"
          >
            <span aria-hidden="true">←</span>
            Back to Project
          </Link>

          <p className="text-xs font-semibold text-emerald-100/80">
            Project Board / Project Name / {room.name}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{room.name}</h1>
          <p className="text-sm font-semibold text-emerald-100/75">
            {room.itemsCount} items in this room
          </p>
        </div>
      </section>

      <section className="mt-6 rounded-[22px] bg-white p-4 text-gray-900 shadow-[0_18px_50px_rgba(0,0,0,0.18)] ring-1 ring-black/5 sm:p-5">
        <h2 className="text-base font-semibold text-emerald-950">Room Items</h2>

        <div className="mt-4 overflow-hidden rounded-[16px] ring-1 ring-gray-200/80">
          <div className="grid grid-cols-[1.5fr_.9fr_.7fr] gap-4 bg-[#f4f7f6] px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            <div>Product</div>
            <div>Manufacturer</div>
            <div className="text-right">Quantity</div>
          </div>

          <div className="divide-y divide-gray-100 bg-white">
            {items.map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-[1.5fr_.9fr_.7fr] items-center gap-4 px-4 py-3.5"
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
                    <div className="mt-0.5 text-xs font-semibold text-gray-500">SKU: {item.sku}</div>
                  </div>
                </div>

                <div className="text-sm font-semibold text-gray-600">{item.manufacturer}</div>
                <div className="text-right text-sm font-semibold text-gray-700">{item.quantity}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs font-semibold text-gray-500">
          <div>Showing {items.length} of {items.length} items</div>
          <div>Total Units: {totalUnits}</div>
        </div>
      </section>
    </main>
  );
}

