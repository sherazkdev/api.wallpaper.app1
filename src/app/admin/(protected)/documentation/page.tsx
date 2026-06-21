"use client";

import { useState } from "react";
import { Code, Shield, Zap, Copy } from "lucide-react";
import PageHeader from "@/components/admin/PageHeader";
import Card from "@/components/ui/Card";
import CopyButton from "@/components/ui/CopyButton";
import Badge from "@/components/ui/Badge";

const endpoints = [
  { method: "GET", path: "/api/v1/wallpapers", desc: "Get list of wallpapers" },
  { method: "GET", path: "/api/v1/wallpapers/:id", desc: "Get wallpaper details" },
  { method: "POST", path: "/api/v1/wallpapers", desc: "Create a wallpaper" },
  { method: "PUT", path: "/api/v1/wallpapers/:id", desc: "Update a wallpaper" },
  { method: "DELETE", path: "/api/v1/wallpapers/:id", desc: "Delete a wallpaper" },
  { method: "POST", path: "/api/v1/wallpapers/bulk-delete", desc: "Bulk delete wallpapers" },
  { method: "POST", path: "/api/v1/wallpapers/multi-upload", desc: "Multi video upload" },
  { method: "POST", path: "/api/v1/wallpapers/zip-upload", desc: "ZIP upload" },
  { method: "POST", path: "/api/admin/wallpapers/reorder", desc: "Reorder wallpapers (admin)" },
];

const methodColors: Record<string, string> = {
  GET: "bg-green-100 text-green-700",
  POST: "bg-blue-100 text-blue-700",
  PUT: "bg-orange-100 text-orange-700",
  DELETE: "bg-red-100 text-red-700",
};

const codeTabs = ["cURL", "JavaScript", "Python"];

