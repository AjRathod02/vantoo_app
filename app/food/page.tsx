import { Suspense } from "react";
import { FoodListing } from "@/components/FoodListing";

export default function FoodPage() {
  return (
    <Suspense>
      <FoodListing />
    </Suspense>
  );
}
