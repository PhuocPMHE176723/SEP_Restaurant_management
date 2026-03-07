/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PurchaseReceiptItemResponse } from './PurchaseReceiptItemResponse';
export type PurchaseReceiptResponse = {
    receiptId?: number;
    receiptCode?: string | null;
    supplierId?: number | null;
    receiptDate?: string;
    totalAmount?: number;
    status?: string | null;
    createdByStaffId?: number | null;
    createdByStaffName?: string | null;
    note?: string | null;
    items?: Array<PurchaseReceiptItemResponse> | null;
};

