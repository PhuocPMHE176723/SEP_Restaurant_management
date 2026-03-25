import { apiBaseUrl } from "../config";
import { getToken } from "../auth";

export interface CustomerLookupResponse {
  customerId: number;
  fullName: string;
  phone: string;
  totalPoints: number;
  email?: string;
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const customerApi = {
  async lookupByPhone(phone: string): Promise<CustomerLookupResponse> {
    const response = await fetch(`${apiBaseUrl}/api/Customer/lookup?phone=${phone}`, {
      headers: authHeaders(),
    });

    const json = await response.json();
    if (!json.success && !json.Success) {
      throw new Error(json.message || "Không tìm thấy khách hàng");
    }
    return json.data || json.Data;
  },

  async createCustomer(data: { fullName: string; phone: string; email?: string }): Promise<CustomerLookupResponse> {
    const response = await fetch(`${apiBaseUrl}/api/Customer`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(data),
    });

    const json = await response.json();
    if (!json.success && !json.Success) {
      throw new Error(json.message || "Lỗi khi tạo khách hàng");
    }
    return json.data || json.Data;
  }
};
