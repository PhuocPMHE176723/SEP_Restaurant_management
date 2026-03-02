"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { LoginResponse } from "../types/generated";
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
    const [user, setUser] = useState<UserInfo | null>(null);

    // Đọc cookie khi app khởi động
    useEffect(() => {
        if (isTokenValid()) {
            setUser(getUserInfo());
        }
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
