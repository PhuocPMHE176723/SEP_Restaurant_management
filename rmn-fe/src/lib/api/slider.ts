import type { Slider, CreateSliderRequest } from "../../types/models/content";
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

export const sliderApi = {
    async getAllSliders(): Promise<Slider[]> {
        const res = await fetch(`${apiBaseUrl}/api/Slider`, {
            method: "GET",
            headers: authHeaders(),
        });
        return handleResponse<Slider[]>(res);
    },

    async createSlider(data: CreateSliderRequest): Promise<Slider> {
        const res = await fetch(`${apiBaseUrl}/api/Slider`, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify(data),
        });
        return handleResponse<Slider>(res);
    },

    async updateSlider(id: number, data: CreateSliderRequest): Promise<string> {
        const res = await fetch(`${apiBaseUrl}/api/Slider/${id}`, {
            method: "PUT",
            headers: authHeaders(),
            body: JSON.stringify(data),
        });
        return handleResponse<string>(res);
    },

    async deleteSlider(id: number): Promise<string> {
        const res = await fetch(`${apiBaseUrl}/api/Slider/${id}`, {
            method: "DELETE",
            headers: authHeaders(),
        });
        return handleResponse<string>(res);
    },

    async uploadImage(file: File): Promise<{ url: string }> {
        const token = getToken();
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch(`${apiBaseUrl}/api/Slider/upload-image`, {
            method: "POST",
            headers: {
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: formData,
        });

        return handleResponse<{ url: string }>(res);
    },
};
