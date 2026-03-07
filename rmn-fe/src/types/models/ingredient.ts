export interface IngredientResponse {
    ingredientId: number;
    ingredientName: string;
    unit: string;
    isActive: boolean;
}

export interface CreateIngredientRequest {
    ingredientName: string;
    unit: string;
}

export interface UpdateIngredientRequest {
    ingredientName?: string | null;
    unit?: string | null;
    isActive?: boolean | null;
}
