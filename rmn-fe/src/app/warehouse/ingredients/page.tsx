"use client";

import { useCallback, useEffect, useState } from "react";
import { getIngredients, createIngredient, updateIngredient, deleteIngredient, getIngredientPriceHistory } from "../../../lib/api/warehouse";
import managerStyles from "../../manager/manager.module.css";
import localStyles from "../warehouse.module.css";
import { showSuccess, showError, showInfo } from "../../../lib/ui/alerts";
import { Search, Filter, Plus } from "lucide-react";
import { IngredientResponse as Ingredient } from "../../../types/models";

type PriceBatch = { date: string; receiptCode: string; quantity: number; unitCost: number; };

// ── Price History Modal ───────────────────────────────────────────
function PriceHistoryModal({ ingredient, onClose }: { ingredient: Ingredient; onClose: () => void }) {
    const [loading, setLoading] = useState(true);
    const [batches, setBatches] = useState<PriceBatch[]>([]);
    const [avg, setAvg] = useState(0);

    useEffect(() => {
        getIngredientPriceHistory(ingredient.ingredientId)
            .then((res: any) => {
                const data = res.data ?? res;
                setBatches(data.batches ?? []);
                setAvg(data.averagePrice ?? 0);
            })
            .finally(() => setLoading(false));
    }, [ingredient.ingredientId]);

    return (
        <div className={managerStyles.modalOverlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className={managerStyles.modal} style={{ maxWidth: 620, width: "95%" }}>
                <div className={managerStyles.modalHead}>
                    <span className={managerStyles.modalTitle}>Lịch sử giá - {ingredient.ingredientName}</span>
                    <button className={managerStyles.modalClose} onClick={onClose}>✕</button>
                </div>
                <div className={managerStyles.modalBody}>
                    {loading ? <p>Đang tải...</p> : batches.length === 0 ? (
                        <p style={{ color: "#94a3b8", textAlign: "center" }}>Chưa có lần nhập kho nào được ghi nhận</p>
                    ) : (
                        <>
                            <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 8, padding: "10px 16px", marginBottom: 16, display: "flex", justifyContent: "space-between" }}>
                                <span style={{ color: "#166534", fontWeight: 600 }}>Giá trung bình hiện tại</span>
                                <span style={{ color: "#166534", fontWeight: 700, fontSize: "1.1rem" }}>{avg.toLocaleString("vi-VN")} ₫</span>
                            </div>
                            <table className={managerStyles.table}>
                                <thead><tr>
                                    <th>#</th>
                                    <th>Mã phiếu</th>
                                    <th>Ngày nhập</th>
                                    <th>Số lượng</th>
                                    <th>Đơn giá (₫)</th>
                                </tr></thead>
                                <tbody>
                                    {batches.map((b, idx) => (
                                        <tr key={idx}>
                                            <td>{idx + 1}</td>
                                            <td><strong>{b.receiptCode}</strong></td>
                                            <td>{new Date(b.date).toLocaleDateString("vi-VN")}</td>
                                            <td>{b.quantity.toLocaleString("vi-VN")} {ingredient.unit}</td>
                                            <td style={{ color: "#0ea5e9", fontWeight: 600 }}>{Number(b.unitCost).toLocaleString("vi-VN")} ₫</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </>
                    )}
                </div>
                <div className={managerStyles.modalFoot}>
                    <button className={managerStyles.btnCancel} onClick={onClose}>Đóng</button>
                </div>
            </div>
        </div>
    );
}

// ── Create Modal ─────────────────────────────────────────────────
function CreateModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
    const [form, setForm] = useState({ ingredientName: "", unit: "kg" });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSave() {
        if (!form.ingredientName.trim()) { setError("Tên nguyên liệu không được để trống"); return; }
        if (!form.unit.trim()) { setError("Đơn vị tính không được để trống"); return; }
        setSaving(true); setError(null);
        try { 
            await createIngredient(form); 
            showSuccess('Thành công', 'Đã thêm nguyên liệu');
            onSaved(); 
            onClose(); 
        }
        catch (e: any) { setError(e.message); }
        finally { setSaving(false); }
    }

    return (
        <div className={managerStyles.modalOverlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className={managerStyles.modal}>
                <div className={managerStyles.modalHead}>
                    <span className={managerStyles.modalTitle}>Thêm nguyên liệu mới</span>
                    <button className={managerStyles.modalClose} onClick={onClose}>✕</button>
                </div>
                <div className={managerStyles.modalBody}>
                    {error && <div className={managerStyles.modalError}>{error}</div>}
                    <div className={managerStyles.field}>
                        <label className={managerStyles.label}>Tên nguyên liệu *</label>
                        <input className={managerStyles.input} placeholder="VD: Gạo ST25"
                            value={form.ingredientName} onChange={(e) => setForm({ ...form, ingredientName: e.target.value })} />
                    </div>
                    <div className={managerStyles.field}>
                        <label className={managerStyles.label}>Đơn vị tính *</label>
                        <select className={managerStyles.input} value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
                            <option value="kg">kg</option>
                            <option value="g">gram</option>
                            <option value="l">lít</option>
                            <option value="ml">ml</option>
                            <option value="pcs">cái / quả / chai</option>
                        </select>
                    </div>
                </div>
                <div className={managerStyles.modalFoot}>
                    <button className={managerStyles.btnCancel} onClick={onClose}>Huỷ</button>
                    <button className={managerStyles.btnSave} onClick={handleSave} disabled={saving}>
                        {saving ? "Đang lưu..." : "Lưu"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Edit Modal ───────────────────────────────────────────────────
function EditModal({ i, onClose, onSaved }: { i: Ingredient; onClose: () => void; onSaved: () => void }) {
    const [form, setForm] = useState({ ingredientName: i.ingredientName, unit: i.unit, isActive: i.isActive });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSave() {
        if (!form.ingredientName.trim()) { setError("Tên nguyên liệu không được để trống"); return; }
        setSaving(true); setError(null);
        try { 
            await updateIngredient(i.ingredientId, form); 
            showSuccess('Thành công', 'Đã cập nhật nguyên liệu');
            onSaved(); 
            onClose(); 
        }
        catch (e: any) { setError(e.message); }
        finally { setSaving(false); }
    }

    return (
        <div className={managerStyles.modalOverlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className={managerStyles.modal}>
                <div className={managerStyles.modalHead}>
                    <span className={managerStyles.modalTitle}>Sửa nguyên liệu</span>
                    <button className={managerStyles.modalClose} onClick={onClose}>✕</button>
                </div>
                <div className={managerStyles.modalBody}>
                    {error && <div className={managerStyles.modalError}>{error}</div>}
                    <div className={managerStyles.field}>
                        <label className={managerStyles.label}>Tên nguyên liệu</label>
                        <input className={managerStyles.input} value={form.ingredientName}
                            onChange={(e) => setForm({ ...form, ingredientName: e.target.value })} />
                    </div>
                    <div className={managerStyles.field}>
                        <label className={managerStyles.label}>Đơn vị tính</label>
                        <select className={managerStyles.input} value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
                            <option value="kg">kg</option>
                            <option value="g">gram</option>
                            <option value="l">lít</option>
                            <option value="ml">ml</option>
                            <option value="pcs">cái / quả / chai</option>
                        </select>
                    </div>
                    <label className={managerStyles.checkRow}>
                        <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                        Còn sử dụng
                    </label>
                </div>
                <div className={managerStyles.modalFoot}>
                    <button className={managerStyles.btnCancel} onClick={onClose}>Huỷ</button>
                    <button className={managerStyles.btnSave} onClick={handleSave} disabled={saving}>
                        {saving ? "Đang lưu..." : "Lưu"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Delete Modal ─────────────────────────────────────────────────
function DeleteModal({ i, onClose, onSaved }: { i: Ingredient; onClose: () => void; onSaved: () => void }) {
    const [saving, setSaving] = useState(false);
    async function handleDelete() {
        setSaving(true);
        try { 
            await deleteIngredient(i.ingredientId); 
            showInfo('Đã ngừng cung cấp', 'Trạng thái nguyên liệu đã được cập nhật');
            onSaved(); 
            onClose(); 
        }
        catch (e: any) { showError('Lỗi', e.message || 'Có lỗi xảy ra'); }
        finally { setSaving(false); }
    }
    return (
        <div className={managerStyles.modalOverlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className={managerStyles.modal}>
                <div className={managerStyles.modalHead}>
                    <span className={managerStyles.modalTitle}>Xác nhận ngừng sử dụng</span>
                    <button className={managerStyles.modalClose} onClick={onClose}>✕</button>
                </div>
                <div className={managerStyles.deleteBody}>
                    <div className={managerStyles.deleteIcon}>⚠️</div>
                    <p className={managerStyles.deleteMsg}>Bạn chắc muốn ngừng sử dụng nguyên liệu <strong>{i.ingredientName}</strong>?</p>
                </div>
                <div className={managerStyles.modalFoot}>
                    <button className={managerStyles.btnCancel} onClick={onClose}>Huỷ</button>
                    <button className={managerStyles.btnDanger} onClick={handleDelete} disabled={saving}>{saving ? "Đang xử lý..." : "Xác nhận"}</button>
                </div>
            </div>
        </div>
    );
}

export default function IngredientsPage() {
    const [items, setItems] = useState<Ingredient[]>([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState<{ type: "create" | "edit" | "delete" | "price"; item?: Ingredient } | null>(null);

    // Filter & Pagination state
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("ALL");
    const [filterUnit, setFilterUnit] = useState("ALL");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    const load = useCallback(async () => {
        setLoading(true);
        try { setItems((await getIngredients()).data || await getIngredients()); }
        catch { setItems([]); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    // Derived state
    const filteredItems = items.filter(c => {
        const matchSearch = c.ingredientName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchStatus = filterStatus === "ALL" 
            || (filterStatus === "ACTIVE" && c.isActive) 
            || (filterStatus === "INACTIVE" && !c.isActive);
        const matchUnit = filterUnit === "ALL" || c.unit === filterUnit;
        return matchSearch && matchStatus && matchUnit;
    });

    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
    const paginatedItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <>
        <div className={managerStyles.pageContainer}>
            <header className={localStyles.pageHeader}>
                <div className={localStyles.titleGroup}>
                    <h1 className={localStyles.pageTitle}>Danh sách nguyên liệu</h1>
                    <p className={localStyles.pageSubtitle}>Quản lý danh sách các nguyên liệu nhập kho</p>
                </div>
                <button className={managerStyles.btnAdd} onClick={() => setModal({ type: "create" })}>
                    <Plus size={18} style={{ marginRight: '4px' }} /> Thêm nguyên liệu
                </button>
            </header>

            <div className={localStyles.premiumFilterBar}>
                <div className={localStyles.searchGroup}>
                    <Search size={20} />
                    <input 
                        type="text" 
                        placeholder="Tìm nguyên liệu..." 
                        value={searchTerm} 
                        onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }} 
                    />
                </div>
                
                <div className={`${localStyles.searchGroup} ${localStyles.selectGroup}`}>
                    <Filter size={20} />
                    <select 
                        value={filterStatus} 
                        onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                    >
                        <option value="ALL">Tất cả trạng thái</option>
                        <option value="ACTIVE">Đang sử dụng</option>
                        <option value="INACTIVE">Ngừng sử dụng</option>
                    </select>
                </div>

                <div className={`${localStyles.searchGroup} ${localStyles.selectGroup}`}>
                    <Filter size={20} />
                    <select 
                        value={filterUnit} 
                        onChange={e => { setFilterUnit(e.target.value); setCurrentPage(1); }}
                    >
                        <option value="ALL">Tất cả đơn vị tính</option>
                        {[...new Set(items.map(i => i.unit))].sort().map(u => (
                            <option key={u} value={u}>{u}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className={localStyles.premiumTableCard}>
                <table className={localStyles.premiumTable}>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Mã</th>
                            <th>Tên nguyên liệu</th>
                            <th>Đơn vị tính</th>
                            <th>Trạng thái</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Đang tải...</td></tr>
                        ) : paginatedItems.length === 0 ? (
                            <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Chưa có nguyên liệu nào phù hợp</td></tr>
                        ) : paginatedItems.map((c, i) => (
                            <tr key={c.ingredientId}>
                                <td>{(currentPage - 1) * itemsPerPage + i + 1}</td>
                                <td><span className={`${localStyles.badge} ${localStyles.badgeDefault}`} style={{ minWidth: '100px' }}>NL-{c.ingredientId.toString().padStart(4, "0")}</span></td>
                                <td><strong style={{ color: '#0f172a' }}>{c.ingredientName}</strong></td>
                                <td>{c.unit}</td>
                                <td>
                                    <span className={`${localStyles.badge} ${c.isActive ? localStyles.badgeSuccess : localStyles.badgeDanger}`}>
                                        {c.isActive ? "SỬ DỤNG" : "NGỪNG DÙNG"}
                                    </span>
                                </td>
                                <td>
                                    <div className={managerStyles.btnRow}>
                                        <button className={managerStyles.btnEdit} onClick={() => setModal({ type: "price", item: c })}>Giá</button>
                                        <button className={managerStyles.btnEdit} style={{ background: '#f8fafc', color: '#475569', borderColor: '#e2e8f0' }} onClick={() => setModal({ type: "edit", item: c })}>Sửa</button>
                                        {c.isActive && <button className={managerStyles.btnDelete} onClick={() => setModal({ type: "delete", item: c })}>Xoá</button>}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className={managerStyles.pagination}>
                    <div className={managerStyles.pageInfo}>
                        Hiển thị <strong>{(currentPage - 1) * itemsPerPage + 1}</strong> đến <strong>{Math.min(currentPage * itemsPerPage, filteredItems.length)}</strong> trong <strong>{filteredItems.length}</strong> kết quả
                    </div>
                    <div className={managerStyles.paginationControls}>
                        <button className={managerStyles.pageBtn} disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
                            Trước
                        </button>
                        <button className={managerStyles.pageBtn} disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>
                            Sau
                        </button>
                    </div>
                </div>
            )}
        </div>

            {modal?.type === "create" && <CreateModal onClose={() => setModal(null)} onSaved={load} />}
            {modal?.type === "edit" && modal.item && <EditModal i={modal.item} onClose={() => setModal(null)} onSaved={load} />}
            {modal?.type === "delete" && modal.item && <DeleteModal i={modal.item} onClose={() => setModal(null)} onSaved={load} />}
            {modal?.type === "price" && modal.item && <PriceHistoryModal ingredient={modal.item} onClose={() => setModal(null)} />}
        </>
    );
}
