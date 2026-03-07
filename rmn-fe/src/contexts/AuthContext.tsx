"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { LoginResponseDTO as LoginResponse } from "../types/models";
import { saveAuth, getUserInfo, clearAuth, isTokenValid, type UserInfo } from "../lib/auth";

// ──────────────────────────────────────────────────────────────
//  Context type
// ──────────────────────────────────────────────────────────────
interface AuthContextValue {
    user: UserInfo | null;
    isLoggedIn: boolean;
    login: (data: LoginResponse) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
    user: null,
    isLoggedIn: false,
    login: () => { },
    logout: () => { },
});

// ──────────────────────────────────────────────────────────────
//  Provider
// ──────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
    // Lazy initializer: đọc cookie ngay khi client load, không chờ useEffect
    const [user, setUser] = useState<UserInfo | null>(() => {
        if (typeof window === "undefined") return null; // SSR guard
        if (isTokenValid()) return getUserInfo();
        return null;
    });

    // Validate lại mỗi khi tab focus (phòng token hết hạn khi đang mở tab khác)
    useEffect(() => {
        function check() {
            if (!isTokenValid()) setUser(null);
        }
        window.addEventListener("focus", check);
        return () => window.removeEventListener("focus", check);
    }, []);

    const login = useCallback((data: LoginResponse) => {
        saveAuth(data);                 // ghi cookie
        setUser({                       // cập nhật state ngay lập tức
            email: data.email,
            fullName: data.fullName,
            phoneNumber: data.phoneNumber ?? null,
            roles: data.roles,
            expiresAt: data.expiresAt,
        });
    }, []);

    const logout = useCallback(() => {
        clearAuth();                    // xóa cookie
        setUser(null);                  // clear state ngay lập tức
    }, []);

    return (
        <AuthContext.Provider value={{ user, isLoggedIn: !!user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

// ──────────────────────────────────────────────────────────────
//  Hook
// ──────────────────────────────────────────────────────────────
export function useAuth() {
    return useContext(AuthContext);
}
