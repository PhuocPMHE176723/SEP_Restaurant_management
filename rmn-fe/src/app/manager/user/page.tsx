"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "../manager.module.css";
import { getToken } from "@/lib/auth";
import { apiBaseUrl } from "@/lib/config";

type WorkingStatus = "ACTIVE" | "INACTIVE";

type StaffApiItem = {
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

type CustomerApiItem = {
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

type PagedResponse<T> = {
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

type SingleResponse<T> = {
  success: boolean;
  message: string;
  data: T;
  errors: unknown;
};

type EmployeeRow = {
  id: number;
  code: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  roleName: string;
  hireDate: string;
  status: "active" | "inactive";
};

type CustomerRow = {
  id: number;
  fullName: string;
  email: string;
  phoneNumber: string;
  tierName: string;
  loyaltyPoints: number;
  createdAt: string;
  status: "active" | "inactive";
};

type EmployeeForm = {
  fullName: string;
  phoneNumber: string;
  email: string;
  roleName: string;
};

const ROLE_OPTIONS = [
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

function getRoleLabel(role: string | null | undefined) {
  if (!role) return "Chưa cập nhật";
  return ROLE_LABEL_MAP[role] || role;
}

function getInitials(fullName: string) {
  return fullName
    .trim()
    .split(" ")
    .slice(-2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function formatDate(date: string | null | undefined) {
  if (!date) return "Chưa cập nhật";
  return new Date(date).toLocaleDateString("vi-VN");
}

function mapStaffToRow(item: StaffApiItem): EmployeeRow {
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

function mapCustomerToRow(item: CustomerApiItem, index: number): CustomerRow {
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

async function getStaffDetail(id: number): Promise<StaffApiItem> {
  const token = getToken();

  const json = await fetchJson<SingleResponse<StaffApiItem>>(
    `${apiBaseUrl}/api/User/staff/${id}`,
    {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }
  );

  return json.data;
}

async function getCustomerDetail(id: number): Promise<CustomerApiItem> {
  const token = getToken();

  const json = await fetchJson<SingleResponse<CustomerApiItem>>(
    `${apiBaseUrl}/api/User/customers/${id}`,
    {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }
  );

  return json.data;
}

function CreateStaffModal({
  onClose,
  onSubmit,
  submitting,
}: {
  onClose: () => void;
  onSubmit: (payload: EmployeeForm) => void;
  submitting: boolean;
}) {
  const [form, setForm] = useState<EmployeeForm>({
    fullName: "",
    phoneNumber: "",
    email: "",
    roleName: "Staff",
  });

  const [error, setError] = useState<string | null>(null);

  function handleChange<K extends keyof EmployeeForm>(
    field: K,
    value: EmployeeForm[K]
  ) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit() {
    if (!form.fullName.trim()) {
      setError("Vui lòng nhập họ và tên.");
      return;
    }
    if (!form.phoneNumber.trim()) {
      setError("Vui lòng nhập số điện thoại.");
      return;
    }
    if (!form.email.trim()) {
      setError("Vui lòng nhập email.");
      return;
    }

    setError(null);
    onSubmit(form);
  }

  return (
    <div
      className={styles.modalOverlay}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={styles.modal}>
        <div className={styles.modalHead}>
          <h3 className={styles.modalTitle}>Thêm nhân viên mới</h3>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: "none",
              background: "transparent",
              fontSize: "1.25rem",
              cursor: "pointer",
              color: "#64748b",
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        <div className={styles.modalBody}>
          {error && <div className={styles.modalError}>{error}</div>}

          <div className={styles.field}>
            <label className={styles.label}>Họ và tên *</label>
            <input
              className={styles.input}
              placeholder="Nhập tên nhân viên..."
              value={form.fullName}
              onChange={(e) => handleChange("fullName", e.target.value)}
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "1rem",
            }}
          >
            <div className={styles.field}>
              <label className={styles.label}>Số điện thoại *</label>
              <input
                className={styles.input}
                placeholder="09xx..."
                value={form.phoneNumber}
                onChange={(e) => handleChange("phoneNumber", e.target.value)}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Vị trí</label>
              <select
                className={styles.select}
                value={form.roleName}
                onChange={(e) => handleChange("roleName", e.target.value)}
              >
                {ROLE_OPTIONS.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Email *</label>
            <input
              className={styles.input}
              placeholder="example@restaurant.com"
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
            />
          </div>
        </div>

        <div className={styles.modalFoot}>
          <button type="button" className={styles.btnCancel} onClick={onClose}>
            Huỷ
          </button>
          <button
            type="button"
            className={styles.btnSave}
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? "Đang tạo..." : "Lưu thông tin"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ViewStaffModal({
  detail,
  onClose,
}: {
  detail: StaffApiItem;
  onClose: () => void;
}) {
  return (
    <div
      className={styles.modalOverlay}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={styles.modal}>
        <div className={styles.modalHead}>
          <h3 className={styles.modalTitle}>Thông tin nhân viên</h3>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: "none",
              background: "transparent",
              fontSize: "1.25rem",
              cursor: "pointer",
              color: "#64748b",
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.field}>
            <label className={styles.label}>Mã nhân viên</label>
            <input className={styles.input} value={detail.staffCode || ""} readOnly />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Họ và tên</label>
            <input className={styles.input} value={detail.fullName || ""} readOnly />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "1rem",
            }}
          >
            <div className={styles.field}>
              <label className={styles.label}>Số điện thoại</label>
              <input className={styles.input} value={detail.phone || ""} readOnly />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Email</label>
              <input className={styles.input} value={detail.email || ""} readOnly />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Vị trí</label>
            <input
              className={styles.input}
              value={getRoleLabel(detail.position)}
              readOnly
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "1rem",
            }}
          >
            <div className={styles.field}>
              <label className={styles.label}>Ngày vào làm</label>
              <input
                className={styles.input}
                value={formatDate(detail.hireDate)}
                readOnly
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Trạng thái</label>
              <input
                className={styles.input}
                value={detail.workingStatus === "ACTIVE" ? "Đang hoạt động" : "Đã khóa"}
                readOnly
              />
            </div>
          </div>
        </div>

        <div className={styles.modalFoot}>
          <button type="button" className={styles.btnSave} onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

function ViewCustomerModal({
  detail,
  onClose,
}: {
  detail: CustomerApiItem;
  onClose: () => void;
}) {
  const fullName = detail.fullName || detail.name || "";
  const phone = detail.phone || detail.phoneNumber || "";
  const status = detail.status || detail.workingStatus || "ACTIVE";
  const tierName = detail.membershipTier || detail.tierName || "Standard";
  const points = detail.loyaltyPoints ?? detail.points ?? 0;

  return (
    <div
      className={styles.modalOverlay}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={styles.modal}>
        <div className={styles.modalHead}>
          <h3 className={styles.modalTitle}>Thông tin khách hàng</h3>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: "none",
              background: "transparent",
              fontSize: "1.25rem",
              cursor: "pointer",
              color: "#64748b",
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.field}>
            <label className={styles.label}>Họ và tên</label>
            <input className={styles.input} value={fullName} readOnly />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "1rem",
            }}
          >
            <div className={styles.field}>
              <label className={styles.label}>Số điện thoại</label>
              <input className={styles.input} value={phone} readOnly />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Email</label>
              <input className={styles.input} value={detail.email || ""} readOnly />
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "1rem",
            }}
          >
            <div className={styles.field}>
              <label className={styles.label}>Hạng thành viên</label>
              <input className={styles.input} value={tierName} readOnly />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Điểm tích lũy</label>
              <input className={styles.input} value={String(points)} readOnly />
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "1rem",
            }}
          >
            <div className={styles.field}>
              <label className={styles.label}>Ngày tạo</label>
              <input
                className={styles.input}
                value={formatDate(detail.createdAt)}
                readOnly
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Trạng thái</label>
              <input
                className={styles.input}
                value={status === "INACTIVE" ? "Đã khóa" : "Đang hoạt động"}
                readOnly
              />
            </div>
          </div>
        </div>

        <div className={styles.modalFoot}>
          <button type="button" className={styles.btnSave} onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmStatusModal({
  employee,
  mode,
  onClose,
  onConfirm,
  submitting,
}: {
  employee: EmployeeRow;
  mode: "lock" | "unlock";
  onClose: () => void;
  onConfirm: () => void;
  submitting: boolean;
}) {
  const isLock = mode === "lock";

  return (
    <div
      className={styles.modalOverlay}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={styles.modal} style={{ maxWidth: 460 }}>
        <div className={styles.modalHead}>
          <h3 className={styles.modalTitle}>
            {isLock ? "Xác nhận khóa nhân viên" : "Xác nhận mở khóa nhân viên"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: "none",
              background: "transparent",
              fontSize: "1.25rem",
              cursor: "pointer",
              color: "#64748b",
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        <div className={styles.modalBody}>
          <div
            className={styles.modalError}
            style={{
              background: isLock ? "#fff7ed" : "#ecfdf5",
              borderColor: isLock ? "#fdba74" : "#86efac",
              color: isLock ? "#c2410c" : "#166534",
            }}
          >
            Bạn có chắc muốn {isLock ? "khóa" : "mở khóa"} nhân viên{" "}
            <strong>{employee.fullName}</strong> không?
          </div>
        </div>

        <div className={styles.modalFoot}>
          <button type="button" className={styles.btnCancel} onClick={onClose}>
            Hủy
          </button>
          <button
            type="button"
            className={isLock ? styles.btnDelete : styles.btnSave}
            onClick={onConfirm}
            disabled={submitting}
          >
            {submitting
              ? "Đang xử lý..."
              : isLock
              ? "Khóa nhân viên"
              : "Mở khóa nhân viên"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ManagerUsersPage() {
  const [activeTab, setActiveTab] = useState<"employee" | "customer">("employee");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");

  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [customers, setCustomers] = useState<CustomerRow[]>([]);

  const [staffMeta, setStaffMeta] = useState({
    pageNumber: 1,
    pageSize: 10,
    totalRecords: 0,
    totalPages: 1,
  });

  const [customerMeta, setCustomerMeta] = useState({
    pageNumber: 1,
    pageSize: 10,
    totalRecords: 0,
    totalPages: 1,
  });

  const [loading, setLoading] = useState(true);
  const [customerLoading, setCustomerLoading] = useState(false);
  const [error, setError] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showCustomerViewModal, setShowCustomerViewModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);

  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeRow | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<StaffApiItem | null>(null);
  const [selectedCustomerDetail, setSelectedCustomerDetail] = useState<CustomerApiItem | null>(null);
  const [statusMode, setStatusMode] = useState<"lock" | "unlock">("lock");

  const [submitting, setSubmitting] = useState(false);
  const [statusSubmitting, setStatusSubmitting] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  async function loadStaff(page = 1) {
    const token = getToken();

    const json = await fetchJson<PagedResponse<StaffApiItem>>(
      `${apiBaseUrl}/api/User/staff?pageNumber=${page}&pageSize=10`,
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }
    );

    setEmployees(json.data.items.map(mapStaffToRow));
    setStaffMeta({
      pageNumber: json.data.pageNumber,
      pageSize: json.data.pageSize,
      totalRecords: json.data.totalRecords,
      totalPages: json.data.totalPages,
    });
  }

  async function loadCustomers(page = 1) {
    const token = getToken();

    const json = await fetchJson<PagedResponse<CustomerApiItem>>(
      `${apiBaseUrl}/api/User/customers?pageNumber=${page}&pageSize=10`,
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }
    );

    setCustomers(json.data.items.map(mapCustomerToRow));
    setCustomerMeta({
      pageNumber: json.data.pageNumber,
      pageSize: json.data.pageSize,
      totalRecords: json.data.totalRecords,
      totalPages: json.data.totalPages,
    });
  }

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setError("");
        await Promise.all([loadStaff(1), loadCustomers(1)]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Không thể tải dữ liệu");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  const filteredEmployees = useMemo(() => {
    return employees.filter((item) => {
      const keyword = searchTerm.toLowerCase();
      const matchesSearch =
        item.fullName.toLowerCase().includes(keyword) ||
        item.phoneNumber.toLowerCase().includes(keyword) ||
        item.email.toLowerCase().includes(keyword) ||
        item.code.toLowerCase().includes(keyword);

      const matchesStatus =
        filterStatus === "ALL" ||
        (filterStatus === "ACTIVE" && item.status === "active") ||
        (filterStatus === "INACTIVE" && item.status === "inactive");

      return matchesSearch && matchesStatus;
    });
  }, [employees, searchTerm, filterStatus]);

  const filteredCustomers = useMemo(() => {
    return customers.filter((item) => {
      const keyword = searchTerm.toLowerCase();
      const matchesSearch =
        item.fullName.toLowerCase().includes(keyword) ||
        item.phoneNumber.toLowerCase().includes(keyword) ||
        item.email.toLowerCase().includes(keyword) ||
        item.tierName.toLowerCase().includes(keyword);

      const matchesStatus =
        filterStatus === "ALL" ||
        (filterStatus === "ACTIVE" && item.status === "active") ||
        (filterStatus === "INACTIVE" && item.status === "inactive");

      return matchesSearch && matchesStatus;
    });
  }, [customers, searchTerm, filterStatus]);

  async function handleCreateStaff(payload: EmployeeForm) {
    const token = getToken();

    try {
      setSubmitting(true);

      await fetchJson(
        `${apiBaseUrl}/api/User/staff`,
        {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: JSON.stringify({
            fullName: payload.fullName,
            phone: payload.phoneNumber,
            email: payload.email,
            position: payload.roleName,
          }),
        }
      );

      setShowCreateModal(false);
      await loadStaff(1);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Không thể tạo nhân viên");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleViewStaff(employee: EmployeeRow) {
    try {
      setDetailLoading(true);
      const detail = await getStaffDetail(employee.id);
      setSelectedEmployee(employee);
      setSelectedDetail(detail);
      setShowViewModal(true);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Không thể tải chi tiết nhân viên");
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleViewCustomer(customerId: number) {
    try {
      setDetailLoading(true);
      const detail = await getCustomerDetail(customerId);
      setSelectedCustomerDetail(detail);
      setShowCustomerViewModal(true);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Không thể tải chi tiết khách hàng");
    } finally {
      setDetailLoading(false);
    }
  }

  function openStatusModal(employee: EmployeeRow, mode: "lock" | "unlock") {
    setSelectedEmployee(employee);
    setStatusMode(mode);
    setShowStatusModal(true);
  }

  async function handleChangeStatus() {
    if (!selectedEmployee) return;

    const token = getToken();
    const action = statusMode === "lock" ? "lock" : "unlock";

    try {
      setStatusSubmitting(true);

      await fetchJson(
        `${apiBaseUrl}/api/User/staff/${selectedEmployee.id}/${action}`,
        {
          method: "PUT",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      setShowStatusModal(false);
      setSelectedEmployee(null);
      await loadStaff(1);
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : `Không thể ${statusMode === "lock" ? "khóa" : "mở khóa"} nhân viên`
      );
    } finally {
      setStatusSubmitting(false);
    }
  }

  return (
    <>
      <div>
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>Quản lý người dùng</h1>
            <p className={styles.pageSubtitle}>
              Quản lý danh sách nhân viên và khách hàng.
            </p>
          </div>

          {activeTab === "employee" && (
            <button className={styles.btnAdd} onClick={() => setShowCreateModal(true)}>
              + Thêm nhân viên mới
            </button>
          )}
        </div>

        <div className={styles.card} style={{ padding: "1rem" }}>
          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              marginBottom: "1rem",
              borderBottom: "1px solid #e2e8f0",
              paddingBottom: "0.75rem",
              flexWrap: "wrap",
            }}
          >
            <button
              className={
                activeTab === "employee" ? styles.btnPrimary : styles.btnSecondary
              }
              onClick={() => setActiveTab("employee")}
            >
              Nhân viên ({staffMeta.totalRecords})
            </button>

            <button
              className={
                activeTab === "customer" ? styles.btnPrimary : styles.btnSecondary
              }
              onClick={() => setActiveTab("customer")}
            >
              Khách hàng ({customerMeta.totalRecords})
            </button>
          </div>

          <div className={styles.filterBar}>
            <input
              type="text"
              className={styles.searchInput}
              placeholder={
                activeTab === "employee"
                  ? "Tìm kiếm theo tên, mã, SĐT, email..."
                  : "Tìm kiếm theo tên, SĐT, email, hạng..."
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <select
              className={styles.filterSelect}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang hoạt động</option>
              <option value="INACTIVE">Đã khóa</option>
            </select>
          </div>

          {error ? (
            <div className={styles.modalError} style={{ marginBottom: "1rem" }}>
              {error}
            </div>
          ) : null}

          {activeTab === "employee" ? (
            <div className={styles.tableWrap} style={{ marginBottom: 0 }}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.colNarrow}>#</th>
                    <th>Nhân viên</th>
                    <th className={styles.colMedium}>Mã NV</th>
                    <th className={styles.colMedium}>Số điện thoại</th>
                    <th className={styles.colMedium}>Vị trí</th>
                    <th className={styles.colCompact}>Ngày vào làm</th>
                    <th className={styles.colCompact}>Trạng thái</th>
                    <th className={styles.colCompact}>Thao tác</th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={8} className={styles.loading}>
                        Đang tải dữ liệu...
                      </td>
                    </tr>
                  ) : filteredEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={8} className={styles.empty}>
                        Không có dữ liệu phù hợp
                      </td>
                    </tr>
                  ) : (
                    filteredEmployees.map((item, index) => (
                      <tr key={item.id}>
                        <td>{index + 1}</td>
                        <td>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.75rem",
                            }}
                          >
                            <div
                              style={{
                                width: 36,
                                height: 36,
                                borderRadius: "50%",
                                background: "#dbeafe",
                                color: "#2563eb",
                                fontWeight: 700,
                                fontSize: "0.8rem",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                              }}
                            >
                              {getInitials(item.fullName)}
                            </div>
                            <div>
                              <div
                                style={{
                                  fontWeight: 700,
                                  color: "#0f172a",
                                  marginBottom: 2,
                                }}
                              >
                                {item.fullName}
                              </div>
                              <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
                                {item.email || "Chưa có email"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>{item.code}</td>
                        <td>{item.phoneNumber || "Chưa có SĐT"}</td>
                        <td>{item.roleName}</td>
                        <td>{formatDate(item.hireDate)}</td>
                        <td>
                          <span
                            className={`${styles.badge} ${
                              item.status === "active"
                                ? styles.badgeActive
                                : styles.badgeInactive
                            }`}
                          >
                            {item.status === "active" ? "Đang hoạt động" : "Đã khóa"}
                          </span>
                        </td>
                        <td>
                          <div className={styles.btnRow}>
                            <button
                              className={styles.btnEdit}
                              onClick={() => handleViewStaff(item)}
                              disabled={detailLoading}
                            >
                              Xem
                            </button>

                            {item.status === "active" ? (
                              <button
                                className={styles.btnDelete}
                                onClick={() => openStatusModal(item, "lock")}
                              >
                                Khóa
                              </button>
                            ) : (
                              <button
                                className={styles.btnSave}
                                onClick={() => openStatusModal(item, "unlock")}
                              >
                                Mở khóa
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              <div className={styles.pagination}>
                <div className={styles.pageInfo}>
                  Hiển thị {filteredEmployees.length} / {staffMeta.totalRecords} bản ghi
                </div>

                <div className={styles.paginationControls}>
                  <button className={`${styles.pageBtn} ${styles.pageBtnActive}`}>
                    {staffMeta.pageNumber}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className={styles.tableWrap} style={{ marginBottom: 0 }}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.colNarrow}>#</th>
                    <th>Khách hàng</th>
                    <th className={styles.colMedium}>Số điện thoại</th>
                    <th className={styles.colMedium}>Hạng thẻ</th>
                    <th className={styles.colCompact}>Điểm tích lũy</th>
                    <th className={styles.colCompact}>Ngày tạo</th>
                    <th className={styles.colCompact}>Trạng thái</th>
                    <th className={styles.colCompact}>Thao tác</th>
                  </tr>
                </thead>

                <tbody>
                  {loading || customerLoading ? (
                    <tr>
                      <td colSpan={8} className={styles.loading}>
                        Đang tải dữ liệu...
                      </td>
                    </tr>
                  ) : filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className={styles.empty}>
                        Không có dữ liệu khách hàng phù hợp
                      </td>
                    </tr>
                  ) : (
                    filteredCustomers.map((item, index) => (
                      <tr key={item.id}>
                        <td>{index + 1}</td>
                        <td>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.75rem",
                            }}
                          >
                            <div
                              style={{
                                width: 36,
                                height: 36,
                                borderRadius: "50%",
                                background: "#f3e8ff",
                                color: "#9333ea",
                                fontWeight: 700,
                                fontSize: "0.8rem",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                              }}
                            >
                              {getInitials(item.fullName)}
                            </div>
                            <div>
                              <div
                                style={{
                                  fontWeight: 700,
                                  color: "#0f172a",
                                  marginBottom: 2,
                                }}
                              >
                                {item.fullName}
                              </div>
                              <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
                                {item.email || "Chưa có email"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>{item.phoneNumber || "Chưa có SĐT"}</td>
                        <td>{item.tierName}</td>
                        <td>{item.loyaltyPoints.toLocaleString("vi-VN")} pts</td>
                        <td>{formatDate(item.createdAt)}</td>
                        <td>
                          <span
                            className={`${styles.badge} ${
                              item.status === "active"
                                ? styles.badgeActive
                                : styles.badgeInactive
                            }`}
                          >
                            {item.status === "active" ? "Đang hoạt động" : "Đã khóa"}
                          </span>
                        </td>
                        <td>
                          <div className={styles.btnRow}>
                            <button
                              className={styles.btnEdit}
                              onClick={() => handleViewCustomer(item.id)}
                              disabled={detailLoading}
                            >
                              Xem
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              <div className={styles.pagination}>
                <div className={styles.pageInfo}>
                  Hiển thị {filteredCustomers.length} / {customerMeta.totalRecords} bản ghi
                </div>

                <div className={styles.paginationControls}>
                  <button className={`${styles.pageBtn} ${styles.pageBtnActive}`}>
                    {customerMeta.pageNumber}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <CreateStaffModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateStaff}
          submitting={submitting}
        />
      )}

      {showViewModal && selectedDetail && (
        <ViewStaffModal
          detail={selectedDetail}
          onClose={() => {
            setShowViewModal(false);
            setSelectedDetail(null);
          }}
        />
      )}

      {showCustomerViewModal && selectedCustomerDetail && (
        <ViewCustomerModal
          detail={selectedCustomerDetail}
          onClose={() => {
            setShowCustomerViewModal(false);
            setSelectedCustomerDetail(null);
          }}
        />
      )}

      {showStatusModal && selectedEmployee && (
        <ConfirmStatusModal
          employee={selectedEmployee}
          mode={statusMode}
          onClose={() => {
            setShowStatusModal(false);
            setSelectedEmployee(null);
          }}
          onConfirm={handleChangeStatus}
          submitting={statusSubmitting}
        />
      )}
    </>
  );
}