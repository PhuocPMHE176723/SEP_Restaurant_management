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
    const json = (await res.json()) as { data?: T; message?: string; success?: boolean; Success?: boolean; Data?: T };
    const success = json.success ?? json.Success ?? res.ok;

    if (!success) {
        throw new Error(json.message ?? `Request failed (${res.status})`);
    }

    return (json.data ?? json.Data) as T;
}

export const adminReservationApi = {
    async getAllReservations(): Promise<ReservationResponse[]> {
        const res = await fetch(`${apiBaseUrl}/api/AdminReservation`, {
            method: "GET",
            headers: authHeaders(),
            cache: "no-store",
        });

        return handleResponse<ReservationResponse[]>(res);
    },

    async updateReservationStatus(id: number, data: UpdateReservationStatusRequest): Promise<string> {
        const res = await fetch(`${apiBaseUrl}/api/AdminReservation/${id}/status`, {
            method: "PATCH",
            headers: authHeaders(),
            body: JSON.stringify(data),
        });

        return handleResponse<string>(res);
    },
};
