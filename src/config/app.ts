import {
  LayoutDashboard,
  Video,
  CloudUpload,
  FolderArchive,
  Settings,
  BookOpen,
  type LucideIcon,
} from "lucide-react";

export interface AppTheme {
  activeNav: string;
  brandIcon: string;
  brandGradient: string;
  heroGradient: string;
  uploadZoneDrag: string;
  uploadZoneBorder: string;
  uploadZoneHover: string;
  uploadIconBg: string;
  uploadIcon: string;
  tipBg: string;
  tipText: string;
  link: string;
  linkHover: string;
  focusRing: string;
  checkbox: string;
  storageBar: string;
  accent: string;
  accentHover: string;
  accentLight: string;
}

export const APP = {
  name: "Wallpaper API",
  tagline: "Premium live wallpaper content API for modern applications",
  singular: "Wallpaper",
  plural: "Wallpapers",
  description:
    "Manage and deliver high-quality live video wallpapers through a secure REST API.",
  adminBasePath: "/admin/wallpapers",
  apiBasePath: "/api/v1/wallpapers",
  uploadSubdir: "wallpapers",
  supportEmail: "support@wallpaperapi.com",
  fileNamePattern: /\.(mp4|webm)$/i,
} as const;

export const THEME: AppTheme = {
  activeNav: "bg-violet-50 text-violet-700",
  brandIcon: "bg-gradient-to-br from-violet-600 to-indigo-600",
  brandGradient: "bg-gradient-to-br from-violet-600 to-indigo-600",
  heroGradient: "bg-gradient-to-br from-violet-50 via-white to-indigo-50/40",
  uploadZoneDrag: "border-violet-400 bg-violet-50/80",
  uploadZoneBorder: "border-violet-200/80",
  uploadZoneHover: "hover:border-violet-300 hover:bg-violet-50/30",
  uploadIconBg: "bg-violet-100",
  uploadIcon: "text-violet-600",
  tipBg: "bg-violet-50",
  tipText: "text-violet-800",
  link: "text-violet-600",
  linkHover: "hover:text-violet-800",
  focusRing: "focus:ring-violet-500/40 focus:border-violet-400",
  checkbox: "text-violet-600 accent-violet-600",
  storageBar: "bg-gradient-to-r from-violet-500 to-indigo-500",
  accent: "bg-violet-600",
  accentHover: "hover:bg-violet-700",
  accentLight: "bg-violet-50",
};

export const SIDEBAR_NAV: Array<{
  href: string;
  label: string;
  icon: LucideIcon;
}> = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/wallpapers", label: "Live Wallpapers", icon: Video },
  { href: "/admin/wallpapers/add", label: "Upload Wallpaper", icon: CloudUpload },
  { href: "/admin/wallpapers/zip-upload", label: "ZIP Upload", icon: FolderArchive },
  { href: "/admin/api-settings", label: "API Settings", icon: Settings },
  { href: "/admin/documentation", label: "Documentation", icon: BookOpen },
];

export const PUBLIC_NAV = [
  { href: "/#features", label: "Features" },
  { href: "/#endpoints", label: "Endpoints" },
  { href: "/docs", label: "Documentation" },
  { href: "/explorer", label: "API Explorer" },
  { href: "/contact", label: "Contact" },
] as const;

export const API_ENDPOINTS = [
  { method: "GET", path: "/api/v1/wallpapers", description: "List wallpapers (ordered, paginated)" },
  { method: "GET", path: "/api/v1/wallpapers/:id", description: "Get wallpaper by ID" },
  { method: "POST", path: "/api/v1/wallpapers", description: "Create a wallpaper" },
  { method: "PUT", path: "/api/v1/wallpapers/:id", description: "Update a wallpaper" },
  { method: "DELETE", path: "/api/v1/wallpapers/:id", description: "Delete a wallpaper" },
  { method: "POST", path: "/api/v1/wallpapers/multi-upload", description: "Batch upload videos" },
  { method: "POST", path: "/api/v1/wallpapers/zip-upload", description: "ZIP bulk import with categories" },
  { method: "POST", path: "/api/v1/wallpapers/bulk-delete", description: "Bulk delete wallpapers" },
  { method: "POST", path: "/api/admin/wallpapers/reorder", description: "Reorder wallpapers (admin)" },
] as const;

export const METHOD_COLORS: Record<string, string> = {
  GET: "bg-emerald-100 text-emerald-700",
  POST: "bg-violet-100 text-violet-700",
  PUT: "bg-amber-100 text-amber-700",
  DELETE: "bg-red-100 text-red-700",
};
