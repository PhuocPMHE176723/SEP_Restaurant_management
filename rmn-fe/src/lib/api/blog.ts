import type { BlogPost, BlogCategory, CreateBlogPostRequest } from "../../types/models/content";
import { apiBaseUrl } from "../config";
import { getToken } from "../auth";

function authHeaders(): Record<string, string> {
    const token = getToken();
    return {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
}

async function handleResponse<T>(res: Response): Promise<T> {
    const json = (await res.json()) as { data?: T; message?: string; Success?: boolean; success?: boolean; Data?: T };
    const success = json.success ?? json.Success ?? res.ok;

    if (!success) {
        throw new Error(json.message ?? `Request failed (${res.status})`);
    }

    return (json.data ?? json.Data) as T;
}

export const blogApi = {
    async getAllPosts(): Promise<BlogPost[]> {
        const res = await fetch(`${apiBaseUrl}/api/Blog`, {
            method: "GET",
            headers: authHeaders(),
        });
        return handleResponse<BlogPost[]>(res);
    },

    async getPostById(id: number): Promise<BlogPost> {
        const res = await fetch(`${apiBaseUrl}/api/Blog/${id}`, {
            method: "GET",
            headers: authHeaders(),
        });
        return handleResponse<BlogPost>(res);
    },

    async createPost(data: CreateBlogPostRequest): Promise<BlogPost> {
        const res = await fetch(`${apiBaseUrl}/api/Blog`, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify(data),
        });
        return handleResponse<BlogPost>(res);
    },

    async updatePost(id: number, data: CreateBlogPostRequest): Promise<string> {
        const res = await fetch(`${apiBaseUrl}/api/Blog/${id}`, {
            method: "PUT",
            headers: authHeaders(),
            body: JSON.stringify(data),
        });
        return handleResponse<string>(res);
    },

    async deletePost(id: number): Promise<string> {
        const res = await fetch(`${apiBaseUrl}/api/Blog/${id}`, {
            method: "DELETE",
            headers: authHeaders(),
        });
        return handleResponse<string>(res);
    },

    async getCategories(): Promise<BlogCategory[]> {
        const res = await fetch(`${apiBaseUrl}/api/Blog/categories`, {
            method: "GET",
            headers: authHeaders(),
        });
        return handleResponse<BlogCategory[]>(res);
    },

    async createCategory(data: Partial<BlogCategory>): Promise<BlogCategory> {
        const res = await fetch(`${apiBaseUrl}/api/Blog/categories`, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify(data),
        });
        return handleResponse<BlogCategory>(res);
    },

    async updateCategory(id: number, data: Partial<BlogCategory>): Promise<string> {
        const res = await fetch(`${apiBaseUrl}/api/Blog/categories/${id}`, {
            method: "PUT",
            headers: authHeaders(),
            body: JSON.stringify(data),
        });
        return handleResponse<string>(res);
    },

    async deleteCategory(id: number): Promise<string> {
        const res = await fetch(`${apiBaseUrl}/api/Blog/categories/${id}`, {
            method: "DELETE",
            headers: authHeaders(),
        });
        return handleResponse<string>(res);
    },

    async uploadImage(file: File): Promise<{ url: string }> {
        const token = getToken();
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch(`${apiBaseUrl}/api/Blog/upload-image`, {
            method: "POST",
            headers: {
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: formData,
        });

        return handleResponse<{ url: string }>(res);
    },
};
