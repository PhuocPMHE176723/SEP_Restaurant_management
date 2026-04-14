export interface StaffProfileDTO {
  staffId: number;
  userId: string;
  username: string;
  staffCode: string;
  fullName: string;
  phone: string;
  email: string;
  position: string;
  hireDate: string;
  workingStatus: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerProfileDTO {
  customerId: number;
  userId: string | null;
  username: string | null;
  fullName: string;
  phone: string;
  email: string | null;
  totalPoints: number;
  createdAt: string;
}

export * from "./profile";