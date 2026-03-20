export type PdfCatalogueProduct = {
  id: string;
  name: string;
  manufacturer: string;
  description: string;
  locationLabel: string;
  locationValue: string;
  quantity: number;
  imageSrc?: string | null;
};

export type PdfCatalogueSection = {
  id: string;
  title: string;
  products: PdfCatalogueProduct[];
};

export const MOCK_PDF_SECTIONS: PdfCatalogueSection[] = [
  {
    id: "office-1",
    title: "Office 1",
    products: [
      {
        id: "gesture-chair",
        name: "Gesture Chair",
        manufacturer: "Steelcase",
        description: "Premium ergonomic chair with advanced",
        locationLabel: "Location",
        locationValue: "Office 1",
        quantity: 12,
        imageSrc: "/Rectangle 11.png",
      },
      {
        id: "migration-se-desk",
        name: "Migration SE Desk",
        manufacturer: "Steelcase",
        description: "Height adjustable workstation",
        locationLabel: "Location",
        locationValue: "Office 2",
        quantity: 12,
        imageSrc: "/Rectangle 12.png",
      },
    ],
  },
  {
    id: "reception",
    title: "Reception",
    products: [
      {
        id: "orangebox-booth",
        name: "Orangebox Booth",
        manufacturer: "Orangebox",
        description: "Acoustic privacy meeting space",
        locationLabel: "Location",
        locationValue: "Reception",
        quantity: 12,
        imageSrc: "/Rectangle 13.png",
      },
      {
        id: "flex-mobile-power",
        name: "Flex Mobile Power",
        manufacturer: "Steelcase",
        description: "Wireless charging solution",
        locationLabel: "Location",
        locationValue: "Reception",
        quantity: 12,
        imageSrc: "/Rectangle 14.png",
      },
    ],
  },
];

