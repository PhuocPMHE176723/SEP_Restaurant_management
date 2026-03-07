/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreatePurchaseReceiptRequest } from '../models/CreatePurchaseReceiptRequest';
import type { PurchaseReceiptResponseIEnumerableApiResponse } from '../models/PurchaseReceiptResponseIEnumerableApiResponse';
import type { UpdateReceiptStatusRequest } from '../models/UpdateReceiptStatusRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class PurchaseReceiptService {
    /**
     * @returns PurchaseReceiptResponseIEnumerableApiResponse OK
     * @throws ApiError
     */
    public static getApiPurchaseReceipt(): CancelablePromise<PurchaseReceiptResponseIEnumerableApiResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/PurchaseReceipt',
        });
    }
    /**
     * @param requestBody
     * @returns any OK
     * @throws ApiError
     */
    public static postApiPurchaseReceipt(
        requestBody?: CreatePurchaseReceiptRequest,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/PurchaseReceipt',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param id
     * @returns any OK
     * @throws ApiError
     */
    public static getApiPurchaseReceipt1(
        id: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/PurchaseReceipt/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @param id
     * @param requestBody
     * @returns any OK
     * @throws ApiError
     */
    public static putApiPurchaseReceiptStatus(
        id: number,
        requestBody?: UpdateReceiptStatusRequest,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/PurchaseReceipt/{id}/status',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
