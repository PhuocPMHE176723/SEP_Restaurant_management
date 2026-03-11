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
    excerpt?: string;
    featuredImage?: string;
    categoryId: number;
    categoryName: string;
    status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
    tags?: string;
    createdAt: string;
    publishedAt?: string;
    authorName?: string;
}

export interface CreateBlogPostRequest {
    title: string;
    content: string;
    excerpt?: string;
    featuredImage?: string;
    categoryId: number;
    status: string;
    tags?: string;
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
