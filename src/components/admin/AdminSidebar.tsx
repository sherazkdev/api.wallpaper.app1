"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Video,
  CloudUpload,
  FolderArchive,
  Settings,
  LogOut,
  BookOpen,
  Mountain,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatFileSize } from "@/lib/utils";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/wallpapers", label: "Live Wallpapers", icon: Video },
  { href: "/admin/wallpapers/add", label: "Upload Wallpaper", icon: CloudUpload },
  { href: "/admin/wallpapers/zip-upload", label: "ZIP Upload", icon: FolderArchive },
  { href: "/admin/api-settings", label: "API Settings", icon: Settings },
  { href: "/admin/documentation", label: "Documentation", icon: BookOpen },
];

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  storageUsed?: number;
}

export default function AdminSidebar({ isOpen, onClose, storageUsed = 0 }: AdminSidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/admin/wallpapers") {
      return pathname === href || (pathname.startsWith("/admin/wallpapers/") && !pathname.includes("/add") && !pathname.includes("/upload") && !pathname.includes("/zip-upload") && !pathname.includes("/edit"));
    }
    return pathname === href || pathname.startsWith(href + "/");
  };

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin/login";
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-5 border-b border-slate-200">
          <Link href="/admin/dashboard" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
              <Mountain className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-slate-900 text-lg">Wallpaper API</span>
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive(href)
                  ? "bg-blue-50 text-blue-600"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-200">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors w-full"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>

        <div className="p-4 m-3 bg-slate-50 rounded-xl border border-slate-200">
          <p className="text-xs font-medium text-slate-500 mb-2">Storage Used</p>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-slate-900">{formatFileSize(storageUsed)}</span>
            <span className="text-xs text-slate-400">/ Unlimited</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-1.5">
            <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: "15%" }} />
          </div>
        </div>
      </aside>
    </>
  );
}
