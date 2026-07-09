import { Briefcase, Home, MapPin } from "lucide-react";

export const ADDRESS_LABELS = [
  { id: "Home", label: "Home", icon: Home },
  { id: "Work", label: "Work", icon: Briefcase },
  { id: "Other", label: "Other", icon: MapPin },
] as const;

export type AddressLabelId = (typeof ADDRESS_LABELS)[number]["id"];
