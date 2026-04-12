"use client";

import { useEffect, useState } from "react";
import { getPurchaseReceipts, getIngredients, createPurchaseReceipt, updatePurchaseReceiptStatus } from "../../../lib/api/warehouse";
import { exportReceiptsPDF } from "../../../lib/exportPDF";
import managerStyles from "../../manager/manager.module.css";
import styles from "../warehouse.module.css";
import { showSuccess, showError, showConfirm, showWarning } from "../../../lib/ui/alerts";
import { PurchaseReceiptResponse as Receipt } from "../../../types/models";
import { Search, Filter, Calendar, FileText } from "lucide-react";
import { format } from "date-fns";

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
        <div className={managerStyles.pageContainer}>
            <header className={styles.pageHeader}>
                <div className={styles.titleGroup}>
                    <h1 className={styles.pageTitle}>Phiếu nhập kho</h1>
                    <p className={styles.pageSubtitle}>Quản lý nhập hàng từ nhà cung cấp</p>
                </div>
                <div style={{ display: "flex", gap: "1rem" }}>
                    <button 
                        className={managerStyles.btnAdd} 
                        style={{ background: "#dc2626" }}
                        onClick={() => exportReceiptsPDF(filteredItems)}
                    >
                        <Search size={18} style={{ marginRight: '4px' }} /> Xuất PDF
                    </button>
                    <button className={managerStyles.btnAdd} onClick={() => {
                        setForm({ note: "", status: "RECEIVED", items: [{ ingredientId: 0, quantity: 1, unitCost: 0 }] });
                        setModal(true);
                    }}>
                        + Tạo phiếu nhập
                    </button>
                </div>
            </header>

            <div className={styles.premiumFilterBar}>
                <div className={styles.searchGroup}>
                    <Search size={20} />
                    <input 
                        type="text" 
                        placeholder="Tìm theo mã phiếu..." 
                        value={searchTerm} 
                        onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }} 
                    />
                </div>
                
                <div className={`${styles.searchGroup} ${styles.selectGroup}`}>
                    <Filter size={20} />
                    <select 
                        value={filterStatus} 
                        onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                    >
                        <option value="ALL">Tất cả trạng thái</option>
                        <option value="RECEIVED">Đã nhập kho</option>
                        <option value="DRAFT">Nháp</option>
                        <option value="CANCELLED">Đã huỷ</option>
                    </select>
                </div>
            </div>

            <div className={styles.premiumTableCard}>
                <table className={styles.premiumTable}>
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
                        {loading ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Đang tải...</td></tr> :
                            paginatedItems.length === 0 ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Không có dữ liệu phù hợp</td></tr> :
                            paginatedItems.map((r) => (
                                <tr key={r.receiptId}>
                                    <td><span className={`${styles.badge} ${styles.badgeDefault}`}># {r.receiptCode}</span></td>
                                    <td><span style={{ color: '#64748b' }}>{format(new Date(r.receiptDate), "dd/MM/yyyy HH:mm")}</span></td>
                                    <td><span className={styles.stockValue}>{r.totalAmount.toLocaleString("vi-VN")}</span> <small className={styles.unitLabel}>đ</small></td>
                                    <td><span style={{ fontWeight: 600 }}>{r.createdByStaffName}</span></td>
                                    <td>
                                        <span className={`${styles.badge} ${r.status === "RECEIVED" ? styles.badgeSuccess : r.status === "DRAFT" ? styles.badgeWarning : styles.badgeDanger}`}>
                                            {r.status === "RECEIVED" ? "Toàn bộ" : r.status === "DRAFT" ? "Bản nháp" : "Đã huỷ"}
                                        </span>
                                    </td>
                                    <td>
                                        {r.status === "DRAFT" && (
                                            <button className={managerStyles.btnEdit} onClick={() => handleReceive(r.receiptId)}>Nhập kho</button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        }
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

            {modal && (
                <div className={managerStyles.modalOverlay} onClick={(e) => e.target === e.currentTarget && setModal(false)}>
                    <div className={managerStyles.modal} style={{ width: '600px', maxWidth: '90vw' }}>
                        <div className={managerStyles.modalHead}>
                            <span className={managerStyles.modalTitle}>Tạo phiếu nhập mới</span>
                            <button className={managerStyles.modalClose} onClick={() => setModal(false)}>✕</button>
                        </div>
                        <div className={managerStyles.modalBody}>
                             <div className={managerStyles.field}>
                                <label className={managerStyles.label}>Ghi chú</label>
                                <input className={managerStyles.input} placeholder="Nội dung nhập..." value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} />
                            </div>
                            <div className={managerStyles.field}>
                                <label className={managerStyles.label}>Nhập vào kho ngay hay lưu nháp?</label>
                                <select className={managerStyles.input} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                                    <option value="RECEIVED">Nhập vào tồn kho luôn</option>
                                    <option value="DRAFT">Lưu nháp (chưa tính vào tồn)</option>
                                </select>
                            </div>

                            <hr style={{ margin: "1rem 0", borderColor: "#f1f5f9" }} />
                            <h4 style={{ marginBottom: "0.5rem", fontSize: '0.9rem', color: '#475569' }}>Chi tiết các mặt hàng</h4>

                            {form.items.map((item, idx) => (
                                <div key={idx} style={{ display: "flex", gap: "10px", marginBottom: "10px", alignItems: "flex-end" }}>
                                    <div style={{ flex: 2 }}>
                                        <small style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>Nguyên liệu</small>
                                        <select className={managerStyles.input} value={item.ingredientId} onChange={e => {
                                            const n = [...form.items]; n[idx].ingredientId = Number(e.target.value); setForm({ ...form, items: n });
                                        }}>
                                            <option value={0}>-- Chọn --</option>
                                            {ingredients.filter(i => i.isActive).map(i => <option key={i.ingredientId} value={i.ingredientId}>{i.ingredientName}</option>)}
                                        </select>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <small style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>Số lượng</small>
                                        {(() => {
                                            const selectedIng = ingredients.find(i => i.ingredientId === item.ingredientId);
                                            const isPcs = selectedIng?.unit === "pcs";
                                            return (
                                                <input className={managerStyles.input} type="number" min={isPcs ? 1 : 0.01} step={isPcs ? 1 : 0.01} value={item.quantity} onFocus={e => e.target.select()} onChange={e => {
                                                    const val = e.target.value === "" ? 0 : (isPcs ? parseInt(e.target.value) || 0 : parseFloat(e.target.value));
                                                    const n = [...form.items]; n[idx].quantity = val; setForm({ ...form, items: n });
                                                }} />
                                            );
                                        })()}
                                    </div>
                                    <div style={{ flex: 1.5 }}>
                                        <small style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>Đơn giá</small>
                                        <input className={managerStyles.input} type="number" min={0} value={item.unitCost} onFocus={e => e.target.select()} onChange={e => {
                                            const val = e.target.value === "" ? 0 : parseFloat(e.target.value);
                                            const n = [...form.items]; n[idx].unitCost = val; setForm({ ...form, items: n });
                                        }} />
                                    </div>
                                    <button onClick={() => {
                                        const n = [...form.items]; n.splice(idx, 1); setForm({ ...form, items: n });
                                    }} style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: "8px", padding: "10px", cursor: "pointer", height: "45px" }}>✕</button>
                                </div>
                            ))}
                            
                            <button onClick={() => setForm({ ...form, items: [...form.items, { ingredientId: 0, quantity: 1, unitCost: 0 }] })} style={{ background: "#f8fafc", border: "1.5px dashed #cbd5e1", width: "100%", padding: "12px", borderRadius: "10px", color: '#475569', fontWeight: 600, cursor: "pointer", marginTop: '0.5rem' }}>+ Thêm mặt hàng</button>

                        </div>
                        <div className={managerStyles.modalFoot}>
                            <button className={managerStyles.btnCancel} onClick={() => setModal(false)}>Huỷ</button>
                            <button className={managerStyles.btnAdd} onClick={handleSave}>Hoàn tất</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
