import { apiBaseUrl } from "../config";
import type { ForgotPasswordRequestDTO, LoginRequestDTO as LoginRequest, LoginResponseDTO as LoginResponse, RegisterRequestDTO as RegisterRequest, ResetPasswordRequestDTO } from "../../types/models";

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

// forgotPassword, resetPassword 
export async function forgotPasswordApi(body: ForgotPasswordRequestDTO): Promise<string> {
    const res = await fetch(`${apiBaseUrl}/api/auth/forgot-password`, {
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

export async function resetPasswordApi(body: ResetPasswordRequestDTO): Promise<string> {
    const res = await fetch(`${apiBaseUrl}/api/auth/reset-password`, {
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

export async function newRegisterApi(body: RegisterRequest): Promise<string> {
    const res = await fetch(`${apiBaseUrl}/api/auth/registers`, {
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

export type VerifyOtpPayload = {
  email: string;
  otp: string;
};

export type ResendOtpPayload = {
  email: string;
};

/**
 * POST /api/auth/verify-otp
 */
type ApiResponse<T> = {
  data?: T;
  message?: string;
  errors?: string[];
};
export async function verifyOtpApi(body: VerifyOtpPayload): Promise<string> {
  const res = await fetch(`${apiBaseUrl}/api/auth/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const json = (await res.json()) as ApiResponse<string>;

  if (!res.ok) {
    throw {
      message: json.message ?? "Xác thực OTP thất bại",
      errors: json.errors,
    } satisfies ApiError;
  }

  return json.message ?? "Xác thực OTP thành công";
}

/**
 * POST /api/auth/resend-otp
 */
export async function resendOtpApi(body: ResendOtpPayload): Promise<string> {
  const res = await fetch(`${apiBaseUrl}/api/auth/resend-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const json = (await res.json()) as ApiResponse<string>;

  if (!res.ok) {
    throw {
      message: json.message ?? "Gửi lại OTP thất bại",
      errors: json.errors,
    } satisfies ApiError;
  }

  return json.message ?? "Gửi lại OTP thành công";
}