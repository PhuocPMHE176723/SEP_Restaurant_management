"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getTables,
  createTable,
  updateTable,
  deleteTable,
  cleanupTables,
  type DiningTable,
  type CreateDiningTableRequest,
  type UpdateDiningTableRequest,
} from "../../../lib/api/admin";
import styles from "../manager.module.css";
import { Trash2, Eraser } from "lucide-react";
import Swal from "sweetalert2";

const STATUSES = ["AVAILABLE", "OCCUPIED", "RESERVED"];

function statusBadge(status: string, isActive: boolean) {
  if (!isActive)
    return (
      <span className={`${styles.statusBadge} ${styles.statusClosed}`}>
        Ngừng hoạt động
      </span>
    );
  const cls =
    status === "AVAILABLE"
      ? styles.statusPublished
      : status === "OCCUPIED"
        ? styles.statusCancelled
        : styles.statusPending;
  const label =
    status === "AVAILABLE"
      ? "Trống"
      : status === "OCCUPIED"
        ? "Đang dùng"
        : "Đã đặt";
  return <span className={`${styles.statusBadge} ${cls}`}>{label}</span>;
}

// ── Create Modal ─────────────────────────────────────────────────
function CreateModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<CreateDiningTableRequest>({
    tableCode: "",
    tableName: "",
    capacity: 4,
    status: "AVAILABLE",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!form.tableCode.trim()) {
      setError("Mã bàn không được để trống");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await createTable(form);
      onSaved();
      onClose();
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className={styles.modalOverlay}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={styles.modal}>
        <div className={styles.modalHead}>
          <span className={styles.modalTitle}>Thêm bàn mới</span>
          <button className={styles.modalClose} onClick={onClose}>
            ✕
          </button>
        </div>
        <div className={styles.modalBody}>
          {error && <div className={styles.modalError}>{error}</div>}
          <div className={styles.field}>
            <label className={styles.label}>Mã bàn *</label>
            <input
              id="create-tableCode"
              className={styles.input}
              placeholder="VD: T01"
              value={form.tableCode}
              onChange={(e) => setForm({ ...form, tableCode: e.target.value })}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Tên bàn</label>
            <input
              id="create-tableName"
              className={styles.input}
              placeholder="VD: Bàn VIP 01"
              value={form.tableName ?? ""}
              onChange={(e) => setForm({ ...form, tableName: e.target.value })}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Sức chứa (người)</label>
            <select
              id="create-capacity"
              className={styles.select}
              value={form.capacity}
              onChange={(e) =>
                setForm({ ...form, capacity: Number(e.target.value) })
              }
            >
              {[4, 6, 8].map((n) => (
                <option key={n} value={n}>
                  {n} chỗ
                </option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Trạng thái</label>
            <select
              id="create-status"
              className={styles.select}
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className={styles.modalFoot}>
          <button className={styles.btnCancel} onClick={onClose}>
            Huỷ
          </button>
          <button
            id="create-save"
            className={styles.btnSave}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Đang lưu..." : "Lưu"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Edit Modal ───────────────────────────────────────────────────
function EditModal({
  table,
  onClose,
  onSaved,
}: {
  table: DiningTable;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<UpdateDiningTableRequest>({
    tableCode: table.tableCode,
    tableName: table.tableName ?? "",
    capacity: table.capacity,
    status: table.status,
    isActive: table.isActive,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await updateTable(table.tableId, form);
      onSaved();
      onClose();
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className={styles.modalOverlay}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={styles.modal}>
        <div className={styles.modalHead}>
          <span className={styles.modalTitle}>Sửa bàn — {table.tableCode}</span>
          <button className={styles.modalClose} onClick={onClose}>
            ✕
          </button>
        </div>
        <div className={styles.modalBody}>
          {error && <div className={styles.modalError}>{error}</div>}
          <div className={styles.field}>
            <label className={styles.label}>Mã bàn</label>
            <input
              className={styles.input}
              value={form.tableCode ?? ""}
              onChange={(e) => setForm({ ...form, tableCode: e.target.value })}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Tên bàn</label>
            <input
              className={styles.input}
              value={form.tableName ?? ""}
              onChange={(e) => setForm({ ...form, tableName: e.target.value })}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Sức chứa</label>
            <select
              className={styles.select}
              value={form.capacity ?? table.capacity}
              onChange={(e) =>
                setForm({ ...form, capacity: Number(e.target.value) })
              }
            >
              {[4, 6, 8].map((n) => (
                <option key={n} value={n}>
                  {n} chỗ
                </option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Trạng thái</label>
            <select
              className={styles.select}
              value={form.status ?? table.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <label className={styles.checkRow}>
            <input
              type="checkbox"
              checked={form.isActive ?? table.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            />
            Còn hoạt động
          </label>
        </div>
        <div className={styles.modalFoot}>
          <button className={styles.btnCancel} onClick={onClose}>
            Huỷ
          </button>
          <button
            className={styles.btnSave}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Đang lưu..." : "Lưu"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Delete Modal ─────────────────────────────────────────────────
function DeleteModal({
  table,
  onClose,
  onSaved,
}: {
  table: DiningTable;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  async function handleDelete() {
    setSaving(true);
    try {
      await deleteTable(table.tableId);
      onSaved();
      onClose();
    } catch {
      /* ignore */
    } finally {
      setSaving(false);
    }
  }
  return (
    <div
      className={styles.modalOverlay}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={styles.modal}>
        <div className={styles.modalHead}>
          <span className={styles.modalTitle}>Xác nhận vô hiệu hoá</span>
          <button className={styles.modalClose} onClick={onClose}>
            ✕
          </button>
        </div>
        <div className={styles.deleteBody}>
          <p className={styles.deleteMsg}>
            Bạn chắc muốn vô hiệu hoá bàn <strong>{table.tableCode}</strong>?
            <br />
            Bàn sẽ bị đánh dấu không hoạt động.
          </p>
        </div>
        <div className={styles.modalFoot}>
          <button className={styles.btnCancel} onClick={onClose}>
            Huỷ
          </button>
          <button
            className={styles.btnDanger}
            onClick={handleDelete}
            disabled={saving}
          >
            {saving ? "Đang xử lý..." : "Vô hiệu hoá"}
          </button>
        </div>
      </div>
    </div>
  );
}

import { useRouter, useSearchParams } from "next/navigation";

// ── Page ─────────────────────────────────────────────────────────
export default function DiningTablesPage() {
  const searchParams = useSearchParams();
  const action = searchParams.get("action");

  const [tables, setTables] = useState<DiningTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [cleaning, setCleaning] = useState(false);
  const [modal, setModal] = useState<{
    type: "create" | "edit" | "delete";
    table?: DiningTable;
  } | null>(null);

  // Filter & Pagination state
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL"); // ALL, AVAILABLE, OCCUPIED, RESERVED
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setTables(await getTables());
    } catch {
      setTables([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCleanup = async () => {
    const result = await Swal.fire({
      title: "Dọn dẹp bàn & đơn hàng?",
      text: "Hệ thống sẽ tự động hủy các đơn hàng từ những ngày trước và giải phóng toàn bộ bàn đang trống (không có khách thực tế). Bạn có chắc chắn muốn thực hiện?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "var(--brand-primary)",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Đồng ý dọn dẹp",
      cancelButtonText: "Hủy",
      background: "#fff",
      color: "#0f172a",
    });

    if (result.isConfirmed) {
      setCleaning(true);
      try {
        const res = await cleanupTables();
        await Swal.fire({
          title: "Hoàn tất dọn dẹp",
          html: `
            <div style="text-align: left; padding: 0.5rem;">
              <p>Đã hủy <b>${res.ordersCancelled}</b> đơn hàng cũ.</p>
              <p>Đã dọn dẹp <b>${res.reservationsCleared}</b> đặt bàn quá hạn.</p>
              <p>Đã giải phóng <b>${res.tablesReleased}</b> bàn đang bị kẹt.</p>
            </div>
          `,
          icon: "success",
          confirmButtonColor: "var(--brand-primary)",
        });
        await load();
      } catch (err: any) {
        Swal.fire("Lỗi", err.message || "Không thể thực hiện dọn dẹp", "error");
      } finally {
        setCleaning(false);
      }
    }
  };

  useEffect(() => {
    if (action === "cleanup") {
      void handleCleanup();
    }
  }, [action]);

  // Derived state
  const filteredItems = tables.filter((t) => {
    const matchSearch =
      t.tableCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.tableName || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === "ALL" || t.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  return (
    <>
      <div className={styles.contentCard}>
        <div className={styles.cardHeader}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <h1 className={styles.cardTitle}>Quản lý bàn ăn</h1>
              <p className={styles.pageSubtitle}>
                Danh sách bàn — {tables.length} bàn
              </p>
            </div>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                className={styles.btnSecondary}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.75rem 1.25rem",
                  borderColor: "#e2e8f0",
                }}
                onClick={handleCleanup}
                disabled={cleaning}
              >
                {cleaning ? "Đang dọn dẹp..." : "Dọn dẹp bàn & đơn cũ"}
              </button>
              <button
                id="add-table-btn"
                className={styles.btnAdd}
                onClick={() => setModal({ type: "create" })}
              >
                + Thêm bàn
              </button>
            </div>
          </div>
        </div>

        <div className={styles.cardBody}>
          <div className={styles.filterBar}>
            <div className={styles.searchGroup}>
              <svg className={styles.searchIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Tìm theo mã bàn, tên bàn..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            <div className={styles.filterGroup}>
              <select
                className={styles.selectFilter}
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="AVAILABLE">Trống</option>
                <option value="OCCUPIED">Đang dùng</option>
                <option value="RESERVED">Đã đặt</option>
              </select>

              {(searchTerm || filterStatus !== "ALL") && (
                <button 
                  className={styles.btnSecondary}
                  style={{ padding: '0.625rem 1rem', fontSize: '0.85rem' }}
                  onClick={() => {
                    setSearchTerm("");
                    setFilterStatus("ALL");
                  }}
                >
                  Xoá lọc
                </button>
              )}
            </div>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Mã bàn</th>
                  <th>Tên bàn</th>
                  <th>Sức chứa</th>
                  <th>Trạng thái</th>
                  <th>Hoạt động</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className={styles.loading}>
                      Đang tải...
                    </td>
                  </tr>
                ) : paginatedItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className={styles.empty}>
                      Chưa có bàn nào phù hợp
                    </td>
                  </tr>
                ) : (
                  paginatedItems.map((t, i) => (
                    <tr key={t.tableId}>
                      <td>{(currentPage - 1) * itemsPerPage + i + 1}</td>
                      <td>
                        <strong>{t.tableCode}</strong>
                      </td>
                      <td>{t.tableName ?? "—"}</td>
                      <td>{t.capacity} người</td>
                      <td>{statusBadge(t.status, t.isActive)}</td>
                      <td>
                        <span
                          className={`${styles.badge} ${t.isActive ? styles.badgeActive : styles.badgeInactive}`}
                        >
                          {t.isActive ? "Có" : "Không"}
                        </span>
                      </td>
                      <td>
                        <div className={styles.btnRow}>
                          <button
                            className={styles.btnEdit}
                            onClick={() => setModal({ type: "edit", table: t })}
                          >
                            Sửa
                          </button>
                          <button
                            className={styles.btnDelete}
                            onClick={() =>
                              setModal({ type: "delete", table: t })
                            }
                          >
                            Xoá
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className={styles.pagination}>
              <div className={styles.paginationInfo}>
                Hiển thị <b>{Math.min(filteredItems.length, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(filteredItems.length, currentPage * itemsPerPage)}</b> trên tổng số <b>{filteredItems.length}</b> bàn
              </div>
              
              <button
                className={styles.pageBtn}
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
              >
                &laquo;
              </button>
              
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i + 1}
                  className={`${styles.pageBtn} ${currentPage === i + 1 ? styles.activePage : ""}`}
                  onClick={() => setCurrentPage(i + 1)}
                >
                  {i + 1}
                </button>
              ))}

              <button
                className={styles.pageBtn}
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
              >
                &raquo;
              </button>
            </div>
          )}
        </div>
      </div>

      {modal?.type === "create" && (
        <CreateModal onClose={() => setModal(null)} onSaved={load} />
      )}
      {modal?.type === "edit" && modal.table && (
        <EditModal
          table={modal.table}
          onClose={() => setModal(null)}
          onSaved={load}
        />
      )}
      {modal?.type === "delete" && modal.table && (
        <DeleteModal
          table={modal.table}
          onClose={() => setModal(null)}
          onSaved={load}
        />
      )}
    </>
  );
}
