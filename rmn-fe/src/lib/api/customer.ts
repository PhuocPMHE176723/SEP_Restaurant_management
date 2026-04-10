import { apiBaseUrl } from "../config";
import { getToken } from "../auth";

export interface CustomerLookupResponse {
  customerId: number;
  fullName: string;
  phone: string;
  totalPoints: number;
  email?: string;
}

export interface PointLedgerEntry {
  ledgerId: number;
  refType: string;
  refId?: number;
  pointsChange: number;
  note?: string;
  createdAt: string;
}

export interface DiscountHistoryEntry {
  invoiceId: number;
  invoiceCode: string;
  totalAmount: number;
  discountAmount: number;
  paidAmount: number;
  issuedAt: string;
}

export interface CustomerProfileResponse {
  customerId: number;
  fullName: string;
  phone: string;
  email?: string;
  totalPoints: number;
  currentTier: string;
  pointHistory: PointLedgerEntry[];
  discountHistory: DiscountHistoryEntry[];
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
  },

  async getMyProfile(): Promise<CustomerProfileResponse> {
    const response = await fetch(`${apiBaseUrl}/api/Customer/me`, {
      headers: authHeaders(),
    });

    const json = await response.json();
    if (!json.success && !json.Success) {
      throw new Error(json.message || "Lỗi khi lấy thông tin hồ sơ");
    }
    return json.data || json.Data;
  }
};
