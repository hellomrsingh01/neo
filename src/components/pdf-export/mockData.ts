export type PdfPreviewItem = {
  id: string;
  name: string;
  manufacturer: string;
  description: string;
  location: string;
  imageSrc?: string;
  quantity: number;
};

export const MOCK_PREVIEW_ITEMS: PdfPreviewItem[] = [
  {
    id: "gesture-chair",
    name: "Gesture Chair",
    manufacturer: "Steelcase",
    description: "Premium ergonomic chair with advanced",
    location: "Office 1",
    imageSrc: "/Rectangle 11.png",
    quantity: 12,
  },
  {
    id: "migration-se-desk",
    name: "Migration SE Desk",
    manufacturer: "Steelcase",
    description: "Height adjustable workstation",
    location: "Office 2",
    imageSrc: "/Rectangle 12.png",
    quantity: 12,
  },
  {
    id: "orangebox-booth",
    name: "Orangebox Booth",
    manufacturer: "Orangebox",
    description: "Acoustic privacy meeting space",
    location: "Reception",
    imageSrc: "/Rectangle 13.png",
    quantity: 12,
  },
  {
    id: "flex-mobile-power",
    name: "Flex Mobile Power",
    manufacturer: "Steelcase",
    description: "Wireless charging solution",
    location: "Reception",
    imageSrc: "/Rectangle 14.png",
    quantity: 12,
  },
];

