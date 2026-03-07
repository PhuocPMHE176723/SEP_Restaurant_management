/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { InventoryOnHandResponseIEnumerableApiResponse } from '../models/InventoryOnHandResponseIEnumerableApiResponse';
import type { ManualAdjustmentRequest } from '../models/ManualAdjustmentRequest';
import type { StockMovementResponseIEnumerableApiResponse } from '../models/StockMovementResponseIEnumerableApiResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class StockService {
    /**
     * @returns InventoryOnHandResponseIEnumerableApiResponse OK
     * @throws ApiError
     */
    public static getApiStockInventory(): CancelablePromise<InventoryOnHandResponseIEnumerableApiResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/Stock/inventory',
        });
    }
    /**
     * @param threshold
     * @returns any OK
     * @throws ApiError
     */
    public static getApiStockLowStock(
        threshold: number = 10,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/Stock/low-stock',
            query: {
                'threshold': threshold,
            },
        });
    }
    /**
     * @returns StockMovementResponseIEnumerableApiResponse OK
     * @throws ApiError
     */
    public static getApiStockMovements(): CancelablePromise<StockMovementResponseIEnumerableApiResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/Stock/movements',
        });
    }
    /**
     * @param requestBody
     * @returns any OK
     * @throws ApiError
     */
    public static postApiStockAdjust(
        requestBody?: ManualAdjustmentRequest,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/Stock/adjust',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
