"use client";

import ProductEditorForm from "@/components/admin/ProductEditorForm";
import { useParams } from "next/navigation";

export default function AdminEditProductPage() {
  const params = useParams<{ id: string }>();
  const productId = params?.id;

  if (!productId) {
    return null;
  }

  return <ProductEditorForm productId={productId} />;
}
