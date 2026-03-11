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
    const json = (await res.json()) as { data?: T; message?: string; success?: boolean; Success?: boolean; Data?: T };
    const success = json.success ?? json.Success ?? res.ok;

    if (!success) {
        throw new Error(json.message ?? `Request failed (${res.status})`);
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
            const json = await res.json();
            throw new Error(json.message ?? `Delete failed (${res.status})`);
        }
    },
};