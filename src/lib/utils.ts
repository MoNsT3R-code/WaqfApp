import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = "PKR") {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: currency,
  }).format(amount);
}
