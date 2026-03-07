export interface MenuItem {
    id: string; // Used to be ItemId but client code might expect id
    itemId?: number;
    name: string; // Used to be ItemName but client code might expect name
    itemName?: string;
    description: string;
    basePrice?: number;
    price?: number; // fallback
    categoryId: string | number;
    categoryName: string;
    image?: string;
    thumbnail?: string;
    isAvailable?: boolean;
    isActive?: boolean;
    isFeatured?: boolean;
    prepTimeMinutes?: number;
    rating?: number;
    reviewCount?: number;
    createdAt?: string;
}

export interface Category {
    id: string;
    categoryId?: number;
    name: string;
    categoryName?: string;
    icon: string;
    itemCount?: number;
    description?: string;
    displayOrder?: number;
    isActive?: boolean;
}

export interface Booking {
    id?: string;
    guestName: string;
    phone: string;
    email: string;
    date: string;         // YYYY-MM-DD
    timeSlot: string;     // e.g. "18:00"
    partySize: number;
    specialRequests?: string;
    status?: "pending" | "confirmed" | "cancelled" | string;
    confirmedAt?: string;
}

export interface RmnItem {
    id?: string;
    title?: string;
    description?: string;
}
