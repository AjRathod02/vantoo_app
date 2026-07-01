import { Suspense } from "react";
import { EcommerceStore } from "@/components/EcommerceStore";

export default function EcommercePage() {
  return (
    <Suspense>
      <EcommerceStore />
    </Suspense>
  );
}
