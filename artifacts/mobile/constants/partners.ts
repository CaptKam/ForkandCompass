export type GroceryPartner = "instacart" | "kroger" | "walmart" | "skip" | null;

export interface PartnerConfig {
  id: "instacart" | "kroger" | "walmart";
  label: string;
  sub: string;
  color: string;
  light: string;
  initial: string;
}

export const PARTNER_CONFIG: Record<"instacart" | "kroger" | "walmart", PartnerConfig> = {
  instacart: {
    id: "instacart",
    label: "Instacart",
    sub: "Delivery from local stores",
    color: "#003D29",
    light: "#E3EFEA",
    initial: "I",
  },
  kroger: {
    id: "kroger",
    label: "Kroger",
    sub: "Pickup or delivery",
    color: "#0468BF",
    light: "#E5F0FB",
    initial: "K",
  },
  walmart: {
    id: "walmart",
    label: "Walmart",
    sub: "Pickup or delivery",
    color: "#0071DC",
    light: "#E5F1FF",
    initial: "W",
  },
};

export const PARTNER_LIST: PartnerConfig[] = Object.values(PARTNER_CONFIG);
