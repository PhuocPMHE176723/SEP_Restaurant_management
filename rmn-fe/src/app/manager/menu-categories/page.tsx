"use client";

import { useCallback, useEffect, useState } from "react";
import {
    getMenuCategories, createMenuCategory, updateMenuCategory, deleteMenuCategory,
    type MenuCategory, type CreateMenuCategoryRequest, type UpdateMenuCategoryRequest,
} from "../../../lib/api/admin";
import styles from "../manager.module.css";

// ── Create Modal ─────────────────────────────────────────────────
function CreateModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
    const [form, setForm] = useState<CreateMenuCategoryRequest>({ categoryName: "", description: "", displayOrder: 0 });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSave() {
        if (!form.categoryName.trim()) { setError("Tên danh mục không được để trống"); return; }
        setSaving(true); setError(null);
        try { await createMenuCategory(form); onSaved(); onClose(); }
        catch (e: unknown) { setError((e as Error).message); }
        finally { setSaving(false); }
    }

    return (
        <div className={styles.modalOverlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className={styles.modal}>
                <div className={styles.modalHead}>
                    <span className={styles.modalTitle}>Thêm danh mục</span>
                    <button className={styles.modalClose} onClick={onClose}>✕</button>
                </div>
                <div className={styles.modalBody}>
                    {error && <div className={styles.modalError}>{error}</div>}
                    <div className={styles.field}>
                        <label className={styles.label}>Tên danh mục *</label>
                        <input id="create-catName" className={styles.input} placeholder="VD: Khai vị"
                            value={form.categoryName} onChange={(e) => setForm({ ...form, categoryName: e.target.value })} />
                    </div>
                    <div className={styles.field}>
                        <label className={styles.label}>Mô tả</label>
                        <input className={styles.input} placeholder="Mô tả ngắn..."
                            value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                    </div>
                    <div className={styles.field}>
                        <label className={styles.label}>Thứ tự hiển thị</label>
                        <input className={styles.input} type="number" min={0}
                            value={form.displayOrder} onChange={(e) => setForm({ ...form, displayOrder: Number(e.target.value) })} />
                    </div>
                </div>
                <div className={styles.modalFoot}>
                    <button className={styles.btnCancel} onClick={onClose}>Huỷ</button>
                    <button id="create-cat-save" className={styles.btnSave} onClick={handleSave} disabled={saving}>
                        {saving ? "Đang lưu..." : "Lưu"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Edit Modal ───────────────────────────────────────────────────
function EditModal({ cat, onClose, onSaved }: { cat: MenuCategory; onClose: () => void; onSaved: () => void }) {
    const [form, setForm] = useState<UpdateMenuCategoryRequest>({
        categoryName: cat.categoryName, description: cat.description ?? "",
        displayOrder: cat.displayOrder, isActive: cat.isActive,
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSave() {
        setSaving(true); setError(null);
        try { await updateMenuCategory(cat.categoryId, form); onSaved(); onClose(); }
        catch (e: unknown) { setError((e as Error).message); }
        finally { setSaving(false); }
    }

    return (
        <div className={styles.modalOverlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className={styles.modal}>
                <div className={styles.modalHead}>
                    <span className={styles.modalTitle}>Sửa — {cat.categoryName}</span>
                    <button className={styles.modalClose} onClick={onClose}>✕</button>
                </div>
                <div className={styles.modalBody}>
                    {error && <div className={styles.modalError}>{error}</div>}
                    <div className={styles.field}>
                        <label className={styles.label}>Tên danh mục</label>
                        <input className={styles.input} value={form.categoryName ?? ""}
                            onChange={(e) => setForm({ ...form, categoryName: e.target.value })} />
                    </div>
                    <div className={styles.field}>
                        <label className={styles.label}>Mô tả</label>
                        <input className={styles.input} value={form.description ?? ""}
                            onChange={(e) => setForm({ ...form, description: e.target.value })} />
                    </div>
                    <div className={styles.field}>
                        <label className={styles.label}>Thứ tự hiển thị</label>
                        <input className={styles.input} type="number" min={0} value={form.displayOrder ?? cat.displayOrder}
                            onChange={(e) => setForm({ ...form, displayOrder: Number(e.target.value) })} />
                    </div>
                    <label className={styles.checkRow}>
                        <input type="checkbox" checked={form.isActive ?? cat.isActive}
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
function DeleteModal({ cat, onClose, onSaved }: { cat: MenuCategory; onClose: () => void; onSaved: () => void }) {
    const [saving, setSaving] = useState(false);
    async function handleDelete() {
        setSaving(true);
        try { await deleteMenuCategory(cat.categoryId); onSaved(); onClose(); }
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
                    <p className={styles.deleteMsg}>Bạn chắc muốn vô hiệu hoá danh mục <strong>{cat.categoryName}</strong>?</p>
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
export default function MenuCategoriesPage() {
    const [cats, setCats] = useState<MenuCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState<{ type: "create" | "edit" | "delete"; cat?: MenuCategory } | null>(null);

    // Filter & Pagination state
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("ALL");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    const load = useCallback(async () => {
        setLoading(true);
        try { setCats(await getMenuCategories()); }
        catch { setCats([]); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { void load(); }, [load]);

    // Derived state
    const filteredItems = cats.filter(c => {
        const matchSearch = c.categoryName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (c.description || "").toLowerCase().includes(searchTerm.toLowerCase());
        const matchStatus = filterStatus === "ALL" 
            || (filterStatus === "ACTIVE" && c.isActive) 
            || (filterStatus === "INACTIVE" && !c.isActive);
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
                            <h1 className={styles.cardTitle}>Danh mục menu</h1>
                            <p className={styles.pageSubtitle}>Quản lý danh mục — {cats.length} danh mục</p>
                        </div>
                        <button id="add-category-btn" className={styles.btnAdd} onClick={() => setModal({ type: "create" })}>
                            + Thêm danh mục
                        </button>
                    </div>
                </div>

                <div className={styles.cardBody}>
                    <div className={styles.filterBar}>
                        <input 
                            type="text" 
                            className={styles.searchInput}
                            placeholder="Tìm tên, mô tả..." 
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
                            <option value="ACTIVE">Hoạt động</option>
                            <option value="INACTIVE">Ngừng hoạt động</option>
                        </select>
                    </div>

                    <div className={styles.tableWrap}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Tên danh mục</th>
                            <th>Mô tả</th>
                            <th>Thứ tự</th>
                            <th>Trạng thái</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={6} className={styles.loading}>Đang tải...</td></tr>
                        ) : paginatedItems.length === 0 ? (
                            <tr><td colSpan={6} className={styles.empty}>Chưa có danh mục nào phù hợp</td></tr>
                        ) : paginatedItems.map((c, i) => (
                            <tr key={c.categoryId}>
                                <td>{(currentPage - 1) * itemsPerPage + i + 1}</td>
                                <td><strong>{c.categoryName}</strong></td>
                                <td>{c.description ?? "—"}</td>
                                <td>{c.displayOrder}</td>
                                <td>
                                    <span className={`${styles.badge} ${c.isActive ? styles.badgeActive : styles.badgeInactive}`}>
                                        {c.isActive ? "Hoạt động" : "Ngừng"}
                                    </span>
                                </td>
                                <td>
                                    <div className={styles.btnRow}>
                                        <button className={styles.btnEdit} onClick={() => setModal({ type: "edit", cat: c })}>Sửa</button>
                                        <button className={styles.btnDelete} onClick={() => setModal({ type: "delete", cat: c })}>Xoá</button>
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
                                Hiển thị từ {(currentPage - 1) * itemsPerPage + 1} đến {Math.min(currentPage * itemsPerPage, filteredItems.length)} trong {filteredItems.length} danh mục
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
            {modal?.type === "edit" && modal.cat && <EditModal cat={modal.cat} onClose={() => setModal(null)} onSaved={load} />}
            {modal?.type === "delete" && modal.cat && <DeleteModal cat={modal.cat} onClose={() => setModal(null)} onSaved={load} />}
        </>
    );
}
