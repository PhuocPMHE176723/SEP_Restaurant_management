import { apiBaseUrl } from "../config";
import { getToken } from "../auth";
import type { StaffProfileDTO, CustomerProfileDTO } from "../../types/models/profile";

function authHeaders(): Record<string, string> {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

const errorTranslations: Record<string, string> = {
  "The Email field is not a valid e-mail address.": "Email không đúng định dạng.",
  "The FullName field is required.": "Họ và tên không được để trống.",
  "The Username field is required.": "Tên đăng nhập không được để trống.",
  "The Email field is required.": "Email không được để trống.",
  "Phone already exists.": "Số điện thoại đã tồn tại.",
  "Email already exists.": "Email đã tồn tại.",
  "Username already exists.": "Tên đăng nhập đã tồn tại.",
  "One or more validation errors occurred.": "Có lỗi nhập liệu xảy ra.",
  "Passwords must have at least one non alphanumeric character.": "Mật khẩu phải có ít nhất một ký tự đặc biệt.",
  "Passwords must have at least one digit ('0'-'9').": "Mật khẩu phải có ít nhất một chữ số.",
  "Passwords must have at least one uppercase ('A'-'Z').": "Mật khẩu phải có ít nhất một chữ hoa.",
  "Passwords must have at least one lowercase ('a'-'z').": "Mật khẩu phải có ít nhất một chữ thường.",
  "Passwords must be at least 6 characters.": "Mật khẩu phải có ít nhất 6 ký tự.",
  "Incorrect password.": "Mật khẩu hiện tại không chính xác.",
};

function translateError(msg: string): string {
  if (!msg) return msg;
  
  let translated = msg;
  Object.entries(errorTranslations).forEach(([en, vi]) => {
    translated = translated.replace(en, vi);
  });
  
  return translated;
}

async function parseResponse<T>(response: Response): Promise<T> {
  const rawText = await response.text();
  let json: any = null;

  if (rawText) {
    try {
      json = JSON.parse(rawText);
    } catch {
      if (!response.ok) {
        throw new Error(rawText || "Yêu cầu thất bại");
      }
      return rawText as T;
    }
  }

  if (!response.ok) {
    if (json?.errors) {
      const errorMessages = Object.values(json.errors).flat().join(", ");
      if (errorMessages) {
        throw new Error(translateError(errorMessages));
      }
    }

    throw new Error(
      translateError(
        json?.message ||
        json?.Message ||
        json?.title ||
        rawText ||
        "Yêu cầu thất bại"
      )
    );
  }

  if (!json) {
    return undefined as T;
  }

  return (json.data ?? json.Data ?? json.message ?? json.Message ?? json) as T;
}

export const profileApi = {
  async getMyStaffProfile(): Promise<StaffProfileDTO> {
    const response = await fetch(`${apiBaseUrl}/api/Profile/staff/me`, {
      method: "GET",
      headers: authHeaders(),
    });

    const json = await response.json();

    if (!response.ok || (!json.success && !json.Success)) {
      throw new Error(json.message || "Không lấy được hồ sơ nhân viên");
    }

    return json.data || json.Data;
  },

  async getMyCustomerProfile(): Promise<CustomerProfileDTO> {
    const response = await fetch(`${apiBaseUrl}/api/Profile/customers/me`, {
      method: "GET",
      headers: authHeaders(),
    });

    const json = await response.json();

    if (!response.ok || (!json.success && !json.Success)) {
      throw new Error(json.message || "Không lấy được hồ sơ khách hàng");
    }

    return json.data || json.Data;
  },

  async updateStaffProfile(
    id: number,
    payload: {
      fullName: string;
      phone: string;
      email: string;
      username?: string;
    }
  ): Promise<string> {
    const response = await fetch(`${apiBaseUrl}/api/User/staff/${id}`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });

    return parseResponse<string>(response);
  },

  async updateCustomerProfile(
    id: number,
    payload: {
      fullName: string;
      phone: string;
      email: string;
      username?: string;
    }
  ): Promise<{ message: string; phoneRequiresVerification: boolean }> {
    const response = await fetch(`${apiBaseUrl}/api/User/customers/${id}`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    let json: any = null;

    if (text) {
      try {
        json = JSON.parse(text);
      } catch {
        if (!response.ok) throw new Error(text || "Cập nhật hồ sơ thất bại");
        return { message: text, phoneRequiresVerification: false };
      }
    }

    if (!response.ok || (json && !json.success && !json.Success)) {
      throw new Error(json?.message || json?.Message || "Cập nhật hồ sơ thất bại");
    }

    const data = json?.data ?? json?.Data ?? {};
    return {
      message: json?.message ?? json?.Message ?? "Cập nhật hồ sơ thành công",
      phoneRequiresVerification: Boolean(
        data?.phoneRequiresVerification ?? data?.PhoneRequiresVerification,
      ),
    };
  },

//   async forgotPassword(email: string): Promise<string> {
//     const response = await fetch(`${apiBaseUrl}/api/Password/forgot-password`, {
//       method: "POST",
//       headers: authHeaders(),
//       body: JSON.stringify({ email }),
//     });

//     return parseResponse<string>(response);
//   },

  async changePassword(payload: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<string> {
  const response = await fetch(`${apiBaseUrl}/api/Profile/change-password`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  const text = await response.text();

  let json: any = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      if (!response.ok) throw new Error(text || "Đổi mật khẩu thất bại");
      return text;
    }
  }

  if (!response.ok || (json && !json.success && !json.Success)) {
    throw new Error(json?.message || "Đổi mật khẩu thất bại");
  }

  return json?.message || "Đổi mật khẩu thành công";
}
};