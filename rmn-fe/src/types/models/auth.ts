export interface LoginRequestDTO {
    email: string;
    password: string;
}

export interface RegisterRequestDTO {
    email: string;
    password: string;
    fullName: string;
    phone: string;
    role?: string;
}

export interface LoginResponseDTO {
    accessToken: string;
    tokenType: string;
    expiresAt: string;
    email: string;
    fullName: string;
    phoneNumber: string | null;
    roles: string[];
}

//forgot password request body
export interface ForgotPasswordRequestDTO {
    email: string;
}

export interface ResetPasswordRequestDTO {
    email: string;
    token: string;
    newPassword: string;
    confirmPassword: string;
}