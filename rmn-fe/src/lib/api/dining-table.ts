import type { DiningTableResponse, CreateDiningTableRequest, UpdateDiningTableRequest } from "../../types/models/dining-table";
import { apiBaseUrl } from "../config";
import { getToken } from "../auth";

function authHeaders(): Record<string, string> {
    const token = getToken();
    return {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
}

async function handleResponse<T>(res: Response): Promise<T> {
    const contentType = res.headers.get("content-type");
    let json: any = {};

    if (contentType && contentType.includes("application/json")) {
        try {
            json = await res.json();
        } catch (e) {
            console.error("JSON parse error:", e);
        }
    }

    const success = json.success ?? json.Success ?? res.ok;

    if (!success) {
        throw new Error(json.message ?? json.Message ?? `Yêu cầu thất bại (${res.status})`);
    }

    return (json.data ?? json.Data) as T;
}

export const diningTableApi = {
    async getAllTables(): Promise<DiningTableResponse[]> {
        const res = await fetch(`${apiBaseUrl}/api/DiningTable`, {
            method: "GET",
            headers: authHeaders(),
            cache: "no-store",
        });

        return handleResponse<DiningTableResponse[]>(res);
    },

    async getTableById(id: number): Promise<DiningTableResponse> {
        const res = await fetch(`${apiBaseUrl}/api/DiningTable/${id}`, {
            method: "GET",
            headers: authHeaders(),
            cache: "no-store",
        });

        return handleResponse<DiningTableResponse>(res);
    },

    async createTable(data: CreateDiningTableRequest): Promise<DiningTableResponse> {
        const res = await fetch(`${apiBaseUrl}/api/DiningTable`, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify(data),
        });

        return handleResponse<DiningTableResponse>(res);
    },

    async updateTable(id: number, data: UpdateDiningTableRequest): Promise<DiningTableResponse> {
        const res = await fetch(`${apiBaseUrl}/api/DiningTable/${id}`, {
            method: "PUT",
            headers: authHeaders(),
            body: JSON.stringify(data),
        });

        return handleResponse<DiningTableResponse>(res);
    },

    async deleteTable(id: number): Promise<void> {
        const res = await fetch(`${apiBaseUrl}/api/DiningTable/${id}`, {
            method: "DELETE",
            headers: authHeaders(),
        });

        if (!res.ok) {
            let errorMsg = `Xóa thất bại (${res.status})`;
            try {
                const json = await res.json();
                errorMsg = json.message ?? json.Message ?? errorMsg;
            } catch (e) {
                // Silently fallback to status code error
            }
            throw new Error(errorMsg);
        }
    },
    async getCleanupRecommendations(date?: string): Promise<CleanupRecommendationResponse> {
        const query = date ? `?date=${encodeURIComponent(date)}` : "";
        const res = await fetch(`${apiBaseUrl}/api/diningtable/cleanup-recommendations${query}`, {
            method: "GET",
            headers: authHeaders(),
        });
        return handleResponse<CleanupRecommendationResponse>(res);
    },
};

export interface CleanupWindowResponse {
    label: string;
    start: string;
    end: string;
}

export interface TableReminderResponse {
    tableId: number;
    tableCode: string;
    tableName?: string | null;
    status: string;
    orderId?: number | null;
    orderOpenedAt?: string | null;
    minutesOccupied: number;
    reason: string;
    priority: number;
}

export interface CleanupRecommendationResponse {
    date: string;
    generatedAt: string;
    windows: CleanupWindowResponse[];
    reminders: TableReminderResponse[];
}