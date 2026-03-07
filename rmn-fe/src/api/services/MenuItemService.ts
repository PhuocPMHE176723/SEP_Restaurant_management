/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateMenuItemDTO } from '../models/CreateMenuItemDTO';
import type { UpdateMenuItemDTO } from '../models/UpdateMenuItemDTO';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class MenuItemService {
    /**
     * @param categoryId
     * @param includeInactive
     * @returns any OK
     * @throws ApiError
     */
    public static getApiMenuItem(
        categoryId?: number,
        includeInactive: boolean = false,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/MenuItem',
            query: {
                'categoryId': categoryId,
                'includeInactive': includeInactive,
            },
        });
    }
    /**
     * @param requestBody
     * @returns any OK
     * @throws ApiError
     */
    public static postApiMenuItem(
        requestBody?: CreateMenuItemDTO,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/MenuItem',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param id
     * @returns any OK
     * @throws ApiError
     */
    public static getApiMenuItem1(
        id: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/MenuItem/{id}',
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
    public static putApiMenuItem(
        id: number,
        requestBody?: UpdateMenuItemDTO,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/MenuItem/{id}',
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
    public static deleteApiMenuItem(
        id: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/MenuItem/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @param formData
     * @returns any OK
     * @throws ApiError
     */
    public static postApiMenuItemUploadImage(
        formData?: {
            file?: Blob;
        },
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/MenuItem/upload-image',
            formData: formData,
            mediaType: 'multipart/form-data',
        });
    }
}
