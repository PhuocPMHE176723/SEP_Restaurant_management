"use client";

import { useEffect, useState } from "react";
import { getStockMovements, createManualAdjustment, getIngredients } from "../../../lib/api/warehouse";
import { exportTransactionsPDF } from "../../../lib/exportPDF";
import managerStyles from "../../manager/manager.module.css";
import styles from "../warehouse.module.css";
import { showSuccess, showError, showConfirm, showWarning } from "../../../lib/ui/alerts";
import { format } from "date-fns";
import { Calendar, Search, Filter } from "lucide-react";

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
    const [filterDate, setFilterDate] = useState(format(new Date(), "yyyy-MM-dd"));
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
        const itemDateStr = format(new Date(c.movedAt), "yyyy-MM-dd");
        
        const matchSearch = c.ingredientName.toLowerCase().includes(searchTerm.toLowerCase()) 
                         || (c.note || "").toLowerCase().includes(searchTerm.toLowerCase());
        const matchType = filterType === "ALL" || c.movementType === filterType;
        const matchIngredient = filterIngredient === "ALL" || c.ingredientName === filterIngredient;
        const matchDate = !filterDate || itemDateStr === filterDate;
        
        return matchSearch && matchType && matchIngredient && matchDate;
    });

    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
    const paginatedItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    async function handleAdjust() {
        if (!form.ingredientId || form.quantity <= 0 || !form.note.trim()) {
            return showWarning('Lỗi', 'Vui lòng điền đủ thông tin hợp lệ');
        }
        
        const confirmed = await showConfirm(
            'Xác nhận điều chỉnh?',
            `Bạn chuẩn bị ${form.movementType === 'IN' ? 'nhập' : 'xuất'} ${form.quantity} đơn vị. Dữ liệu này sẽ được lưu vào lịch sử giao dịch.`
        );

        if (!confirmed) return;

        try {
            await createManualAdjustment(form as any);
            showSuccess('Thành công', 'Đã lưu biến động kho');
            setModal(false);
            load();
        } catch (e: any) { showError('Lỗi', e.message || 'Có lỗi xảy ra'); }
    }

    return (
        <div className={managerStyles.pageContainer}>
            <header className={styles.pageHeader}>
                <div className={styles.titleGroup}>
                    <h1 className={styles.pageTitle}>Lịch sử kho</h1>
                    <p className={styles.pageSubtitle}>Biến động kho và điều chỉnh thủ công</p>
                </div>
                <div style={{ display: "flex", gap: "1rem" }}>
                    <button 
                        className={managerStyles.btnAdd} 
                        style={{ background: "#dc2626", boxShadow: '0 4px 12px rgba(220, 38, 38, 0.2)' }}
                        onClick={() => exportTransactionsPDF(filteredItems)}
                    >
                        <Search size={18} style={{ marginRight: '4px' }} /> Xuất PDF
                    </button>
                    <button className={managerStyles.btnAdd} onClick={() => setModal(true)}>
                        + Điều chỉnh tồn kho
                    </button>
                </div>
            </header>

            <div className={styles.premiumFilterBar}>
                <div className={styles.searchGroup}>
                    <Search size={20} />
                    <input 
                        type="text" 
                        placeholder="Tìm theo nguyên liệu hoặc ghi chú..." 
                        value={searchTerm} 
                        onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }} 
                    />
                </div>
                
                <div className={`${styles.searchGroup} ${styles.dateGroup}`}>
                    <Calendar size={20} />
                    <input 
                        type="date" 
                        value={filterDate} 
                        onChange={e => { setFilterDate(e.target.value); setCurrentPage(1); }}
                    />
                </div>

                <div className={`${styles.searchGroup} ${styles.selectGroup}`}>
                    <Filter size={20} />
                    <select 
                        value={filterType} 
                        onChange={e => { setFilterType(e.target.value); setCurrentPage(1); }}
                    >
                        <option value="ALL">Tất cả loại giao dịch</option>
                        <option value="IN">Nhập kho (IN)</option>
                        <option value="OUT">Xuất/Giảm kho (OUT)</option>
                    </select>
                </div>

                <div className={`${styles.searchGroup} ${styles.selectGroup}`}>
                    <Filter size={20} />
                    <select 
                        value={filterIngredient} 
                        onChange={e => { setFilterIngredient(e.target.value); setCurrentPage(1); }}
                    >
                        <option value="ALL">Tất cả nguyên liệu</option>
                        {[...new Set(items.map(i => i.ingredientName))].sort().map(name => (
                            <option key={name} value={name}>{name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className={styles.premiumTableCard}>
                <table className={styles.premiumTable}>
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
                        {loading ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Đang tải...</td></tr> :
                            paginatedItems.length === 0 ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Không có dữ liệu phù hợp</td></tr> :
                            paginatedItems.map((m) => (
                                <tr key={m.movementId}>
                                    <td style={{ fontWeight: 600, color: '#475569' }}>
                                        {format(new Date(m.movedAt), "HH:mm:ss")}<br/>
                                        <small style={{ fontWeight: 500, opacity: 0.7 }}>{format(new Date(m.movedAt), "dd/MM/yyyy")}</small>
                                    </td>
                                    <td>
                                        <span className={`${styles.badge} ${m.movementType === "IN" ? styles.badgeSuccess : styles.badgeDanger}`}>
                                            {m.movementType === "IN" ? "NHẬP KHO" : "XUẤT / GIẢM"}
                                        </span>
                                    </td>
                                    <td><strong style={{ color: '#0f172a' }}>{m.ingredientName}</strong></td>
                                    <td><span style={{ fontWeight: 800, color: '#0f172a' }}>{m.quantity}</span> <small style={{ fontWeight: 700, color: '#64748b' }}>{m.unit}</small></td>
                                    <td><span className={`${styles.badge} ${styles.badgeInfo}`}>{m.refType || "Hệ thống"}</span></td>
                                    <td><span style={{ fontWeight: 600 }}>{m.createdByStaffName || "Hệ thống"}</span></td>
                                    <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#64748b' }}>{m.note}</td>
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
                    <div className={managerStyles.modal}>
                        <div className={managerStyles.modalHead}>
                            <span className={managerStyles.modalTitle}>Điều chỉnh tồn kho</span>
                            <button className={managerStyles.modalClose} onClick={() => setModal(false)}>✕</button>
                        </div>
                        <div className={managerStyles.modalBody}>
                            <div className={managerStyles.field}>
                                <label className={managerStyles.label}>Nguyên liệu</label>
                                <select className={managerStyles.input} value={form.ingredientId} onChange={e => setForm({ ...form, ingredientId: Number(e.target.value) })}>
                                    <option value={0}>-- Chọn nguyên liệu --</option>
                                    {ingredients.filter(i => i.isActive).map(i => <option key={i.ingredientId} value={i.ingredientId}>{i.ingredientName} ({i.unit})</option>)}
                                </select>
                            </div>
                            <div className={managerStyles.field}>
                                <label className={managerStyles.label}>Loại biến động</label>
                                <select className={managerStyles.input} value={form.movementType} onChange={e => setForm({ ...form, movementType: e.target.value })}>
                                    <option value="IN">Nhập thêm (IN)</option>
                                    <option value="OUT">Giảm trừ (OUT)</option>
                                </select>
                            </div>
                            <div className={managerStyles.field}>
                                <label className={managerStyles.label}>Số lượng</label>
                                {(() => {
                                    const selectedIng = ingredients.find(i => i.ingredientId === form.ingredientId);
                                    const isPcs = selectedIng?.unit === "pcs";
                                    return (
                                        <input className={managerStyles.input} type="number" min={isPcs ? 1 : 0.01} step={isPcs ? 1 : 0.01} value={form.quantity} 
                                            onFocus={e => e.target.select()}
                                            onChange={e => {
                                                const val = e.target.value === "" ? 0 : (isPcs ? parseInt(e.target.value) || 0 : parseFloat(e.target.value));
                                                setForm({ ...form, quantity: val });
                                            }} 
                                        />
                                    );
                                })()}
                            </div>
                            <div className={managerStyles.field}>
                                <label className={managerStyles.label}>Lý do</label>
                                <input className={managerStyles.input} placeholder="VD: Hàng hư hỏng, Nhập thiếu..." value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} />
                            </div>
                        </div>
                        <div className={managerStyles.modalFoot}>
                            <button className={managerStyles.btnCancel} onClick={() => setModal(false)}>Huỷ</button>
                            <button className={managerStyles.btnSave} onClick={handleAdjust}>Xác nhận</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
