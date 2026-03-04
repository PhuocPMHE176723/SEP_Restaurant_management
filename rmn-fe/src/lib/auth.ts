import type { LoginResponse } from "../types/generated";

// ──────────────────────────────────────────────────────────────
//  COOKIE KEYS
// ──────────────────────────────────────────────────────────────
const TOKEN_KEY = "rmn_access_token";
const USER_INFO_KEY = "rmn_user_info";

// ──────────────────────────────────────────────────────────────
//  HELPER: parse expiresAt từ backend (giờ VN, không có timezone)
//  Backend trả về "2026-03-04T17:40:00" → phải thêm +07:00 để parse đúng
// ──────────────────────────────────────────────────────────────
export function parseVnDate(dateStr: string): Date {
    // Nếu đã có timezone suffix thì parse trực tiếp
    if (dateStr.includes("+") || dateStr.endsWith("Z")) return new Date(dateStr);
    // Thêm +07:00 để parse đúng giờ Việt Nam
    return new Date(dateStr + "+07:00");
}

// ──────────────────────────────────────────────────────────────
//  SAVE
// ──────────────────────────────────────────────────────────────
export function saveAuth(data: LoginResponse): void {
    // Tính maxAge: so sánh expiresAt (VN) với UTC now
    const expiresAt = parseVnDate(data.expiresAt);
    const maxAgeSec = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));

    const cookieOpts = `path=/; max-age=${maxAgeSec}; SameSite=Strict`;

    document.cookie = `${TOKEN_KEY}=${encodeURIComponent(data.accessToken)}; ${cookieOpts}`;

    const userInfo = JSON.stringify({
        email: data.email,
        fullName: data.fullName,
        phoneNumber: data.phoneNumber ?? null,
        roles: data.roles,
        expiresAt: data.expiresAt,   // lưu nguyên gốc từ backend
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
    try { return JSON.parse(raw) as UserInfo; }
    catch { return null; }
}

// ──────────────────────────────────────────────────────────────
//  CHECK EXPIRY
//  So sánh UTC now với expiresAt đã thêm timezone +07:00
// ──────────────────────────────────────────────────────────────
export function isTokenValid(): boolean {
    const info = getUserInfo();
    if (!info?.expiresAt) return false;

    const expiresAt = parseVnDate(info.expiresAt);
    return Date.now() < expiresAt.getTime();
}

// ──────────────────────────────────────────────────────────────
//  LOGOUT
// ──────────────────────────────────────────────────────────────
export function clearAuth(): void {
    document.cookie = `${TOKEN_KEY}=; path=/; max-age=0`;
    document.cookie = `${USER_INFO_KEY}=; path=/; max-age=0`;
}

// ──────────────────────────────────────────────────────────────
//  HELPERS
// ──────────────────────────────────────────────────────────────
function getCookieValue(key: string): string | null {
    if (typeof document === "undefined") return null;
    const match = document.cookie
        .split("; ")
        .find((row) => row.startsWith(`${key}=`));
    if (!match) return null;
    return decodeURIComponent(match.split("=").slice(1).join("="));
}
