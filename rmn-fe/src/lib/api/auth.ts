import { apiBaseUrl } from "../config";
import type { LoginRequestDTO as LoginRequest, LoginResponseDTO as LoginResponse, RegisterRequestDTO as RegisterRequest } from "../../types/models";

export interface ApiError {
    message: string;
    errors?: string[];
}

/**
 * Gọi POST /api/auth/login
 * Trả về LoginResponse nếu thành công, ném ApiError nếu thất bại
 */
export async function loginApi(body: LoginRequest): Promise<LoginResponse> {
    const res = await fetch(`${apiBaseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });

    const json = (await res.json()) as {
        data?: LoginResponse;
        message?: string;
        errors?: string[];
    };

    if (!res.ok) {
        throw {
            message: json.message ?? "Đăng nhập thất bại",
            errors: json.errors,
        } satisfies ApiError;
    }

    if (!json.data) throw { message: "Phản hồi server không hợp lệ" } satisfies ApiError;
    return json.data;
}

/**
 * Gọi POST /api/auth/register
 * Trả về message nếu thành công, ném ApiError nếu thất bại
 */
export async function registerApi(body: RegisterRequest): Promise<string> {
    const res = await fetch(`${apiBaseUrl}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });

    const json = (await res.json()) as {
        data?: string;
        message?: string;
        errors?: string[];
    };

    if (!res.ok) {
        throw {
            message: json.message ?? "Đăng ký thất bại",
            errors: json.errors,
        } satisfies ApiError;
    }

    return json.message ?? "Đăng ký thành công";
}
