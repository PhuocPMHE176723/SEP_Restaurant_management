// ── Customer Reservation API ───────────────────────────────────
import { apiBaseUrl } from "../config";
import { getToken } from "../auth";
// ── Helpers ───────────────────────────────────────────────────
function authHeaders(): Record<string, string> {
    const token = getToken();
    return {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
}

async function handleResponse<T>(res: Response): Promise<T> {
    const rawText = await res.text();

    let body: any = null;

    try {
        body = rawText ? JSON.parse(rawText) : null;
    } catch {
        body = rawText;
    }

    if (!res.ok) {
        const message =
            typeof body === "string"
                ? body
                : body?.message || "Có lỗi xảy ra";

        throw new Error(message);
    }

    return body?.data ?? body;
}
//-Types---------
export interface AssignableTable {
    tableId: number;
    tableCode: string;
    tableName: string;
    capacity: number;
    isOccupied: boolean;
    isReserved: boolean;
    isSelectable: boolean;
    statusMessage: string;
    conflictReservationId?: number | null;
    conflictCustomerName?: string | null;
}

export interface ReservationAssignTablesResponse {
    reservationId: number;
    reservationCode: string;
    customerName: string;
    numberOfGuest: number;
    numberOfTable: number;
    table4Count?: number;
    table6Count?: number;
    table8Count?: number;
    reservedAt: string;
    shift: string;
    selectedTableIds: number[];
    tables: AssignableTable[];
}

export interface AssignTablesRequest {
    tableIds: number[];
}

export type CheckInReservationResponse = {
    orderId: number;
};
//---API Calls----------------
export const tableReservationApi = {
    async getAssignableTables(
        reservationId: number,
    ): Promise<ReservationAssignTablesResponse> {
        const res = await fetch(
            `${apiBaseUrl}/api/TableReservation/${reservationId}/assignable-tables`,
            {
                method: "GET",
                headers: authHeaders(),
                cache: "no-store",
            },
        );

        return handleResponse<ReservationAssignTablesResponse>(res);
    },

    async assignTables(
        reservationId: number,
        data: AssignTablesRequest,
    ): Promise<boolean> {
        const res = await fetch(
            `${apiBaseUrl}/api/TableReservation/${reservationId}/assign-tables`,
            {
                method: "PUT",
                headers: authHeaders(),
                body: JSON.stringify(data),
            },
        );

        return handleResponse<boolean>(res);
    },
    async checkInReservation(
        reservationId: number,
    ): Promise<CheckInReservationResponse> {
        const res = await fetch(
            `${apiBaseUrl}/api/TableReservation/${reservationId}/check-in`,
            {
                method: "PUT",
                headers: authHeaders(),
            },
        );

        return handleResponse<CheckInReservationResponse>(res);
    }
}