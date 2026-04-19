import type { ReservationResponse } from "../../types/models/reservation";
import type { UpdateReservationStatusRequest } from "../../types/models/dining-table";
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
    if (!res.ok) {
        let errorMsg = `Request failed (${res.status})`;
        try {
            const errorJson = await res.json();
            errorMsg = errorJson.message || errorMsg;
        } catch (e) {
            // No JSON body
        }
        throw new Error(errorMsg);
    }

    // Check if response has content
    const contentLength = res.headers.get("content-length");
    if (contentLength === "0" || res.status === 204) {
        return {} as T;
    }

    try {
        const json = (await res.json()) as { data?: T; message?: string; success?: boolean; Success?: boolean; Data?: T };
        const success = json.success ?? json.Success ?? true;

        if (!success) {
            throw new Error(json.message ?? `Request failed (${res.status})`);
        }

        return (json.data ?? json.Data) as T;
    } catch (e) {
        if (e instanceof Error && e.message.includes("Unexpected end of JSON input")) {
            return {} as T;
        }
        throw e;
    }
}

export const adminReservationApi = {
    async getAllReservations(startDate?: string, endDate?: string): Promise<ReservationResponse[]> {
        let url = `${apiBaseUrl}/api/AdminReservation`;
        const params = new URLSearchParams();
        if (startDate) params.append("startDate", startDate);
        if (endDate) params.append("endDate", endDate);
        if (params.toString()) url += `?${params.toString()}`;

        const res = await fetch(url, {
            method: "GET",
            headers: authHeaders(),
            cache: "no-store",
        });

        return handleResponse<ReservationResponse[]>(res);
    },

    async updateReservationStatus(id: number, data: UpdateReservationStatusRequest): Promise<{ orderId?: number | null }> {
        const res = await fetch(`${apiBaseUrl}/api/AdminReservation/${id}/status`, {
            method: "PATCH",
            headers: authHeaders(),
            body: JSON.stringify(data),
        });

        return handleResponse<{ orderId?: number | null }>(res);
    },
};
