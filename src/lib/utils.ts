import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export type SubscriptionStatus = 'free' | 'starter' | 'pro' | 'legend';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
