import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// ฟังก์ชันสำหรับรวม Tailwind Class (แก้ปัญหา Class ชนกัน)
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}