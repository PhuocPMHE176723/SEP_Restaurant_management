/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateIngredientRequest } from '../models/CreateIngredientRequest';
import type { IngredientResponseIEnumerableApiResponse } from '../models/IngredientResponseIEnumerableApiResponse';
import type { UpdateIngredientRequest } from '../models/UpdateIngredientRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class IngredientService {
    /**
     * @returns IngredientResponseIEnumerableApiResponse OK
     * @throws ApiError
     */
    public static getApiIngredient(): CancelablePromise<IngredientResponseIEnumerableApiResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/Ingredient',
        });
    }
    /**
     * @param requestBody
     * @returns any OK
     * @throws ApiError
     */
    public static postApiIngredient(
        requestBody?: CreateIngredientRequest,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/Ingredient',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param id
     * @returns any OK
     * @throws ApiError
     */
    public static getApiIngredient1(
        id: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/Ingredient/{id}',
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
    public static putApiIngredient(
        id: number,
        requestBody?: UpdateIngredientRequest,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/Ingredient/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param id
     * @returns any OK
     * @throws ApiError
     */
    public static deleteApiIngredient(
        id: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/Ingredient/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @param id
     * @returns any OK
     * @throws ApiError
     */
    public static getApiIngredientPriceHistory(
        id: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/Ingredient/{id}/price-history',
            path: {
                'id': id,
            },
        });
    }
}
