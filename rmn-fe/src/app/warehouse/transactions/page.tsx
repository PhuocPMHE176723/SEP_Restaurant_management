"use client";

import { useEffect, useState } from "react";
import { getStockMovements, createManualAdjustment, getIngredients } from "../../../lib/api/warehouse";
import { exportTransactionsPDF } from "../../../lib/exportPDF";
import styles from "../../admin/admin.module.css";
import Swal from 'sweetalert2';

import { StockMovementResponse as Movement } from "../../../types/models";

export default function TransactionsPage() {
    const [items, setItems] = useState<Movement[]>([]);
    const [ingredients, setIngredients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(false);

    // Filter & Pagination state
    const [searchTerm, setSearchTerm] = useState("");
    const [filterType, setFilterType] = useState("ALL");
    const [filterIngredient, setFilterIngredient] = useState("ALL");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    const [form, setForm] = useState({ ingredientId: 0, movementType: "IN", quantity: 0, note: "" });

    const load = async () => {
        setLoading(true);
        try {
            const mv = await getStockMovements();
            setItems(mv.data || mv);
            const ig = await getIngredients();
            setIngredients(ig.data || ig);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    // Derived state
    const filteredItems = items.filter(c => {
        const matchSearch = c.ingredientName.toLowerCase().includes(searchTerm.toLowerCase()) 
                         || (c.note || "").toLowerCase().includes(searchTerm.toLowerCase());
        const matchType = filterType === "ALL" || c.movementType === filterType;
        const matchIngredient = filterIngredient === "ALL" || c.ingredientName === filterIngredient;
        return matchSearch && matchType && matchIngredient;
    });

    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
    const paginatedItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    async function handleAdjust() {
        if (!form.ingredientId || form.quantity <= 0 || !form.note.trim()) {
            return Swal.fire('Lỗi', 'Vui lòng điền đủ thông tin hợp lệ', 'warning');
        }
        
        const result = await Swal.fire({
            title: 'Xác nhận điều chỉnh?',
            text: `Bạn chuẩn bị ${form.movementType === 'IN' ? 'nhập' : 'xuất'} ${form.quantity} đơn vị. Dữ liệu này sẽ được lưu vào lịch sử giao dịch.`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Đồng ý',
            cancelButtonText: 'Hủy'
        });

        if (!result.isConfirmed) return;

        try {
            await createManualAdjustment(form as any);
            Swal.fire('Thành công', 'Đã lưu biến động kho', 'success');
            setModal(false);
            load();
        } catch (e: any) { Swal.fire('Lỗi', e.message || 'Có lỗi xảy ra', 'error'); }
    }

    return (
        <div className={styles.contentCard}>
            <div className={styles.cardHeader}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <h1 className={styles.cardTitle}>Lịch sử xuất nhập kho</h1>
                        <p className={styles.pageSubtitle}>Biến động kho và điều chỉnh thủ công</p>
                    </div>
                    <div style={{ display: "flex", gap: 10 }}>
                        <button 
                            className={styles.btnAdd} 
                            style={{ background: "#dc2626" }}
                            onClick={() => exportTransactionsPDF(filteredItems)}
                        >
                            ↓ Xuất PDF
                        </button>
                        <button className={styles.btnAdd} onClick={() => setModal(true)}>
                            + Điều chỉnh tồn kho
                        </button>
                    </div>
                </div>
            </div>

            <div className={styles.cardBody}>
                <div className={styles.filterBar}>
                    <input 
                        type="text" 
                        className={styles.searchInput}
                        placeholder="Tìm nguyên liệu, ghi chú..." 
                        value={searchTerm} 
                        onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }} 
                    />
                    <select 
                        className={styles.input} 
                        style={{ width: "auto" }}
                        value={filterType} 
                        onChange={e => { setFilterType(e.target.value); setCurrentPage(1); }}
                    >
                        <option value="ALL">Tất cả loại giao dịch</option>
                        <option value="IN">Nhập kho (IN)</option>
                        <option value="OUT">Xuất/Giảm kho (OUT)</option>
                    </select>
                    <select 
                        className={styles.input} 
                        style={{ width: "auto" }}
                        value={filterIngredient} 
                        onChange={e => { setFilterIngredient(e.target.value); setCurrentPage(1); }}
                    >
                        <option value="ALL">Tất cả nguyên liệu</option>
                        {[...new Set(items.map(i => i.ingredientName))].sort().map(name => (
                            <option key={name} value={name}>{name}</option>
                        ))}
                    </select>
                </div>

                <div className={styles.tableWrap}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Thời gian</th>
                                <th>Loại</th>
                                <th>Nguyên liệu</th>
                                <th>Số lượng</th>
                                <th>Loại tham chiếu</th>
                                <th>Người tạo</th>
                                <th>Ghi chú</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? <tr><td colSpan={7} className={styles.loading}>Đang tải...</td></tr> :
                                paginatedItems.length === 0 ? <tr><td colSpan={7} className={styles.empty}>Không có dữ liệu phù hợp</td></tr> :
                                paginatedItems.map((m) => (
                                    <tr key={m.movementId}>
                                        <td>{new Date(m.movedAt).toLocaleString("vi-VN")}</td>
                                        <td>
                                            <span style={{ color: m.movementType === "IN" ? "#10b981" : "#ef4444", fontWeight: "bold" }}>
                                                {m.movementType === "IN" ? "Nhập" : "Xuất/Giảm"}
                                            </span>
                                        </td>
                                        <td>{m.ingredientName}</td>
                                        <td>{m.quantity} {m.unit}</td>
                                        <td>{m.refType}</td>
                                        <td>{m.createdByStaffName || "Hệ thống"}</td>
                                        <td>{m.note}</td>
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
                    <div className={styles.modal}>
                        <div className={styles.modalHead}>
                            <span className={styles.modalTitle}>Điều chỉnh tồn kho</span>
                            <button className={styles.modalClose} onClick={() => setModal(false)}>✕</button>
                        </div>
                        <div className={styles.modalBody}>
                            <div className={styles.field}>
                                <label className={styles.label}>Nguyên liệu</label>
                                <select className={styles.input} value={form.ingredientId} onChange={e => setForm({ ...form, ingredientId: Number(e.target.value) })}>
                                    <option value={0}>-- Chọn nguyên liệu --</option>
                                    {ingredients.filter(i => i.isActive).map(i => <option key={i.ingredientId} value={i.ingredientId}>{i.ingredientName} ({i.unit})</option>)}
                                </select>
                            </div>
                            <div className={styles.field}>
                                <label className={styles.label}>Loại biến động</label>
                                <select className={styles.input} value={form.movementType} onChange={e => setForm({ ...form, movementType: e.target.value })}>
                                    <option value="IN">Nhập thêm (IN)</option>
                                    <option value="OUT">Giảm trừ (OUT)</option>
                                </select>
                            </div>
                            <div className={styles.field}>
                                <label className={styles.label}>Số lượng</label>
                                {(() => {
                                    const selectedIng = ingredients.find(i => i.ingredientId === form.ingredientId);
                                    const isPcs = selectedIng?.unit === "pcs";
                                    return (
                                        <input className={styles.input} type="number" min={isPcs ? 1 : 0.01} step={isPcs ? 1 : 0.01} value={form.quantity} 
                                            onFocus={e => e.target.select()}
                                            onChange={e => {
                                                const val = e.target.value === "" ? 0 : (isPcs ? parseInt(e.target.value) || 0 : parseFloat(e.target.value));
                                                setForm({ ...form, quantity: val });
                                            }} 
                                        />
                                    );
                                })()}
                            </div>
                            <div className={styles.field}>
                                <label className={styles.label}>Lý do</label>
                                <input className={styles.input} placeholder="VD: Hàng hư hỏng, Nhập thiếu..." value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} />
                            </div>
                        </div>
                        <div className={styles.modalFoot}>
                            <button className={styles.btnCancel} onClick={() => setModal(false)}>Huỷ</button>
                            <button className={styles.btnSave} onClick={handleAdjust}>Xác nhận</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
