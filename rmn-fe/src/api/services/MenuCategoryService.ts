/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateMenuCategoryDTO } from '../models/CreateMenuCategoryDTO';
import type { UpdateMenuCategoryDTO } from '../models/UpdateMenuCategoryDTO';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class MenuCategoryService {
    /**
     * @returns any OK
     * @throws ApiError
     */
    public static getApiMenuCategory(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/MenuCategory',
        });
    }
    /**
     * @param requestBody
     * @returns any OK
     * @throws ApiError
     */
    public static postApiMenuCategory(
        requestBody?: CreateMenuCategoryDTO,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/MenuCategory',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param id
     * @returns any OK
     * @throws ApiError
     */
    public static getApiMenuCategory1(
        id: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/MenuCategory/{id}',
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
    public static putApiMenuCategory(
        id: number,
        requestBody?: UpdateMenuCategoryDTO,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/MenuCategory/{id}',
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
    public static deleteApiMenuCategory(
        id: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/MenuCategory/{id}',
            path: {
                'id': id,
            },
        });
    }
}
