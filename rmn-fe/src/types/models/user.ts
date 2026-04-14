export type WorkingStatus = "ACTIVE" | "INACTIVE";

export type StaffApiItem = {
  staffId: number;
  userId: string;
  staffCode: string;
  fullName: string | null;
  phone: string | null;
  email: string | null;
  position: string | null;
  hireDate: string | null;
  workingStatus: WorkingStatus;
  createdAt: string;
  updatedAt: string | null;
};

export type CustomerApiItem = {
  customerId?: number;
  fullName?: string | null;
  name?: string | null;
  phone?: string | null;
  phoneNumber?: string | null;
  email?: string | null;
  membershipTier?: string | null;
  tierName?: string | null;
  loyaltyPoints?: number | null;
  points?: number | null;
  status?: string | null;
  workingStatus?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type PagedResponse<T> = {
  success: boolean;
  message: string;
  data: {
    items: T[];
    pageNumber: number;
    pageSize: number;
    totalRecords: number;
    totalPages: number;
  };
  errors: unknown;
};

export type SingleResponse<T> = {
  success: boolean;
  message: string;
  data: T;
  errors: unknown;
};

export type EmployeeRow = {
  id: number;
  code: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  roleName: string;
  hireDate: string;
  status: "active" | "inactive";
};

export type CustomerRow = {
  id: number;
  fullName: string;
  email: string;
  phoneNumber: string;
  tierName: string;
  loyaltyPoints: number;
  createdAt: string;
  status: "active" | "inactive";
};

export type EmployeeForm = {
  fullName: string;
  phoneNumber: string;
  email: string;
  roleName: string;
};