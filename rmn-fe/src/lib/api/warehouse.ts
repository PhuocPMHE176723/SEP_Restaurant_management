import { getToken } from "../auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
    const token = getToken();
    const res = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers,
        },
    });

    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.message || data.title || "Lỗi hệ thống");
    }

    // Handle application-level errors (backend returns 200 OK but Success is false)
    if (data.Success === false || data.success === false) {
        throw new Error(data.Message || data.message || "Thao tác thất bại");
    }

    return data.Data !== undefined ? data.Data : (data.data !== undefined ? data.data : data);
}

// ----- Ingredients -----
export async function getIngredients() {
    return fetchWithAuth("/Ingredient");
}

export async function createIngredient(data: { ingredientName: string; unit: string }) {
    return fetchWithAuth("/Ingredient", { method: "POST", body: JSON.stringify(data) });
}

export async function updateIngredient(id: number, data: { ingredientName?: string; unit?: string; isActive?: boolean }) {
    return fetchWithAuth(`/Ingredient/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export async function deleteIngredient(id: number) {
    return fetchWithAuth(`/Ingredient/${id}`, { method: "DELETE" });
}

export async function getIngredientPriceHistory(id: number) {
    return fetchWithAuth(`/Ingredient/${id}/price-history`);
}

// ----- Stock Inventory -----
export async function getInventoryOnHand() {
    return fetchWithAuth("/Stock/inventory");
}

export async function getLowStock(threshold: number = 10) {
    return fetchWithAuth(`/Stock/low-stock?threshold=${threshold}`);
}

export async function getStockMovements(startDate?: string, endDate?: string, ingredientId?: number) {
    let query = "";
    const params = [];
    if (startDate) params.push(`startDate=${startDate}`);
    if (endDate) params.push(`endDate=${endDate}`);
    if (ingredientId) params.push(`ingredientId=${ingredientId}`);
    
    if (params.length > 0) query = "?" + params.join("&");
    
    return fetchWithAuth(`/Stock/movements${query}`);
}

export async function createManualAdjustment(data: { ingredientId: number; movementType: "IN" | "OUT"; quantity: number; note: string }) {
    return fetchWithAuth("/Stock/adjust", { method: "POST", body: JSON.stringify(data) });
}

// ----- Purchase Receipts -----
export async function getPurchaseReceipts() {
    return fetchWithAuth("/PurchaseReceipt");
}

export async function getPurchaseReceiptById(id: number) {
    return fetchWithAuth(`/PurchaseReceipt/${id}`);
}

export async function createPurchaseReceipt(data: { supplierId?: number; note?: string; status: "DRAFT" | "RECEIVED"; items: { ingredientId: number; quantity: number; unitCost: number }[] }) {
    return fetchWithAuth("/PurchaseReceipt", { method: "POST", body: JSON.stringify(data) });
}

export async function updatePurchaseReceiptStatus(id: number, status: "RECEIVED" | "CANCELLED") {
    return fetchWithAuth(`/PurchaseReceipt/${id}/status`, { method: "PUT", body: JSON.stringify({ status }) });
}

// ----- Inventory Audits -----
export async function getInventoryAudits() {
    return fetchWithAuth("/InventoryAudit");
}

export async function getInventoryAuditById(id: number) {
    return fetchWithAuth(`/InventoryAudit/${id}`);
}

export async function createInventoryAudit(data: { note?: string; items: { ingredientId: number; actualQuantity: number }[] }) {
    return fetchWithAuth("/InventoryAudit", { method: "POST", body: JSON.stringify(data) });
}

export async function getConsumptionReport(startDate: string, endDate: string) {
    return fetchWithAuth(`/Stock/consumption-report?startDate=${startDate}&endDate=${endDate}`);
}

// ----- Daily Estimation -----
export async function getDailyAllocations(date: string) {
    return fetchWithAuth(`/DailyEstimation?date=${date}`);
}

export async function upsertDailyAllocation(data: { date: string; ingredientId: number; allocatedQuantity: number; note?: string }) {
    return fetchWithAuth("/DailyEstimation", { method: "POST", body: JSON.stringify(data) });
}

