import { NextRequest, NextResponse } from "next/server";

/**
 * Các route cần đăng nhập mới được truy cập.
 * Thêm path vào đây khi cần bảo vệ thêm trang.
 */
const PROTECTED_PATHS = [
    "/dashboard",
    "/profile",
    "/orders",
    "/admin",
];

/** Các route chỉ dành cho guest (chưa đăng nhập) */
const AUTH_PATHS = ["/login", "/register"];

export function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // Đọc cookie user info
    const userInfoCookie = req.cookies.get("rmn_user_info")?.value;

    let isTokenValid = false;

    if (userInfoCookie) {
        try {
            const info = JSON.parse(decodeURIComponent(userInfoCookie)) as { expiresAt?: string };
            if (info.expiresAt) {
                // So sánh với giờ VN hiện tại (UTC+7)
                const expiresAt = new Date(info.expiresAt);
                const utcNow = new Date();
                const vnOffsetMs = 7 * 60 * 60 * 1000;
                const nowVn = new Date(utcNow.getTime() + vnOffsetMs);

                isTokenValid = nowVn < expiresAt;
            }
        } catch {
            isTokenValid = false;
        }
    }

    // Truy cập route bảo vệ mà không có token hợp lệ → redirect login
    const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
    if (isProtected && !isTokenValid) {
        const loginUrl = req.nextUrl.clone();
        loginUrl.pathname = "/login";
        loginUrl.searchParams.set("redirect", pathname);
        return NextResponse.redirect(loginUrl);
    }

    // Đã đăng nhập mà vào /login /register → redirect home
    const isAuthPage = AUTH_PATHS.some((p) => pathname.startsWith(p));
    if (isAuthPage && isTokenValid) {
        const homeUrl = req.nextUrl.clone();
        homeUrl.pathname = "/";
        return NextResponse.redirect(homeUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match tất cả path trừ:
         * - _next/static (assets)
         * - _next/image (image optimization)
         * - favicon.ico
         * - public folder files
         */
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
