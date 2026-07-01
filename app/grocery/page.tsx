import { Suspense } from "react";
import { ServiceListing } from "@/components/ServiceListing";

export default function GroceryPage() {
  return (
    <Suspense>
      <ServiceListing
        service="grocery"
        title="Grocery"
        subtitle="Fresh produce and daily essentials delivered fast"
      />
    </Suspense>
  );
}
