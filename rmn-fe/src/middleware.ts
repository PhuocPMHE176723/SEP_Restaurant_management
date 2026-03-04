import { NextRequest, NextResponse } from "next/server";

const PROTECTED_PATHS = ["/dashboard", "/profile", "/orders", "/admin"];
const AUTH_PATHS = ["/login", "/register"];

/** Parse datetime không có timezone từ backend (giờ VN) → thêm +07:00 */
function parseVnDate(dateStr: string): Date {
    if (dateStr.includes("+") || dateStr.endsWith("Z")) return new Date(dateStr);
    return new Date(dateStr + "+07:00");
}

export function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    const userInfoCookie = req.cookies.get("rmn_user_info")?.value;
    let isTokenValid = false;

    if (userInfoCookie) {
        try {
            const info = JSON.parse(decodeURIComponent(userInfoCookie)) as { expiresAt?: string };
            if (info.expiresAt) {
                // So sánh UTC now với expiresAt (Vietnam time) bằng cách thêm +07:00
                const expiresAt = parseVnDate(info.expiresAt);
                isTokenValid = Date.now() < expiresAt.getTime();
            }
        } catch {
            isTokenValid = false;
        }
    }

    const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
    if (isProtected && !isTokenValid) {
        const loginUrl = req.nextUrl.clone();
        loginUrl.pathname = "/login";
        loginUrl.searchParams.set("redirect", pathname);
        return NextResponse.redirect(loginUrl);
    }

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
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
