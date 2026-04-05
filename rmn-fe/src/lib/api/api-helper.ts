import { getToken } from "../auth";

export function authHeaders(): Record<string, string> {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function handleResponse<T>(res: Response): Promise<T> {
  const text = await res.text();
  let json: any = {};
  
  if (text) {
    try {
      json = JSON.parse(text);
    } catch (e) {
      console.error("Failed to parse JSON response:", text);
      if (!res.ok) {
        throw new Error(`Request failed (${res.status}): ${text.substring(0, 100)}`);
      }
      throw new Error("Invalid response format from server");
    }
  }

  const success = json.success ?? json.Success ?? res.ok;

  if (!success) {
    throw new Error(json.message ?? json.Message ?? `Request failed (${res.status})`);
  }

  return (json.data ?? json.Data) as T;
}
