import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function parseNumberArray(str: string): number[] {
  return str.split(/[\s,]+/).map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
}
