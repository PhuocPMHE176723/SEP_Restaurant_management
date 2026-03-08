export interface SystemConfig {
    configKey: string;
    configValue: string;
    description?: string;
    updatedAt: string;
}

export interface UpdateSystemConfig {
    configKey: string;
    configValue: string;
}

export interface DiscountCode {
    discountId: number;
    code: string;
    discountType: string;
    discountValue: number;
    minOrderValue: number;
    maxDiscountAmount?: number;
    maxUses?: number;
    usedCount: number;
    validFrom?: string;
    validTo?: string;
    isActive: boolean;
}

export interface CreateDiscountCode {
    code: string;
    discountType: string;
    discountValue: number;
    minOrderValue: number;
    maxDiscountAmount?: number;
    maxUses?: number;
    validFrom?: string;
    validTo?: string;
    isActive: boolean;
}

export interface LoyaltyLedger {
    ledgerId: number;
    customerId: number;
    customerName: string;
    customerPhone: string;
    refType: string;
    refId?: number;
    pointsChange: number;
    note?: string;
    createdAt: string;
    createdByStaffName?: string;
}

export interface LoyaltyTier {
    tierId: number;
    tierName: string;
    minPoints: number;
    discountRate: number;
    isActive: boolean;
}

export interface UpdateLoyaltyTier {
    tierName: string;
    minPoints: number;
    discountRate: number;
    isActive: boolean;
}
