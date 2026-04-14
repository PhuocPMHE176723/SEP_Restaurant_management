import {
  CustomerApiItem,
  CustomerRow,
  EmployeeRow,
  StaffApiItem,
} from "../../../types/models/user";

export const ROLE_OPTIONS = [
  { label: "Quản lý", value: "Manager" },
  { label: "Nhân viên", value: "Staff" },
  { label: "Bếp", value: "Kitchen" },
  { label: "Lễ tân", value: "Receptionist" },
  { label: "Kho", value: "Warehouse" },
] as const;

const ROLE_LABEL_MAP: Record<string, string> = {
  Manager: "Quản lý",
  Staff: "Nhân viên",
  Kitchen: "Bếp",
  Receptionist: "Lễ tân",
  Warehouse: "Kho",
};

export function getRoleLabel(role: string | null | undefined) {
  if (!role) return "Chưa cập nhật";
  return ROLE_LABEL_MAP[role] || role;
}

export function getInitials(fullName: string) {
  return fullName
    .trim()
    .split(" ")
    .slice(-2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function formatDate(date: string | null | undefined) {
  if (!date) return "Chưa cập nhật";
  return new Date(date).toLocaleDateString("vi-VN");
}

export function mapStaffToRow(item: StaffApiItem): EmployeeRow {
  return {
    id: item.staffId,
    code: item.staffCode || `NV${item.staffId}`,
    fullName: item.fullName || "Chưa cập nhật",
    email: item.email || "",
    phoneNumber: item.phone || "",
    roleName: getRoleLabel(item.position),
    hireDate: item.hireDate || "",
    status: item.workingStatus === "ACTIVE" ? "active" : "inactive",
  };
}

export function mapCustomerToRow(
  item: CustomerApiItem,
  index: number
): CustomerRow {
  const rawStatus = item.status || item.workingStatus || "ACTIVE";

  return {
    id: item.customerId ?? index + 1,
    fullName: item.fullName || item.name || "Chưa cập nhật",
    email: item.email || "",
    phoneNumber: item.phone || item.phoneNumber || "",
    tierName: item.membershipTier || item.tierName || "Standard",
    loyaltyPoints: item.loyaltyPoints ?? item.points ?? 0,
    createdAt: item.createdAt || "",
    status: rawStatus === "INACTIVE" ? "inactive" : "active",
  };
}