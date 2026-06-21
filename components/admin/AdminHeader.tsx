"use client";

import { Bell, Menu, Search, ChevronDown } from "lucide-react";

interface AdminHeaderProps {
  onMenuClick: () => void;
  title?: string;
}

export default function AdminHeader({ onMenuClick, title }: AdminHeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 lg:px-6 h-16 flex items-center gap-4">
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-600"
      >
        <Menu className="w-5 h-5" />
      </button>

      {title && (
        <h1 className="text-lg font-semibold text-slate-900 lg:hidden">{title}</h1>
      )}

      <div className="flex-1 max-w-xl mx-auto hidden sm:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="search"
            placeholder="Search wallpapers..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 ml-auto">
        <button className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-600">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>
        <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-sm font-semibold text-blue-600">A</span>
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-slate-900">Admin</p>
            <p className="text-xs text-slate-500">Super Admin</p>
          </div>
          <ChevronDown className="w-4 h-4 text-slate-400 hidden md:block" />
        </div>
      </div>
    </header>
  );
}
