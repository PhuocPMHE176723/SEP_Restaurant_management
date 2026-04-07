export interface BlogCategory {
    categoryId: number;
    categoryName: string;
    description?: string;
    isActive: boolean;
}

export interface BlogPost {
    postId: number;
    title: string;
    content: string;
    featuredImage?: string;
    categoryId: number;
    categoryName: string;
    status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
    createdAt: string;
}

export interface CreateBlogPostRequest {
    title: string;
    content: string;
    featuredImage?: string;
    categoryId: number;
    status: string;
}

export interface Slider {
    sliderId: number;
    imageUrl: string;
    title?: string;
    link?: string;
    displayOrder: number;
    isActive: boolean;
    createdAt: string;
}

export interface CreateSliderRequest {
    imageUrl: string;
    title?: string;
    link?: string;
    displayOrder: number;
}
