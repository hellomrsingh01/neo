// Shared Sit Categories Config

export type SitCategorySlug =
  | "office-task-chairs"
  | "stools"
  | "side-conference-chairs"
  | "armchairs-lounge-chairs"
  | "benches-poufs"
  | "sofas"
  | "seating-accessories-add-ons"
  | "outdoor-seating";

export type SitProduct = {
  id: string;
  name: string;
  manufacturer: string;
  description: string;
  rating: number; // 0-5
  reviews: number;
  price: string;
  imageSrc: string;
  isWishlisted?: boolean;
  inProject?: boolean;
};

export type SitCategory = {
  slug: SitCategorySlug;
  label: string;
};

export const SIT_CATEGORIES: SitCategory[] = [
  { slug: "office-task-chairs", label: "Office / Task Chairs" },
  { slug: "stools", label: "Stools" },
  { slug: "side-conference-chairs", label: "Side + Conference Chairs" },
  { slug: "armchairs-lounge-chairs", label: "Armchairs + Lounge Chairs" },
  { slug: "benches-poufs", label: "Benches + Poufs" },
  { slug: "sofas", label: "Sofas" },
  {
    slug: "seating-accessories-add-ons",
    label: "Seating Accessories + Add-Ons",
  },
  { slug: "outdoor-seating", label: "Outdoor Seating" },
];

// Category Product Mapping
export const SIT_PRODUCTS: Record<SitCategorySlug, SitProduct[]> = {
  "office-task-chairs": [
    {
      id: "p-1",
      name: "Gesture Chair",
      manufacturer: "Steelcase",
      description:
        "Lorem ipsum dolor sit amet consectetur. Ut sed ut sit non proin.",
      rating: 4,
      reviews: 45,
      price: "$1,299",
      imageSrc: "/Rectangle 11.png",
      isWishlisted: true,
      inProject: true,
    },
    {
      id: "p-2",
      name: "Leap Chair",
      manufacturer: "Steelcase",
      description:
        "Lorem ipsum dolor sit amet consectetur. Ut sed ut sit non proin.",
      rating: 4,
      reviews: 45,
      price: "$899",
      imageSrc: "/Rectangle 11.png",
    },
    {
      id: "p-3",
      name: "Leap Chair",
      manufacturer: "Steelcase",
      description:
        "Lorem ipsum dolor sit amet consectetur. Ut sed ut sit non proin.",
      rating: 4,
      reviews: 45,
      price: "$899",
      imageSrc: "/Rectangle 11.png",
    },
    {
      id: "p-4",
      name: "Leap Chair",
      manufacturer: "Steelcase",
      description:
        "Lorem ipsum dolor sit amet consectetur. Ut sed ut sit non proin.",
      rating: 4,
      reviews: 45,
      price: "$899",
      imageSrc: "/Rectangle 11.png",
      inProject: true,
    },
    {
      id: "p-5",
      name: "Leap Chair",
      manufacturer: "Steelcase",
      description:
        "Lorem ipsum dolor sit amet consectetur. Ut sed ut sit non proin.",
      rating: 4,
      reviews: 45,
      price: "$899",
      imageSrc: "/Rectangle 11.png",
    },
    {
      id: "p-6",
      name: "Gesture Chair",
      manufacturer: "Steelcase",
      description:
        "Lorem ipsum dolor sit amet consectetur. Ut sed ut sit non proin.",
      rating: 4,
      reviews: 45,
      price: "$1,299",
      imageSrc: "/Rectangle 11.png",
      inProject: true,
    },
    {
      id: "p-7",
      name: "Leap Chair",
      manufacturer: "Steelcase",
      description:
        "Lorem ipsum dolor sit amet consectetur. Ut sed ut sit non proin.",
      rating: 4,
      reviews: 45,
      price: "$899",
      imageSrc: "/Rectangle 11.png",
    },
    {
      id: "p-8",
      name: "Leap Chair",
      manufacturer: "Steelcase",
      description:
        "Lorem ipsum dolor sit amet consectetur. Ut sed ut sit non proin.",
      rating: 4,
      reviews: 45,
      price: "$899",
      imageSrc: "/Rectangle 11.png",
      inProject: true,
    },
  ],
  stools: [
    {
      id: "stools-1",
      name: "Coming soon",
      manufacturer: "—",
      description: "This category will be available soon.",
      rating: 0,
      reviews: 0,
      price: "—",
      imageSrc: "/Rectangle 11.png",
    },
  ],
  "side-conference-chairs": [
    {
      id: "side-1",
      name: "Coming soon",
      manufacturer: "—",
      description: "This category will be available soon.",
      rating: 0,
      reviews: 0,
      price: "—",
      imageSrc: "/Rectangle 11.png",
    },
  ],
  "armchairs-lounge-chairs": [
    {
      id: "arm-1",
      name: "Coming soon",
      manufacturer: "—",
      description: "This category will be available soon.",
      rating: 0,
      reviews: 0,
      price: "—",
      imageSrc: "/Rectangle 11.png",
    },
  ],
  "benches-poufs": [
    {
      id: "bench-1",
      name: "Coming soon",
      manufacturer: "—",
      description: "This category will be available soon.",
      rating: 0,
      reviews: 0,
      price: "—",
      imageSrc: "/Rectangle 11.png",
    },
  ],
  sofas: [
    {
      id: "sofas-1",
      name: "Coming soon",
      manufacturer: "—",
      description: "This category will be available soon.",
      rating: 0,
      reviews: 0,
      price: "—",
      imageSrc: "/Rectangle 11.png",
    },
  ],
  "seating-accessories-add-ons": [
    {
      id: "addons-1",
      name: "Coming soon",
      manufacturer: "—",
      description: "This category will be available soon.",
      rating: 0,
      reviews: 0,
      price: "—",
      imageSrc: "/Rectangle 11.png",
    },
  ],
  "outdoor-seating": [
    {
      id: "outdoor-1",
      name: "Coming soon",
      manufacturer: "—",
      description: "This category will be available soon.",
      rating: 0,
      reviews: 0,
      price: "—",
      imageSrc: "/Rectangle 11.png",
    },
  ],
};

