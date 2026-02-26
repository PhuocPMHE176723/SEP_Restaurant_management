import { apiBaseUrl } from "../config";
import type { RmnItem } from "../../types/generated";

const defaultHeaders = {
  "Content-Type": "application/json",
};

export async function getHealth(): Promise<string> {
  const res = await fetch(`${apiBaseUrl}/api/health`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Health check failed (${res.status})`);
  }
  const body = (await res.json()) as { status?: string };
  return body.status ?? "unknown";
}

export async function getRmnItems(): Promise<RmnItem[]> {
  const res = await fetch(`${apiBaseUrl}/api/rmn`, { cache: "no-store", headers: defaultHeaders });
  if (!res.ok) {
    throw new Error(`Failed to load items (${res.status})`);
  }
  return (await res.json()) as RmnItem[];
}
