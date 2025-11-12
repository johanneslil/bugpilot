import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function getSeverityColor(severity: string | null): string {
  switch (severity) {
    case 'S0':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'S1':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'S2':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'S3':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

export function getAreaColor(area: string | null): string {
  switch (area) {
    case 'FRONTEND':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'BACKEND':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'INFRA':
      return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    case 'DATA':
      return 'bg-pink-100 text-pink-800 border-pink-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

export function getSimilarityBadge(score: number): { label: string; color: string } {
  if (score >= 0.8) {
    return { label: 'Likely duplicate', color: 'bg-red-100 text-red-800 border-red-200' };
  } else if (score >= 0.6) {
    return { label: 'Similar', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
  } else {
    return { label: 'Related', color: 'bg-gray-100 text-gray-800 border-gray-200' };
  }
}
