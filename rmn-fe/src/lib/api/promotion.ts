import { apiBaseUrl } from "../config";
import { getToken } from "../auth";
import {
    SystemConfig,
    UpdateSystemConfig,
    DiscountCode,
    CreateDiscountCode,
    LoyaltyLedger,
    LoyaltyTier,
    UpdateLoyaltyTier
} from "../../types/models/promotion";

async function authFetch(endpoint: string, options: RequestInit = {}) {
    const token = getToken();
    const headers = new Headers(options.headers || {});
    if (token) headers.set("Authorization", `Bearer ${token}`);
    if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");

    const res = await fetch(`${apiBaseUrl}${endpoint}`, { ...options, headers });
    if (!res.ok) {
        let msg = "Có lỗi xảy ra";
        try {
            const errData = await res.json();
            msg = errData.message || msg;
        } catch { }
        throw new Error(msg);
    }
    if (res.status === 204) return null;
    return res.json();
}

// ── System Configs ───────────────────────────────────────────

export async function getSystemConfigs(): Promise<SystemConfig[]> {
    return authFetch('/api/promotion/configs');
}

export async function getSystemConfigByKey(key: string): Promise<SystemConfig> {
    return authFetch(`/api/promotion/configs/${key}`);
}

export async function updateSystemConfigs(requests: UpdateSystemConfig[]): Promise<SystemConfig[]> {
    return authFetch('/api/promotion/configs', {
        method: 'PUT',
        body: JSON.stringify(requests)
    });
}

// ── Discount Codes ───────────────────────────────────────────

export async function getDiscountCodes(isActive?: boolean): Promise<DiscountCode[]> {
    const q = isActive !== undefined ? `?isActive=${isActive}` : '';
    return authFetch(`/api/promotion/discounts${q}`);
}

export async function getDiscountCode(id: number): Promise<DiscountCode> {
    return authFetch(`/api/promotion/discounts/${id}`);
}

export async function createDiscountCode(data: CreateDiscountCode): Promise<DiscountCode> {
    return authFetch('/api/promotion/discounts', {
        method: 'POST',
        body: JSON.stringify(data)
    });
}

export async function updateDiscountCode(id: number, data: CreateDiscountCode): Promise<DiscountCode> {
    return authFetch(`/api/promotion/discounts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    });
}

export async function deleteDiscountCode(id: number): Promise<void> {
    await authFetch(`/api/promotion/discounts/${id}`, { method: 'DELETE' });
}

export async function toggleDiscountCode(id: number): Promise<DiscountCode> {
    return authFetch(`/api/promotion/discounts/${id}/toggle`, { method: 'PATCH' });
}

// ── Loyalty Tiers ─────────────────────────────────────────────

export async function getLoyaltyTiers(): Promise<LoyaltyTier[]> {
    return authFetch('/api/promotion/loyalty/tiers');
}

export async function updateLoyaltyTier(id: number, data: UpdateLoyaltyTier): Promise<LoyaltyTier> {
    return authFetch(`/api/promotion/loyalty/tiers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    });
}

// ── Loyalty Ledgers ───────────────────────────────────────────

export async function getLoyaltyLedgers(customerId?: number): Promise<LoyaltyLedger[]> {
    const q = customerId ? `?customerId=${customerId}` : '';
    return authFetch(`/api/promotion/loyalty/ledgers${q}`);
}
