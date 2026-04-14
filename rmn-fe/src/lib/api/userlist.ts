import { getToken } from "@/lib/auth";
import { apiBaseUrl } from "@/lib/config";
import {
  CustomerApiItem,
  PagedResponse,
  SingleResponse,
  StaffApiItem,
  EmployeeForm,
} from "@/types/models/user";

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
    cache: "no-store",
  });

  const json = await response.json();

  if (!response.ok || json?.success === false) {
    throw new Error(json?.message || "Không thể xử lý yêu cầu");
  }

  return json as T;
}

function getAuthHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getStaffList(
  page = 1,
  pageSize = 10,
  searchTerm = "",
  status = "ALL"
) {
  const params = new URLSearchParams({
    pageNumber: String(page),
    pageSize: String(pageSize),
    searchTerm,
    status,
  });

  return fetchJson<PagedResponse<StaffApiItem>>(
    `${apiBaseUrl}/api/User/staff?${params.toString()}`,
    {
      headers: getAuthHeaders(),
    }
  );
}

export async function getCustomerList(
  page = 1,
  pageSize = 10,
  searchTerm = ""
) {
  const params = new URLSearchParams({
    pageNumber: String(page),
    pageSize: String(pageSize),
    searchTerm,
  });

  return fetchJson<PagedResponse<CustomerApiItem>>(
    `${apiBaseUrl}/api/User/customers?${params.toString()}`,
    {
      headers: getAuthHeaders(),
    }
  );
}

export async function getStaffDetail(id: number) {
  const json = await fetchJson<SingleResponse<StaffApiItem>>(
    `${apiBaseUrl}/api/User/staff/${id}`,
    {
      headers: getAuthHeaders(),
    }
  );
  return json.data;
}

export async function getCustomerDetail(id: number) {
  const json = await fetchJson<SingleResponse<CustomerApiItem>>(
    `${apiBaseUrl}/api/User/customers/${id}`,
    {
      headers: getAuthHeaders(),
    }
  );
  return json.data;
}

export async function createStaff(payload: EmployeeForm) {
  return fetchJson(`${apiBaseUrl}/api/User/staff`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      fullName: payload.fullName,
      phone: payload.phoneNumber,
      email: payload.email,
      position: payload.roleName,
    }),
  });
}

export async function lockStaff(id: number) {
  return fetchJson(`${apiBaseUrl}/api/User/staff/${id}/lock`, {
    method: "PUT",
    headers: getAuthHeaders(),
  });
}

export async function unlockStaff(id: number) {
  return fetchJson(`${apiBaseUrl}/api/User/staff/${id}/unlock`, {
    method: "PUT",
    headers: getAuthHeaders(),
  });
}