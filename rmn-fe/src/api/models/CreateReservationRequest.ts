/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { OrderItemRequest } from './OrderItemRequest';
export type CreateReservationRequest = {
    reservedAt: string;
    partySize: number;
    durationMinutes?: number;
    note?: string | null;
    menuItems?: Array<OrderItemRequest> | null;
};

