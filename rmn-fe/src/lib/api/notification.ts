import { apiBaseUrl } from "../config";
import { authHeaders, handleResponse } from "./api-helper";

export interface NotificationItem {
  notificationId: number;
  title: string;
  message: string;
  type: "CHECKIN" | "PAYMENT" | "RESERVATION" | "CLEANUP" | string;
  userId?: string;
  role?: string;
  relatedId?: string;
  isRead: boolean;
  createdAt: string;
}

export async function getNotifications(): Promise<NotificationItem[]> {
  const res = await fetch(`${apiBaseUrl}/api/notification`, {
    method: "GET",
    headers: authHeaders(),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Tải thông báo thất bại (${res.status})`);
  }
  const body = await res.json();
  // Support both wrapped response { success: true, data: [...] } and raw array
  if (body && (body.data !== undefined || body.Data !== undefined)) {
    return (body.data ?? body.Data) as NotificationItem[];
  }
  return (Array.isArray(body) ? body : []) as NotificationItem[];
}

export async function markAsRead(id: number): Promise<boolean> {
  const res = await fetch(`${apiBaseUrl}/api/notification/${id}/read`, {
    method: "PATCH",
    headers: authHeaders(),
  });
  return res.ok;
}

export async function markAllAsRead(): Promise<boolean> {
  const res = await fetch(`${apiBaseUrl}/api/notification/read-all`, {
    method: "POST",
    headers: authHeaders(),
  });
  return res.ok;
}
