"use client";

import { useEffect, useState } from "react";

import managerStyles from "../manager.module.css";
import userStyles from "./user.module.css";

import {
  createStaff,
  getCustomerDetail,
  getCustomerList,
  getStaffDetail,
  getStaffList,
  lockStaff,
  unlockStaff,
} from "../../../lib/api/userlist";

import {
  ROLE_OPTIONS,
  formatDate,
  getInitials,
  getRoleLabel,
  mapCustomerToRow,
  mapStaffToRow,
} from "./helper";

import {
  CustomerApiItem,
  CustomerRow,
  EmployeeForm,
  EmployeeRow,
  StaffApiItem,
} from "../../../types/models/user";

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
      className={managerStyles.modalOverlay}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={managerStyles.modal}>
        <div className={managerStyles.modalHead}>
          <h3 className={managerStyles.modalTitle}>Thêm nhân viên mới</h3>
          <button
            type="button"
            onClick={onClose}
            className={userStyles.iconClose}
          >
            ×
          </button>
        </div>

        <div className={managerStyles.modalBody}>
          {error && <div className={managerStyles.modalError}>{error}</div>}

          <div className={managerStyles.field}>
            <label className={managerStyles.label}>Họ và tên *</label>
            <input
              className={managerStyles.input}
              placeholder="Nhập tên nhân viên..."
              value={form.fullName}
              onChange={(e) => handleChange("fullName", e.target.value)}
            />
          </div>

          <div className={userStyles.infoGrid}>
            <div className={managerStyles.field}>
              <label className={managerStyles.label}>Số điện thoại *</label>
              <input
                className={managerStyles.input}
                placeholder="09xx..."
                value={form.phoneNumber}
                onChange={(e) => handleChange("phoneNumber", e.target.value)}
              />
            </div>

            <div className={managerStyles.field}>
              <label className={managerStyles.label}>Vị trí</label>
              <select
                className={managerStyles.select}
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

          <div className={managerStyles.field}>
            <label className={managerStyles.label}>Email *</label>
            <input
              className={managerStyles.input}
              placeholder="example@restaurant.com"
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
            />
          </div>
        </div>

        <div className={managerStyles.modalFoot}>
          <button
            type="button"
            className={managerStyles.btnCancel}
            onClick={onClose}
          >
            Hủy
          </button>
          <button
            type="button"
            className={managerStyles.btnSave}
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
      className={managerStyles.modalOverlay}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={managerStyles.modal}>
        <div className={managerStyles.modalHead}>
          <h3 className={managerStyles.modalTitle}>Thông tin nhân viên</h3>
          <button
            type="button"
            onClick={onClose}
            className={userStyles.iconClose}
          >
            ×
          </button>
        </div>

        <div className={managerStyles.modalBody}>
          <div className={managerStyles.field}>
            <label className={managerStyles.label}>Mã nhân viên</label>
            <input
              className={managerStyles.input}
              value={detail.staffCode || ""}
              readOnly
            />
          </div>

          <div className={managerStyles.field}>
            <label className={managerStyles.label}>Họ và tên</label>
            <input
              className={managerStyles.input}
              value={detail.fullName || ""}
              readOnly
            />
          </div>

          <div className={userStyles.infoGrid}>
            <div className={managerStyles.field}>
              <label className={managerStyles.label}>Số điện thoại</label>
              <input
                className={managerStyles.input}
                value={detail.phone || ""}
                readOnly
              />
            </div>

            <div className={managerStyles.field}>
              <label className={managerStyles.label}>Email</label>
              <input
                className={managerStyles.input}
                value={detail.email || ""}
                readOnly
              />
            </div>
          </div>

          <div className={managerStyles.field}>
            <label className={managerStyles.label}>Vị trí</label>
            <input
              className={managerStyles.input}
              value={getRoleLabel(detail.position)}
              readOnly
            />
          </div>

          <div className={userStyles.infoGrid}>
            <div className={managerStyles.field}>
              <label className={managerStyles.label}>Ngày vào làm</label>
              <input
                className={managerStyles.input}
                value={formatDate(detail.hireDate)}
                readOnly
              />
            </div>

            <div className={managerStyles.field}>
              <label className={managerStyles.label}>Trạng thái</label>
              <input
                className={managerStyles.input}
                value={
                  detail.workingStatus === "ACTIVE"
                    ? "Đang hoạt động"
                    : "Đã khóa"
                }
                readOnly
              />
            </div>
          </div>
        </div>

        <div className={managerStyles.modalFoot}>
          <button
            type="button"
            className={managerStyles.btnSave}
            onClick={onClose}
          >
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
      className={managerStyles.modalOverlay}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={managerStyles.modal}>
        <div className={managerStyles.modalHead}>
          <h3 className={managerStyles.modalTitle}>Thông tin khách hàng</h3>
          <button
            type="button"
            onClick={onClose}
            className={userStyles.iconClose}
          >
            ×
          </button>
        </div>

        <div className={managerStyles.modalBody}>
          <div className={managerStyles.field}>
            <label className={managerStyles.label}>Họ và tên</label>
            <input className={managerStyles.input} value={fullName} readOnly />
          </div>

          <div className={userStyles.infoGrid}>
            <div className={managerStyles.field}>
              <label className={managerStyles.label}>Số điện thoại</label>
              <input className={managerStyles.input} value={phone} readOnly />
            </div>

            <div className={managerStyles.field}>
              <label className={managerStyles.label}>Email</label>
              <input
                className={managerStyles.input}
                value={detail.email || ""}
                readOnly
              />
            </div>
          </div>

          <div className={userStyles.infoGrid}>
            <div className={managerStyles.field}>
              <label className={managerStyles.label}>Hạng thành viên</label>
              <input className={managerStyles.input} value={tierName} readOnly />
            </div>

            <div className={managerStyles.field}>
              <label className={managerStyles.label}>Điểm tích lũy</label>
              <input
                className={managerStyles.input}
                value={String(points)}
                readOnly
              />
            </div>
          </div>

          <div className={userStyles.infoGrid}>
            <div className={managerStyles.field}>
              <label className={managerStyles.label}>Ngày tạo</label>
              <input
                className={managerStyles.input}
                value={formatDate(detail.createdAt)}
                readOnly
              />
            </div>

            <div className={managerStyles.field}>
              <label className={managerStyles.label}>Trạng thái</label>
              <input
                className={managerStyles.input}
                value={status === "INACTIVE" ? "Đã khóa" : "Đang hoạt động"}
                readOnly
              />
            </div>
          </div>
        </div>

        <div className={managerStyles.modalFoot}>
          <button
            type="button"
            className={managerStyles.btnSave}
            onClick={onClose}
          >
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
      className={managerStyles.modalOverlay}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={managerStyles.modal} style={{ maxWidth: 460 }}>
        <div className={managerStyles.modalHead}>
          <h3 className={managerStyles.modalTitle}>
            {isLock ? "Xác nhận khóa nhân viên" : "Xác nhận mở khóa nhân viên"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className={userStyles.iconClose}
          >
            ×
          </button>
        </div>

        <div className={managerStyles.modalBody}>
          <div
            className={managerStyles.modalError}
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

        <div className={managerStyles.modalFoot}>
          <button
            type="button"
            className={managerStyles.btnCancel}
            onClick={onClose}
          >
            Hủy
          </button>
          <button
            type="button"
            className={isLock ? managerStyles.btnDelete : managerStyles.btnSave}
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

export default function UserPage() {
  const [activeTab, setActiveTab] = useState<"employee" | "customer">(
    "employee"
  );
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
  const [error, setError] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showCustomerViewModal, setShowCustomerViewModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);

  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeRow | null>(
    null
  );
  const [selectedDetail, setSelectedDetail] = useState<StaffApiItem | null>(
    null
  );
  const [selectedCustomerDetail, setSelectedCustomerDetail] =
    useState<CustomerApiItem | null>(null);
  const [statusMode, setStatusMode] = useState<"lock" | "unlock">("lock");

  const [submitting, setSubmitting] = useState(false);
  const [statusSubmitting, setStatusSubmitting] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  async function loadStaff(page = 1, keyword = searchTerm, status = filterStatus) {
    const json = await getStaffList(page, 10, keyword, status);

    setEmployees(json.data.items.map(mapStaffToRow));
    setStaffMeta({
      pageNumber: json.data.pageNumber,
      pageSize: json.data.pageSize,
      totalRecords: json.data.totalRecords,
      totalPages: json.data.totalPages,
    });
  }

  async function loadCustomers(
    page = 1,
    keyword = searchTerm
  ) {
    const json = await getCustomerList(page, 10, keyword);

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

        if (activeTab === "employee") {
          await loadStaff(1, searchTerm, filterStatus);
        } else {
          await loadCustomers(1, searchTerm);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Không thể tải dữ liệu");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [activeTab]);

  async function handleSearch() {
    try {
      setLoading(true);
      setError("");

      if (activeTab === "employee") {
        await loadStaff(1, searchTerm, filterStatus);
      } else {
        await loadCustomers(1, searchTerm);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tìm kiếm dữ liệu");
    } finally {
      setLoading(false);
    }
  }

  async function handleFilterChange(value: string) {
    try {
      setFilterStatus(value);
      setLoading(true);
      setError("");

      if (activeTab === "employee") {
        await loadStaff(1, searchTerm, value);
      } else {
        await loadCustomers(1, searchTerm);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể lọc dữ liệu");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateStaff(payload: EmployeeForm) {
    try {
      setSubmitting(true);
      await createStaff(payload);
      setShowCreateModal(false);
      await loadStaff(1, searchTerm, filterStatus);
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

    try {
      setStatusSubmitting(true);

      if (statusMode === "lock") {
        await lockStaff(selectedEmployee.id);
      } else {
        await unlockStaff(selectedEmployee.id);
      }

      setShowStatusModal(false);
      setSelectedEmployee(null);
      await loadStaff(staffMeta.pageNumber, searchTerm, filterStatus);
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

  const currentMeta = activeTab === "employee" ? staffMeta : customerMeta;
  const currentItems = activeTab === "employee" ? employees : customers;

  return (
    <>
      <div className={managerStyles.contentCard}>
        <div className={managerStyles.pageHeader}>
          <div>
            <h1 className={managerStyles.pageTitle}>Quản lý người dùng</h1>
            <p className={managerStyles.pageSubtitle}>
              Quản lý danh sách nhân viên và khách hàng.
            </p>
          </div>

          {activeTab === "employee" && (
            <button
              className={managerStyles.btnAdd}
              onClick={() => setShowCreateModal(true)}
            >
              + Thêm nhân viên mới
            </button>
          )}
        </div>

        <div className={userStyles.tabBar}>
          <button
            className={
              activeTab === "employee"
                ? managerStyles.btnPrimary
                : managerStyles.btnSecondary
            }
            onClick={() => setActiveTab("employee")}
          >
            Nhân viên ({staffMeta.totalRecords})
          </button>

          <button
            className={
              activeTab === "customer"
                ? managerStyles.btnPrimary
                : managerStyles.btnSecondary
            }
            onClick={() => setActiveTab("customer")}
          >
            Khách hàng ({customerMeta.totalRecords})
          </button>
        </div>

        <div className={managerStyles.filterBar}>
          <input
            type="text"
            className={managerStyles.searchInput}
            placeholder={
              activeTab === "employee"
                ? "Tìm theo tên, mã, SĐT, email..."
                : "Tìm theo tên, SĐT, email, hạng..."
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch();
            }}
          />

          <select
            className={managerStyles.filterSelect}
            value={filterStatus}
            onChange={(e) => handleFilterChange(e.target.value)}
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="INACTIVE">Đã khóa</option>
          </select>

          <button className={managerStyles.btnPrimary} onClick={handleSearch}>
            Tìm
          </button>
        </div>

        {error ? (
          <div className={managerStyles.modalError} style={{ marginBottom: "1rem" }}>
            {error}
          </div>
        ) : null}

        <div className={managerStyles.tableWrap}>
          <table className={managerStyles.table}>
            <thead>
              {activeTab === "employee" ? (
                <tr>
                  <th className={managerStyles.colNarrow}>#</th>
                  <th>Nhân viên</th>
                  <th className={managerStyles.colMedium}>Mã NV</th>
                  <th className={managerStyles.colMedium}>Số điện thoại</th>
                  <th className={managerStyles.colMedium}>Vị trí</th>
                  <th className={managerStyles.colCompact}>Ngày vào làm</th>
                  <th className={managerStyles.colCompact}>Trạng thái</th>
                  <th className={managerStyles.colCompact}>Thao tác</th>
                </tr>
              ) : (
                <tr>
                  <th className={managerStyles.colNarrow}>#</th>
                  <th>Khách hàng</th>
                  <th className={managerStyles.colMedium}>Số điện thoại</th>
                  <th className={managerStyles.colMedium}>Hạng thẻ</th>
                  <th className={managerStyles.colCompact}>Điểm tích lũy</th>
                  <th className={managerStyles.colCompact}>Ngày tạo</th>
                  <th className={managerStyles.colCompact}>Trạng thái</th>
                  <th className={managerStyles.colCompact}>Thao tác</th>
                </tr>
              )}
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className={managerStyles.loading}>
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : currentItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className={managerStyles.empty}>
                    Không có dữ liệu phù hợp
                  </td>
                </tr>
              ) : activeTab === "employee" ? (
                employees.map((item, index) => (
                  <tr key={item.id}>
                    <td>
                      {(staffMeta.pageNumber - 1) * staffMeta.pageSize + index + 1}
                    </td>
                    <td>
                      <div className={userStyles.userCell}>
                        <div className={`${userStyles.avatar} ${userStyles.employee}`}>
                          {getInitials(item.fullName)}
                        </div>
                        <div>
                          <div className={userStyles.userName}>{item.fullName}</div>
                          <div className={userStyles.userSub}>
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
                        className={`${managerStyles.badge} ${
                          item.status === "active"
                            ? managerStyles.badgeActive
                            : managerStyles.badgeInactive
                        }`}
                      >
                        {item.status === "active" ? "Đang hoạt động" : "Đã khóa"}
                      </span>
                    </td>
                    <td>
                      <div className={managerStyles.btnRow}>
                        <button
                          className={managerStyles.btnEdit}
                          onClick={() => handleViewStaff(item)}
                          disabled={detailLoading}
                        >
                          Xem
                        </button>

                        {item.status === "active" ? (
                          <button
                            className={managerStyles.btnDelete}
                            onClick={() => openStatusModal(item, "lock")}
                          >
                            Khóa
                          </button>
                        ) : (
                          <button
                            className={managerStyles.btnSave}
                            onClick={() => openStatusModal(item, "unlock")}
                          >
                            Mở khóa
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                customers.map((item, index) => (
                  <tr key={item.id}>
                    <td>
                      {(customerMeta.pageNumber - 1) * customerMeta.pageSize +
                        index +
                        1}
                    </td>
                    <td>
                      <div className={userStyles.userCell}>
                        <div className={`${userStyles.avatar} ${userStyles.customer}`}>
                          {getInitials(item.fullName)}
                        </div>
                        <div>
                          <div className={userStyles.userName}>{item.fullName}</div>
                          <div className={userStyles.userSub}>
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
                        className={`${managerStyles.badge} ${
                          item.status === "active"
                            ? managerStyles.badgeActive
                            : managerStyles.badgeInactive
                        }`}
                      >
                        {item.status === "active" ? "Đang hoạt động" : "Đã khóa"}
                      </span>
                    </td>
                    <td>
                      <div className={managerStyles.btnRow}>
                        <button
                          className={managerStyles.btnEdit}
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

          <div className={managerStyles.pagination}>
            <div className={managerStyles.pageInfo}>
              Hiển thị{" "}
              {currentMeta.totalRecords === 0
                ? 0
                : (currentMeta.pageNumber - 1) * currentMeta.pageSize + 1}
              {" - "}
              {Math.min(
                currentMeta.pageNumber * currentMeta.pageSize,
                currentMeta.totalRecords
              )}{" "}
              / {currentMeta.totalRecords} bản ghi
            </div>

            <div className={managerStyles.paginationControls}>
              <button
                className={managerStyles.pageBtn}
                disabled={currentMeta.pageNumber === 1}
                onClick={async () => {
                  try {
                    setLoading(true);
                    if (activeTab === "employee") {
                      await loadStaff(
                        currentMeta.pageNumber - 1,
                        searchTerm,
                        filterStatus
                      );
                    } else {
                      await loadCustomers(
                        currentMeta.pageNumber - 1,
                        searchTerm
                      );
                    }
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                Trước
              </button>

              {Array.from(
                { length: currentMeta.totalPages },
                (_, i) => i + 1
              ).map((page) => (
                <button
                  key={page}
                  className={`${managerStyles.pageBtn} ${
                    page === currentMeta.pageNumber
                      ? managerStyles.pageBtnActive
                      : ""
                  }`}
                  onClick={async () => {
                    try {
                      setLoading(true);
                      if (activeTab === "employee") {
                        await loadStaff(page, searchTerm, filterStatus);
                      } else {
                        await loadCustomers(page, searchTerm);
                      }
                    } finally {
                      setLoading(false);
                    }
                  }}
                >
                  {page}
                </button>
              ))}

              <button
                className={managerStyles.pageBtn}
                disabled={currentMeta.pageNumber === currentMeta.totalPages}
                onClick={async () => {
                  try {
                    setLoading(true);
                    if (activeTab === "employee") {
                      await loadStaff(
                        currentMeta.pageNumber + 1,
                        searchTerm,
                        filterStatus
                      );
                    } else {
                      await loadCustomers(
                        currentMeta.pageNumber + 1,
                        searchTerm
                      );
                    }
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                Sau
              </button>
            </div>
          </div>
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