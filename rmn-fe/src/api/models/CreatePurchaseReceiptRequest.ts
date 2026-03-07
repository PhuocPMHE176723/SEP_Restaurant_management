/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreatePurchaseReceiptItemRequest } from './CreatePurchaseReceiptItemRequest';
export type CreatePurchaseReceiptRequest = {
    supplierId?: number | null;
    note?: string | null;
    status?: string | null;
    items: Array<CreatePurchaseReceiptItemRequest>;
};