export default function DocumentationPage() {
  const [activeCodeTab, setActiveCodeTab] = useState("cURL");
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";

  const curlExample = `curl -X GET "${baseUrl}/api/v1/wallpapers" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Accept: application/json" \\
  -G --data-urlencode "page=1" \\
  --data-urlencode "per_page=10"`;

  const jsExample = `const response = await fetch("${baseUrl}/api/v1/wallpapers?page=1&per_page=10", {
  headers: {
    "x-api-key": "YOUR_API_KEY",
    "Accept": "application/json"
  }
});
const data = await response.json();`;

  const pythonExample = `import requests

response = requests.get(
    "${baseUrl}/api/v1/wallpapers",
    headers={"x-api-key": "YOUR_API_KEY"},
    params={"page": 1, "per_page": 10}
)
data = response.json()`;

  const codeExamples: Record<string, string> = { cURL: curlExample, JavaScript: jsExample, Python: pythonExample };

  const jsonResponse = `{
  "success": true,
  "data": {
    "wallpapers": [
      {
        "id": "clx123abc",
        "name": "Ocean Waves Live Wallpaper",
        "url": "${baseUrl}/uploads/ocean-waves.mp4",
        "fileName": "ocean-waves.mp4",
        "fileSize": 15728640,
        "format": "MP4",
        "mimeType": "video/mp4",
        "width": 1920,
        "height": 1080,
        "duration": 15.5,
        "thumbnailUrl": "${baseUrl}/uploads/thumbnails/ocean-waves.jpg",
        "order": 1,
        "status": "Published",
        "tags": ["ocean", "waves", "live"],
        "createdAt": "2026-06-18T10:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "perPage": 10,
      "total": 1,
      "totalPages": 1
    }
  }
}`;

  return (
    <div>
      <PageHeader
        title="API Documentation"
        subtitle="Complete reference for integrating with the Wallpaper API."
        breadcrumbs={["Dashboard", "Documentation"]}
      />

      {/* Feature Cards */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        {[
          { icon: Code, title: "Simple & Easy", desc: "Get started in minutes with our RESTful API" },
          { icon: Shield, title: "Secure & Reliable", desc: "API requests are secure with 99.9% uptime" },
          { icon: Zap, title: "High Performance", desc: "Fast response times with optimized delivery" },
        ].map(({ icon: Icon, title, desc }) => (
          <Card key={title} className="flex items-start gap-4">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <Icon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">{title}</h3>
              <p className="text-sm text-slate-500 mt-1">{desc}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          <Card>
            <h3 className="font-semibold text-slate-900 mb-3">Base URL</h3>
            <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-4 py-3 border border-slate-200">
              <code className="text-sm font-mono text-slate-800 flex-1">{baseUrl}/api/v1</code>
              <CopyButton text={`${baseUrl}/api/v1`} />
            </div>
          </Card>

          <Card>
            <h3 className="font-semibold text-slate-900 mb-3">Authentication</h3>
            <p className="text-sm text-slate-600 mb-3">
              Include your API key in every request header. Requests without a valid key receive a 401 response.
            </p>
            <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-4 py-3 border border-slate-200">
              <code className="text-sm font-mono text-slate-800 flex-1">x-api-key: YOUR_API_KEY</code>
              <CopyButton text="x-api-key: YOUR_API_KEY" />
            </div>
          </Card>

          <Card>
            <h3 className="font-semibold text-slate-900 mb-4">Rate Limits</h3>
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left text-xs font-medium text-slate-500 py-2">Tier</th>
                  <th className="text-left text-xs font-medium text-slate-500 py-2">Limit</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { tier: "Free", limit: "1,000 / hour" },
                  { tier: "Starter", limit: "10,000 / hour" },
                  { tier: "Pro", limit: "50,000 / hour" },
                  { tier: "Enterprise", limit: "Custom" },
                ].map(({ tier, limit }) => (
                  <tr key={tier} className="border-b border-slate-50">
                    <td className="py-2.5 text-sm font-medium text-slate-900">{tier}</td>
                    <td className="py-2.5 text-sm text-slate-600">{limit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <Card>
            <h3 className="font-semibold text-slate-900 mb-4">Available Endpoints</h3>
            <div className="space-y-2">
              {endpoints.map(({ method, path, desc }) => (
                <div key={`${method}-${path}`} className="flex items-center gap-2 py-1.5">
                  <span className={`px-1.5 py-0.5 rounded text-xs font-bold font-mono ${methodColors[method]}`}>{method}</span>
                  <code className="text-xs font-mono text-slate-700">{path}</code>
                  <span className="text-xs text-slate-400 ml-auto hidden sm:block">{desc}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column - Code Examples */}
        <div className="space-y-6">
          <Card padding={false} className="overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-900">
              <span className="text-sm font-medium text-slate-300">Example Request</span>
              <div className="flex gap-1">
                {codeTabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveCodeTab(tab)}
                    className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                      activeCodeTab === tab ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
            <div className="relative">
              <pre className="p-4 text-xs font-mono text-slate-300 bg-slate-900 overflow-x-auto leading-relaxed min-h-[200px]">
                {codeExamples[activeCodeTab]}
              </pre>
              <div className="absolute top-3 right-3">
                <CopyButton text={codeExamples[activeCodeTab]} className="text-slate-400 hover:text-white hover:bg-slate-700" />
              </div>
            </div>
          </Card>

          <Card padding={false} className="overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <span className="text-sm font-medium text-slate-700">Example Response</span>
              <div className="flex items-center gap-2">
                <Badge variant="info">JSON</Badge>
                <CopyButton text={jsonResponse} />
              </div>
            </div>
            <pre className="p-4 text-xs font-mono text-slate-700 bg-slate-50 overflow-x-auto leading-relaxed max-h-[400px]">
              {jsonResponse}
            </pre>
          </Card>
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-600 rounded-xl text-white flex items-center gap-3">
        <Shield className="w-5 h-5 flex-shrink-0" />
        <p className="text-sm">
          View the full API reference or contact{" "}
          <a href="mailto:support@wallpaperapi.com" className="underline font-medium">support@wallpaperapi.com</a>
          {" "}for integration help.
        </p>
      </div>
    </div>
  );
}
