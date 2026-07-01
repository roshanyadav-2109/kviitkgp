import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const bandLabel: Record<string, string> = {
  A1: "A1", A2: "A2", B1: "B1", B2: "B2", C1: "C1", C2: "C2", D: "D", E: "E",
};

// direction of a delta -> semantic status token
export function trendStatus(delta: number | null | undefined): "up" | "watch" | "down" | "flat" {
  if (delta === null || delta === undefined) return "flat";
  if (delta >= 2) return "up";
  if (delta <= -2) return "down";
  if (delta < 0) return "watch";
  return "flat";
}
