import type { LoginResponse } from "../types/generated";

// ──────────────────────────────────────────────────────────────
//  COOKIE KEYS
// ──────────────────────────────────────────────────────────────
const TOKEN_KEY = "rmn_access_token";
const USER_INFO_KEY = "rmn_user_info";

// ──────────────────────────────────────────────────────────────
//  SAVE – ghi token + user info vào httpOnly-like cookie
//  (Next.js client-side dùng document.cookie; httpOnly thật
//   cần set từ Server Action / Route Handler – đủ cho SPA này)
// ──────────────────────────────────────────────────────────────
export function saveAuth(data: LoginResponse): void {
    // Tính maxAge từ expiresAt (giờ VN ISO) – chuyển về giây còn lại
    const expiresAt = new Date(data.expiresAt);
    const nowVn = getCurrentVnTime();
    const maxAgeSec = Math.max(0, Math.floor((expiresAt.getTime() - nowVn.getTime()) / 1000));

    const cookieOpts = `path=/; max-age=${maxAgeSec}; SameSite=Strict`;

    document.cookie = `${TOKEN_KEY}=${encodeURIComponent(data.accessToken)}; ${cookieOpts}`;

    // Lưu thông tin user dưới dạng JSON (không sensitive)
    const userInfo = JSON.stringify({
        email: data.email,
        fullName: data.fullName,
        phoneNumber: data.phoneNumber ?? null,
        roles: data.roles,
        expiresAt: data.expiresAt,
    });
    document.cookie = `${USER_INFO_KEY}=${encodeURIComponent(userInfo)}; ${cookieOpts}`;
}

// ──────────────────────────────────────────────────────────────
//  READ
// ──────────────────────────────────────────────────────────────
export function getToken(): string | null {
    return getCookieValue(TOKEN_KEY);
}

export interface UserInfo {
    email: string;
    fullName: string;
    phoneNumber: string | null;
    roles: string[];
    expiresAt: string;
}

export function getUserInfo(): UserInfo | null {
    const raw = getCookieValue(USER_INFO_KEY);
    if (!raw) return null;
    try {
        return JSON.parse(raw) as UserInfo;
    } catch {
        return null;
    }
}

// ──────────────────────────────────────────────────────────────
//  CHECK EXPIRY – so sánh giờ VN hiện tại với expiresAt trong cookie
// ──────────────────────────────────────────────────────────────
export function isTokenValid(): boolean {
    const info = getUserInfo();
    if (!info?.expiresAt) return false;

    const expiresAt = new Date(info.expiresAt);   // đã là giờ VN dạng ISO
    const nowVn = getCurrentVnTime();

    return nowVn < expiresAt;
}

// ──────────────────────────────────────────────────────────────
//  LOGOUT – xóa cả hai cookie
// ──────────────────────────────────────────────────────────────
export function clearAuth(): void {
    document.cookie = `${TOKEN_KEY}=; path=/; max-age=0`;
    document.cookie = `${USER_INFO_KEY}=; path=/; max-age=0`;
}

// ──────────────────────────────────────────────────────────────
//  HELPERS
// ──────────────────────────────────────────────────────────────

/** Trả về giờ Việt Nam hiện tại dưới dạng Date object */
export function getCurrentVnTime(): Date {
    // Lấy offset UTC+7 = +420 phút
    const utcNow = new Date();
    const vnOffsetMs = 7 * 60 * 60 * 1000;
    return new Date(utcNow.getTime() + vnOffsetMs);
}

/** Đọc giá trị cookie theo key */
function getCookieValue(key: string): string | null {
    if (typeof document === "undefined") return null;          // SSR guard
    const match = document.cookie
        .split("; ")
        .find((row) => row.startsWith(`${key}=`));
    if (!match) return null;
    return decodeURIComponent(match.split("=").slice(1).join("="));
}
