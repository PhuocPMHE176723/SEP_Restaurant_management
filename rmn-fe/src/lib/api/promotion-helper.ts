import { apiBaseUrl } from "../config";
import { getToken } from "../auth";

export interface DiscountCodeResponse {
  discountId: number;
  code: string;
  discountType: string;
  discountValue: number;
  maxDiscountAmount?: number;
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const promotionApi = {
  async validateDiscount(code: string, orderValue: number): Promise<DiscountCodeResponse> {
    const response = await fetch(`${apiBaseUrl}/api/Promotion/discounts/validate?code=${code}&orderValue=${orderValue}`, {
      headers: authHeaders(),
    });

    const json = await response.json();
    if (!json.success && !json.Success) {
      throw new Error(json.message || "Mã giảm giá không hợp lệ");
    }
    return json.data || json.Data;
  }
};
