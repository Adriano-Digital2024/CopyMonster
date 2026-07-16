import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export type SubscriptionStatus = 'free' | 'starter' | 'pro' | 'legend';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11) return `+55${digits}`;
  if (digits.length === 10) return `+55${digits}`;
  if (digits.startsWith('55') && digits.length === 12) return `+${digits}`;
  if (digits.startsWith('55') && digits.length === 13) return `+${digits}`;
  if (digits.startsWith('1') && digits.length === 11) return `+${digits}`;
  return `+${digits}`;
}
