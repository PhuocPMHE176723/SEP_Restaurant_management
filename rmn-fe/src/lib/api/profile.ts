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

async function parseResponse<T>(response: Response): Promise<T> {
  const rawText = await response.text();

  let json: any = null;

  if (rawText) {
    try {
      json = JSON.parse(rawText);
    } catch {
      if (!response.ok) {
        throw new Error(rawText || "Request failed");
      }

      return rawText as T;
    }
  }

  if (!response.ok) {
    throw new Error(
      json?.message ||
      json?.Message ||
      rawText ||
      "Request failed"
    );
  }

  if (!json) {
    return undefined as T;
  }

  return (json.data ?? json.Data ?? json.message ?? json.Message ?? json) as T;
}

export const profileApi = {
  async getMyStaffProfile(): Promise<StaffProfileDTO> {
    const response = await fetch(`${apiBaseUrl}/api/User/staff/me`, {
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
    const response = await fetch(`${apiBaseUrl}/api/User/customers/me`, {
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
  ): Promise<string> {
    const response = await fetch(`${apiBaseUrl}/api/User/customers/${id}`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });

    return parseResponse<string>(response);
  },

  async forgotPassword(email: string): Promise<string> {
    const response = await fetch(`${apiBaseUrl}/api/Password/forgot-password`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ email }),
    });

    return parseResponse<string>(response);
  },

  async changePassword(payload: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<string> {
  const response = await fetch(`${apiBaseUrl}/api/Password/change-password`, {
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