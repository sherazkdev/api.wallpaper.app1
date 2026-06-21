import { connectDB } from "@/lib/mongodb";
import { Sound, AppSettings } from "@/lib/models";
import type { AppSettingsLean } from "@/lib/models/AppSettings";
import { requireAdmin, apiSuccess } from "@/lib/api-utils";
import { ensureAppSettings } from "@/lib/api-key";

export async function GET() {
  const authError = await requireAdmin();
  if (authError) return authError;

  await connectDB();
  await ensureAppSettings();

  const [total, published, draft, storageResult, settings] = await Promise.all([
    Sound.countDocuments(),
    Sound.countDocuments({ status: "Published" }),
    Sound.countDocuments({ status: "Draft" }),
    Sound.aggregate<{ totalSize: number }>([
      { $group: { _id: null, totalSize: { $sum: "$fileSize" } } },
    ]),
    AppSettings.findById("default").lean<AppSettingsLean>(),
  ]);

  return apiSuccess({
    totalWallpapers: total,
    publishedWallpapers: published,
    draftWallpapers: draft,
    storageUsed: storageResult[0]?.totalSize || 0,
    apiStatus: "Active",
    totalApiRequests: settings?.totalRequests || 0,
  });
}
