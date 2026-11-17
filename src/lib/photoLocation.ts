import { gps } from "exifr";

const MAX_KM = 2; // photos taken further than this from the job pin get a warning

/** Distance in km between the photo's GPS tag and the job pin, or null when either is unknown. */
export async function photoDistanceKm(file: File, lat?: number | null, lng?: number | null): Promise<number | null> {
  if (lat == null || lng == null) return null;
  try {
    const p = await gps(file);
    if (!p?.latitude || !p?.longitude) return null; // shortcut: phones often strip GPS on upload, then no check runs
    const r = (d: number) => (d * Math.PI) / 180;
    const a = Math.sin(r(p.latitude - lat) / 2) ** 2 + Math.cos(r(lat)) * Math.cos(r(p.latitude)) * Math.sin(r(p.longitude - lng) / 2) ** 2;
    return 6371 * 2 * Math.asin(Math.sqrt(a));
  } catch {
    return null;
  }
}

export const isFar = (km: number | null) => km != null && km > MAX_KM;
