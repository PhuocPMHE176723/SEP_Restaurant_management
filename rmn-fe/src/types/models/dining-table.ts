export interface DiningTableResponse {
    tableId: number;
    tableCode: string;
    tableName?: string;
    capacity: number;
    status: "AVAILABLE" | "OCCUPIED" | "RESERVED" | "MAINTENANCE";
    isActive: boolean;
}

export interface CreateDiningTableRequest {
    tableCode: string;
    tableName?: string;
    capacity: number;
    status?: string;
}

export interface UpdateDiningTableRequest {
    tableCode?: string;
    tableName?: string;
    capacity?: number;
    status?: string;
    isActive?: boolean;
}

export interface UpdateReservationStatusRequest {
    status: string;
    tableIds?: number[];
}