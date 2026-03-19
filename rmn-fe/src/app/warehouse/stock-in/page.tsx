"use client";

import { useEffect, useState } from "react";
import { getPurchaseReceipts, getIngredients, createPurchaseReceipt, updatePurchaseReceiptStatus } from "../../../lib/api/warehouse";
import { exportReceiptsPDF } from "../../../lib/exportPDF";
import styles from "../../manager/manager.module.css";
import { showSuccess, showError, showConfirm, showWarning } from "../../../lib/ui/alerts";
import { PurchaseReceiptResponse as Receipt } from "../../../types/models";

export default function StockInPage() {
    const [receipts, setReceipts] = useState<Receipt[]>([]);
    const [ingredients, setIngredients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(false);

    // Filter & Pagination state
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("ALL");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    const [form, setForm] = useState({ note: "", status: "RECEIVED", items: [{ ingredientId: 0, quantity: 1, unitCost: 0 }] });

    const load = async () => {
        setLoading(true);
        try {
            const rc = await getPurchaseReceipts();
            setReceipts(rc.data || rc);
            const ig = await getIngredients();
            setIngredients(ig.data || ig);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    // Derived state
    const filteredItems = receipts.filter(r => {
        const matchSearch = (r.receiptCode || "").toLowerCase().includes(searchTerm.toLowerCase());
        const matchStatus = filterStatus === "ALL" || r.status === filterStatus;
        return matchSearch && matchStatus;
    });

    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
    const paginatedItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    async function handleSave() {
        if (form.items.some(i => !i.ingredientId || i.quantity <= 0 || i.unitCost < 0)) {
            return showWarning('Lỗi', 'Vui lòng điền đúng thông tin các mặt hàng');
        }
        try {
            await createPurchaseReceipt(form as any);
            showSuccess('Thành công', 'Đã lưu phiếu nhập kho');
            setModal(false);
            load();
        } catch (e: any) { showError('Lỗi', e.message || 'Có lỗi xảy ra'); }
    }

    async function handleReceive(id: number) {
        const confirmed = await showConfirm(
            'Xác nhận nhập kho?',
            "Xác nhận nhập phiếu này vào kho? Số lượng tồn kho sẽ tăng lên."
        );

        if (!confirmed) return;

        try {
            await updatePurchaseReceiptStatus(id, "RECEIVED");
            showSuccess('Thành công', 'Đã nhập kho phiếu này');
            load();
        } catch (e: any) { showError('Lỗi', e.message || 'Có lỗi xảy ra'); }
    }

    return (
        <div className={styles.contentCard}>
            <div className={styles.cardHeader}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <h1 className={styles.cardTitle}>Phiếu nhập kho</h1>
                        <p className={styles.pageSubtitle}>Quản lý nhập hàng từ nhà cung cấp</p>
                    </div>
                    <div style={{ display: "flex", gap: 10 }}>
                        <button 
                            className={styles.btnAdd} 
                            style={{ background: "#dc2626" }}
                            onClick={() => exportReceiptsPDF(filteredItems)}
                        >
                            ↓ Xuất PDF
                        </button>
                        <button className={styles.btnAdd} onClick={() => {
                            setForm({ note: "", status: "RECEIVED", items: [{ ingredientId: 0, quantity: 1, unitCost: 0 }] });
                            setModal(true);
                        }}>
                            + Tạo phiếu nhập
                        </button>
                    </div>
                </div>
            </div>

            <div className={styles.cardBody}>
                <div className={styles.filterBar}>
                    <input 
                        type="text" 
                        className={styles.searchInput}
                        placeholder="Tìm theo mã phiếu..." 
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
                        <option value="RECEIVED">Đã nhập kho</option>
                        <option value="DRAFT">Nháp</option>
                        <option value="CANCELLED">Đã huỷ</option>
                    </select>
                </div>

                <div className={styles.tableWrap}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Mã phiếu</th>
                                <th>Ngày lập</th>
                                <th>Tổng tiền</th>
                                <th>Người lập</th>
                                <th>Trạng thái</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? <tr><td colSpan={6} className={styles.loading}>Đang tải...</td></tr> :
                                paginatedItems.length === 0 ? <tr><td colSpan={6} className={styles.empty}>Không có dữ liệu phù hợp</td></tr> :
                                paginatedItems.map((r) => (
                                    <tr key={r.receiptId}>
                                        <td><strong>{r.receiptCode}</strong></td>
                                        <td>{new Date(r.receiptDate).toLocaleString("vi-VN")}</td>
                                        <td>{r.totalAmount.toLocaleString("vi-VN")} đ</td>
                                        <td>{r.createdByStaffName}</td>
                                        <td>
                                            <span className={`${styles.badge} ${r.status === "RECEIVED" ? styles.badgeActive : styles.badgeInactive}`}>
                                                {r.status === "RECEIVED" ? "Đã nhập" : r.status === "DRAFT" ? "Nháp" : "Đã huỷ"}
                                            </span>
                                        </td>
                                        <td>
                                            {r.status === "DRAFT" && (
                                                <button className={styles.btnSave} onClick={() => handleReceive(r.receiptId)} style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem' }}>Nhập kho</button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            }
                        </tbody>
                    </table>
                </div>
                {totalPages > 1 && (
                    <div className={styles.pagination}>
                        <div className={styles.pageInfo}>
                            Hiển thị từ {(currentPage - 1) * itemsPerPage + 1} đến {Math.min(currentPage * itemsPerPage, filteredItems.length)} trong {filteredItems.length} kết quả
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

            {modal && (
                <div className={styles.modalOverlay} onClick={(e) => e.target === e.currentTarget && setModal(false)}>
                    <div className={styles.modal} style={{ width: '600px', maxWidth: '90vw' }}>
                        <div className={styles.modalHead}>
                            <span className={styles.modalTitle}>Tạo phiếu nhập mới</span>
                            <button className={styles.modalClose} onClick={() => setModal(false)}>✕</button>
                        </div>
                        <div className={styles.modalBody}>
                            <div className={styles.field}>
                                <label className={styles.label}>Ghi chú</label>
                                <input className={styles.input} placeholder="Nội dung nhập..." value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} />
                            </div>
                            <div className={styles.field}>
                                <label className={styles.label}>Nhập vào kho ngay hay lưu nháp?</label>
                                <select className={styles.input} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                                    <option value="RECEIVED">Nhập vào tồn kho luôn</option>
                                    <option value="DRAFT">Lưu nháp (chưa tính vào tồn)</option>
                                </select>
                            </div>

                            <hr style={{ margin: "1rem 0", borderColor: "#e2e8f0" }} />
                            <h4 style={{ marginBottom: "0.5rem" }}>Chi tiết các mặt hàng</h4>

                            {form.items.map((item, idx) => (
                                <div key={idx} style={{ display: "flex", gap: "10px", marginBottom: "10px", alignItems: "flex-end" }}>
                                    <div style={{ flex: 2 }}>
                                        <small style={{ color: "#64748b" }}>Nguyên liệu</small>
                                        <select className={styles.input} value={item.ingredientId} onChange={e => {
                                            const n = [...form.items]; n[idx].ingredientId = Number(e.target.value); setForm({ ...form, items: n });
                                        }}>
                                            <option value={0}>-- Chọn --</option>
                                            {ingredients.filter(i => i.isActive).map(i => <option key={i.ingredientId} value={i.ingredientId}>{i.ingredientName}</option>)}
                                        </select>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <small style={{ color: "#64748b" }}>Số lượng</small>
                                        {(() => {
                                            const selectedIng = ingredients.find(i => i.ingredientId === item.ingredientId);
                                            const isPcs = selectedIng?.unit === "pcs";
                                            return (
                                                <input className={styles.input} type="number" min={isPcs ? 1 : 0.01} step={isPcs ? 1 : 0.01} value={item.quantity} onFocus={e => e.target.select()} onChange={e => {
                                                    const val = e.target.value === "" ? 0 : (isPcs ? parseInt(e.target.value) || 0 : parseFloat(e.target.value));
                                                    const n = [...form.items]; n[idx].quantity = val; setForm({ ...form, items: n });
                                                }} />
                                            );
                                        })()}
                                    </div>
                                    <div style={{ flex: 1.5 }}>
                                        <small style={{ color: "#64748b" }}>Đơn giá</small>
                                        <input className={styles.input} type="number" min={0} value={item.unitCost} onFocus={e => e.target.select()} onChange={e => {
                                            const val = e.target.value === "" ? 0 : parseFloat(e.target.value);
                                            const n = [...form.items]; n[idx].unitCost = val; setForm({ ...form, items: n });
                                        }} />
                                    </div>
                                    <button onClick={() => {
                                        const n = [...form.items]; n.splice(idx, 1); setForm({ ...form, items: n });
                                    }} style={{ background: "#ef4444", color: "white", border: "none", borderRadius: "4px", padding: "10px", cursor: "pointer", height: "39px" }}>X</button>
                                </div>
                            ))}
                            
                            <button onClick={() => setForm({ ...form, items: [...form.items, { ingredientId: 0, quantity: 1, unitCost: 0 }] })} style={{ background: "#f8fafc", border: "1px dashed #cbd5e1", width: "100%", padding: "10px", borderRadius: "6px", cursor: "pointer" }}>+ Thêm mặt hàng</button>

                        </div>
                        <div className={styles.modalFoot}>
                            <button className={styles.btnCancel} onClick={() => setModal(false)}>Huỷ</button>
                            <button className={styles.btnSave} onClick={handleSave}>Hoàn tất</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
