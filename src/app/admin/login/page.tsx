"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Mail, Eye, EyeOff, Mountain, Shield, Code, CloudUpload } from "lucide-react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import toast from "react-hot-toast";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, remember }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Login successful!");
        router.push("/admin/dashboard");
      } else {
        toast.error(data.message || "Invalid credentials");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-blue-50 to-white p-12 flex-col justify-center">
        <div className="absolute top-0 left-0 w-64 h-64 bg-blue-100 rounded-full blur-3xl opacity-60 -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-blue-50 rounded-full blur-3xl opacity-80 translate-x-1/3 translate-y-1/3" />

        <Link href="/" className="flex items-center gap-2.5 mb-12 relative">
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
            <Mountain className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-slate-900 text-lg">Wallpaper API</span>
        </Link>

        <div className="relative">
          <h1 className="text-4xl font-bold text-slate-900 leading-tight">
            Secure Wallpaper APIs
          </h1>
          <p className="text-2xl font-bold text-blue-600 mt-1">Built for Developers</p>
          <p className="text-slate-600 mt-4 leading-relaxed max-w-md">
            Authentication-based API system with admin-controlled content management, multi-upload and ZIP upload support.
          </p>

          <div className="mt-10 relative">
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 max-w-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Code className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 bg-slate-100 rounded h-2" />
              </div>
              <div className="space-y-2">
                <div className="h-2 bg-slate-100 rounded w-full" />
                <div className="h-2 bg-slate-100 rounded w-3/4" />
                <div className="h-2 bg-blue-100 rounded w-1/2" />
              </div>
            </div>
            <div className="absolute -top-3 -right-3 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center shadow-lg">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-md border border-slate-200 p-3 flex items-center gap-2">
              <CloudUpload className="w-5 h-5 text-blue-600" />
              <span className="text-xs font-medium text-slate-700">Upload Ready</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2.5 mb-8 justify-center">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
              <Mountain className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-slate-900 text-lg">Wallpaper API</span>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
            <div className="flex flex-col items-center mb-8">
              <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                <Lock className="w-7 h-7 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Admin Login</h2>
              <p className="text-sm text-slate-500 mt-1">Login to manage wallpaper API content.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="Email Address"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={<Mail className="w-4 h-4" />}
                required
              />
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-600">Remember me</span>
                </label>
                <button type="button" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  Forgot Password?
                </button>
              </div>

              <Button type="submit" loading={loading} className="w-full gap-2" size="lg">
                <Lock className="w-4 h-4" />
                Login
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-400">Only authorized admins can access this panel.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
