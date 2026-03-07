"use client";

import { useCallback, useEffect, useState } from "react";
import {
    getTables, createTable, updateTable, deleteTable,
    type DiningTable, type CreateDiningTableRequest, type UpdateDiningTableRequest,
} from "../../../lib/api/admin";
import styles from "../manager.module.css";

const STATUSES = ["AVAILABLE", "OCCUPIED", "RESERVED"];

function statusBadge(status: string, isActive: boolean) {
    if (!isActive) return <span className={`${styles.badge} ${styles.badgeInactive}`}>Ngừng hoạt động</span>;
    const cls = status === "AVAILABLE" ? styles.badgeAvailable
        : status === "OCCUPIED" ? styles.badgeOccupied
            : styles.badgeReserved;
    const label = status === "AVAILABLE" ? "Trống" : status === "OCCUPIED" ? "Đang dùng" : "Đã đặt";
    return <span className={`${styles.badge} ${cls}`}>{label}</span>;
}

// ── Create Modal ─────────────────────────────────────────────────
function CreateModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
    const [form, setForm] = useState<CreateDiningTableRequest>({ tableCode: "", tableName: "", capacity: 4, status: "AVAILABLE" });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSave() {
        if (!form.tableCode.trim()) { setError("Mã bàn không được để trống"); return; }
        setSaving(true); setError(null);
        try { await createTable(form); onSaved(); onClose(); }
        catch (e: unknown) { setError((e as Error).message); }
        finally { setSaving(false); }
    }

    return (
        <div className={styles.modalOverlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className={styles.modal}>
                <div className={styles.modalHead}>
                    <span className={styles.modalTitle}>Thêm bàn mới</span>
                    <button className={styles.modalClose} onClick={onClose}>✕</button>
                </div>
                <div className={styles.modalBody}>
                    {error && <div className={styles.modalError}>{error}</div>}
                    <div className={styles.field}>
                        <label className={styles.label}>Mã bàn *</label>
                        <input id="create-tableCode" className={styles.input} placeholder="VD: T01" value={form.tableCode}
                            onChange={(e) => setForm({ ...form, tableCode: e.target.value })} />
                    </div>
                    <div className={styles.field}>
                        <label className={styles.label}>Tên bàn</label>
                        <input id="create-tableName" className={styles.input} placeholder="VD: Bàn VIP 01" value={form.tableName ?? ""}
                            onChange={(e) => setForm({ ...form, tableName: e.target.value })} />
                    </div>
                    <div className={styles.field}>
                        <label className={styles.label}>Sức chứa (người)</label>
                        <input id="create-capacity" className={styles.input} type="number" min={1} value={form.capacity}
                            onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} />
                    </div>
                    <div className={styles.field}>
                        <label className={styles.label}>Trạng thái</label>
                        <select id="create-status" className={styles.select} value={form.status}
                            onChange={(e) => setForm({ ...form, status: e.target.value })}>
                            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                </div>
                <div className={styles.modalFoot}>
                    <button className={styles.btnCancel} onClick={onClose}>Huỷ</button>
                    <button id="create-save" className={styles.btnSave} onClick={handleSave} disabled={saving}>
                        {saving ? "Đang lưu..." : "Lưu"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Edit Modal ───────────────────────────────────────────────────
function EditModal({ table, onClose, onSaved }: { table: DiningTable; onClose: () => void; onSaved: () => void }) {
    const [form, setForm] = useState<UpdateDiningTableRequest>({
        tableCode: table.tableCode, tableName: table.tableName ?? "", capacity: table.capacity,
        status: table.status, isActive: table.isActive,
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSave() {
        setSaving(true); setError(null);
        try { await updateTable(table.tableId, form); onSaved(); onClose(); }
        catch (e: unknown) { setError((e as Error).message); }
        finally { setSaving(false); }
    }

    return (
        <div className={styles.modalOverlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className={styles.modal}>
                <div className={styles.modalHead}>
                    <span className={styles.modalTitle}>Sửa bàn — {table.tableCode}</span>
                    <button className={styles.modalClose} onClick={onClose}>✕</button>
                </div>
                <div className={styles.modalBody}>
                    {error && <div className={styles.modalError}>{error}</div>}
                    <div className={styles.field}>
                        <label className={styles.label}>Mã bàn</label>
                        <input className={styles.input} value={form.tableCode ?? ""} onChange={(e) => setForm({ ...form, tableCode: e.target.value })} />
                    </div>
                    <div className={styles.field}>
                        <label className={styles.label}>Tên bàn</label>
                        <input className={styles.input} value={form.tableName ?? ""} onChange={(e) => setForm({ ...form, tableName: e.target.value })} />
                    </div>
                    <div className={styles.field}>
                        <label className={styles.label}>Sức chứa</label>
                        <input className={styles.input} type="number" min={1} value={form.capacity ?? table.capacity}
                            onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} />
                    </div>
                    <div className={styles.field}>
                        <label className={styles.label}>Trạng thái</label>
                        <select className={styles.select} value={form.status ?? table.status}
                            onChange={(e) => setForm({ ...form, status: e.target.value })}>
                            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <label className={styles.checkRow}>
                        <input type="checkbox" checked={form.isActive ?? table.isActive}
                            onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                        Còn hoạt động
                    </label>
                </div>
                <div className={styles.modalFoot}>
                    <button className={styles.btnCancel} onClick={onClose}>Huỷ</button>
                    <button className={styles.btnSave} onClick={handleSave} disabled={saving}>
                        {saving ? "Đang lưu..." : "Lưu"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Delete Modal ─────────────────────────────────────────────────
function DeleteModal({ table, onClose, onSaved }: { table: DiningTable; onClose: () => void; onSaved: () => void }) {
    const [saving, setSaving] = useState(false);
    async function handleDelete() {
        setSaving(true);
        try { await deleteTable(table.tableId); onSaved(); onClose(); }
        catch { /* ignore */ }
        finally { setSaving(false); }
    }
    return (
        <div className={styles.modalOverlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className={styles.modal}>
                <div className={styles.modalHead}>
                    <span className={styles.modalTitle}>Xác nhận vô hiệu hoá</span>
                    <button className={styles.modalClose} onClick={onClose}>✕</button>
                </div>
                <div className={styles.deleteBody}>
                    <div className={styles.deleteIcon}>🗑️</div>
                    <p className={styles.deleteMsg}>Bạn chắc muốn vô hiệu hoá bàn <strong>{table.tableCode}</strong>?<br />Bàn sẽ bị đánh dấu không hoạt động.</p>
                </div>
                <div className={styles.modalFoot}>
                    <button className={styles.btnCancel} onClick={onClose}>Huỷ</button>
                    <button className={styles.btnDanger} onClick={handleDelete} disabled={saving}>{saving ? "Đang xử lý..." : "Vô hiệu hoá"}</button>
                </div>
            </div>
        </div>
    );
}

// ── Page ─────────────────────────────────────────────────────────
export default function DiningTablesPage() {
    const [tables, setTables] = useState<DiningTable[]>([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState<{ type: "create" | "edit" | "delete"; table?: DiningTable } | null>(null);

    // Filter & Pagination state
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("ALL"); // ALL, AVAILABLE, OCCUPIED, RESERVED
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    const load = useCallback(async () => {
        setLoading(true);
        try { setTables(await getTables()); }
        catch { setTables([]); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { void load(); }, [load]);

    // Derived state
    const filteredItems = tables.filter(t => {
        const matchSearch = t.tableCode.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (t.tableName || "").toLowerCase().includes(searchTerm.toLowerCase());
        const matchStatus = filterStatus === "ALL" || t.status === filterStatus;
        return matchSearch && matchStatus;
    });

    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
    const paginatedItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <>
            <div className={styles.contentCard}>
                <div className={styles.cardHeader}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                            <h1 className={styles.cardTitle}>Quản lý bàn ăn</h1>
                            <p className={styles.pageSubtitle}>Danh sách bàn — {tables.length} bàn</p>
                        </div>
                        <button id="add-table-btn" className={styles.btnAdd} onClick={() => setModal({ type: "create" })}>
                            + Thêm bàn
                        </button>
                    </div>
                </div>

                <div className={styles.cardBody}>
                    <div className={styles.filterBar}>
                        <input 
                            type="text" 
                            className={styles.searchInput}
                            placeholder="Tìm theo mã bàn, tên bàn..." 
                            value={searchTerm} 
                            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }} 
                        />
                        <select 
                            className={styles.input} 
                            style={{ width: "auto" }}
                            value={filterStatus} 
                            onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                        >
                            <option value="ALL">Tất cả trạng thái</option>
                            <option value="AVAILABLE">Trống</option>
                            <option value="OCCUPIED">Đang dùng</option>
                            <option value="RESERVED">Đã đặt</option>
                        </select>
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
                            <tr><td colSpan={7} className={styles.loading}>Đang tải...</td></tr>
                        ) : paginatedItems.length === 0 ? (
                            <tr><td colSpan={7} className={styles.empty}>Chưa có bàn nào phù hợp</td></tr>
                        ) : paginatedItems.map((t, i) => (
                            <tr key={t.tableId}>
                                <td>{(currentPage - 1) * itemsPerPage + i + 1}</td>
                                <td><strong>{t.tableCode}</strong></td>
                                <td>{t.tableName ?? "—"}</td>
                                <td>{t.capacity} người</td>
                                <td>{statusBadge(t.status, t.isActive)}</td>
                                <td>
                                    <span className={`${styles.badge} ${t.isActive ? styles.badgeActive : styles.badgeInactive}`}>
                                        {t.isActive ? "Có" : "Không"}
                                    </span>
                                </td>
                                <td>
                                    <div className={styles.btnRow}>
                                        <button className={styles.btnEdit} onClick={() => setModal({ type: "edit", table: t })}>Sửa</button>
                                        <button className={styles.btnDelete} onClick={() => setModal({ type: "delete", table: t })}>Xoá</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                    </div>
                    {totalPages > 1 && (
                        <div className={styles.pagination}>
                            <div className={styles.pageInfo}>
                                Hiển thị từ {(currentPage - 1) * itemsPerPage + 1} đến {Math.min(currentPage * itemsPerPage, filteredItems.length)} trong {filteredItems.length} bàn ăn
                            </div>
                            <div className={styles.paginationControls}>
                                <button className={styles.pageBtn} disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
                                    Trước
                                </button>
                                <button className={styles.pageBtn} disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>
                                    Sau
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {modal?.type === "create" && <CreateModal onClose={() => setModal(null)} onSaved={load} />}
            {modal?.type === "edit" && modal.table && <EditModal table={modal.table} onClose={() => setModal(null)} onSaved={load} />}
            {modal?.type === "delete" && modal.table && <DeleteModal table={modal.table} onClose={() => setModal(null)} onSaved={load} />}
        </>
    );
}
