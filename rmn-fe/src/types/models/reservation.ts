export interface OrderItemResponse {
    orderItemId: number;
    itemId: number;
    itemNameSnapshot: string;
    quantity: number;
    unitPrice: number;
    note?: string;
}

export interface OrderResponse {
    orderId: number;
    orderCode: string;
    status: string;
    totalAmount: number;
    orderItems: OrderItemResponse[];
}

export interface ReservationResponse {
    reservationId: number;
    customerId: number;
    customerName: string;
    customerPhone: string;
    partySize: number;
    reservedAt: string;
    durationMinutes: number;
    status: string;
    note?: string;
    createdAt?: string;
    createdByStaffId?: number | null;
    order?: OrderResponse;
}
