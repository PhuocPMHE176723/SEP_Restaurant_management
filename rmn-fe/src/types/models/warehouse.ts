export interface PurchaseReceiptResponse {
    receiptId: number;
    receiptCode: string;
    supplierId: number | null;
    receiptDate: string;
    totalAmount: number;
    status: string;
    createdByStaffId: number | null;
    createdByStaffName: string | null;
    note: string | null;
    items: PurchaseReceiptItemResponse[];
}

export interface PurchaseReceiptItemResponse {
    receiptItemId: number;
    receiptId: number;
    ingredientId: number;
    ingredientName: string;
    unit: string;
    quantity: number;
    unitCost: number;
    lineTotal: number;
}

export interface CreatePurchaseReceiptRequest {
    supplierId: number | null;
    note: string | null;
    status: string;
    items: CreatePurchaseReceiptItemRequest[];
}

export interface CreatePurchaseReceiptItemRequest {
    ingredientId: number;
    quantity: number;
    unitCost: number;
}

export interface UpdateReceiptStatusRequest {
    status: string;
}

export interface InventoryOnHandResponse {
    ingredientId: number;
    ingredientName: string;
    unit: string;
    currentStock: number;
    maxStock: number;
}

export interface StockMovementResponse {
    movementId: number;
    ingredientId: number;
    ingredientName: string;
    unit: string;
    movementType: string;
    quantity: number;
    refType: string | null;
    refId: number | null;
    movedAt: string;
    createdByStaffId: number | null;
    createdByStaffName: string | null;
    note: string | null;
}

export interface ManualAdjustmentRequest {
    ingredientId: number;
    movementType: string;
    quantity: number;
    note: string;
}
