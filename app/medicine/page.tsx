import { Suspense } from "react";
import { ServiceListing } from "@/components/ServiceListing";

export default function MedicinePage() {
  return (
    <Suspense>
      <ServiceListing
        service="medicine"
        title="Medicine"
        subtitle="Verified pharmacies and wellness products near you"
      />
    </Suspense>
  );
}
