"use client";

import { useEffect, useState } from "react";
import { DiscountCode, CreateDiscountCode } from "../../../types/models/promotion";
import { getDiscountCodes, createDiscountCode, updateDiscountCode, deleteDiscountCode, toggleDiscountCode } from "../../../lib/api/promotion";
import styles from "../manager.module.css";
import { showSuccess, showError, showConfirm } from "../../../lib/ui/alerts";

export default function DiscountCodesPage() {
    const [discounts, setDiscounts] = useState<DiscountCode[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    const [form, setForm] = useState<CreateDiscountCode>({
        code: "",
        discountType: "PERCENT",
        discountValue: 0,
        minOrderValue: 0,
        isActive: true,
    });

    // Filters & Pagination State
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    useEffect(() => {
        fetchDiscounts();
    }, []);

    async function fetchDiscounts() {
        try {
            setLoading(true);
            const data = await getDiscountCodes();
            // Sort by latest first
            const sortedData = [...data].sort((a, b) => b.discountId - a.discountId);
            setDiscounts(sortedData);
        } catch (error) {
            console.error("Failed to fetch discounts", error);
        } finally {
            setLoading(false);
        }
    }

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter]);

    const filteredDiscounts = discounts.filter((d) => {
        const matchesSearch = d.code.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === "ALL" || 
            (statusFilter === "ACTIVE" ? d.isActive : !d.isActive);
        return matchesSearch && matchesStatus;
    });

    const totalPages = Math.ceil(filteredDiscounts.length / pageSize);
    const paginatedDiscounts = filteredDiscounts.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    function handleOpenModal(discount?: DiscountCode) {
        if (discount) {
            setEditingId(discount.discountId);
            setForm({
                code: discount.code,
                discountType: discount.discountType,
                discountValue: discount.discountValue,
                minOrderValue: discount.minOrderValue,
                maxDiscountAmount: discount.maxDiscountAmount ?? undefined,
                maxUses: discount.maxUses ?? undefined,
                validFrom: discount.validFrom ? new Date(discount.validFrom).toISOString().slice(0, 16) : undefined,
                validTo: discount.validTo ? new Date(discount.validTo).toISOString().slice(0, 16) : undefined,
                isActive: discount.isActive,
            });
        } else {
            setEditingId(null);
            setForm({
                code: "",
                discountType: "PERCENT",
                discountValue: 0,
                minOrderValue: 0,
                isActive: true,
            });
        }
        setShowModal(true);
    }

    async function handleSave() {
        if (!form.code.trim()) {
            showError("Lỗi", "Vui lòng nhập mã giảm giá");
            return;
        }
        if (form.discountValue <= 0) {
            showError("Lỗi", "Giá trị giảm giả phải lớn hơn 0");
            return;
        }

        try {
            if (editingId) {
                await updateDiscountCode(editingId, form);
                showSuccess("Thành công", "Đã cập nhật mã giảm giá");
            } else {
                await createDiscountCode(form);
                showSuccess("Thành công", "Đã tạo mã giảm giá");
            }
            setShowModal(false);
            fetchDiscounts();
        } catch (err: any) {
            showError("Lỗi", err.message || "Không thể lưu mã giảm giá");
        }
    }

    async function handleDelete(id: number) {
        const confirmed = await showConfirm("Xác nhận xoá?", "Dữ liệu sẽ không thể khôi phục!");

        if (confirmed) {
            try {
                await deleteDiscountCode(id);
                showSuccess("Đã xoá", "Xoá thành công");
                fetchDiscounts();
            } catch (err: any) {
                showError("Lỗi", err.message || "Lỗi khi xoá");
            }
        }
    }

    async function handleToggle(id: number) {
        try {
            await toggleDiscountCode(id);
            fetchDiscounts();
        } catch (err: any) {
            showError("Lỗi", err.message || "Lỗi bật/tắt");
        }
    }

    if (loading) return <div className={styles.loading}>Đang tải...</div>;

    return (
        <div className={styles.contentCard}>
            <div className={styles.cardHeader}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <h1 className={styles.cardTitle}>Quản lý Mã giảm giá</h1>
                        <p className={styles.pageSubtitle}>Thiết lập các chương trình ưu đãi cho thực khách.</p>
                    </div>
                    <button className={styles.btnAdd} onClick={() => handleOpenModal()}>
                        + Thêm mã mới
                    </button>
                </div>
            </div>

            <div className={styles.filterBar}>
                <div className={styles.searchGroup}>
                    <svg className={styles.searchIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                    <input
                        type="text"
                        className={styles.searchInput}
                        placeholder="Tìm kiếm theo mã giảm giá..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className={styles.filterGroup}>
                    <select
                        className={styles.selectFilter}
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="ALL">Tất cả trạng thái</option>
                        <option value="ACTIVE">Đang bật</option>
                        <option value="INACTIVE">Đã tắt</option>
                    </select>

                    {(searchTerm || statusFilter !== "ALL") && (
                        <button 
                            className={styles.btnSecondary}
                            style={{ padding: '0.625rem 1rem', fontSize: '0.85rem' }}
                            onClick={() => {
                                setSearchTerm("");
                                setStatusFilter("ALL");
                            }}
                        >
                            Xoá lọc
                        </button>
                    )}
                </div>
            </div>

            <div className={styles.cardBody}>
                <div className={styles.tableWrap}>
                    <table className={styles.table}>
                        <thead>
                        <tr>
                            <th>Mã CODE</th>
                            <th>Loại</th>
                            <th>Giá trị</th>
                            <th>Đơn tối thiểu</th>
                            <th>Giảm tối đa</th>
                            <th>Lượt dùng</th>
                            <th>Trạng thái</th>
                            <th>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedDiscounts.length === 0 ? (
                            <tr>
                                <td colSpan={8} className={styles.empty}>
                                    {searchTerm || statusFilter !== "ALL" 
                                        ? "Không tìm thấy mã giảm giá nào phù hợp." 
                                        : "Chưa có mã giảm giá nào được tạo."}
                                </td>
                            </tr>
                        ) : (
                            paginatedDiscounts.map(d => (
                                <tr key={d.discountId}>
                                    <td style={{ fontWeight: 700, color: '#0f172a', fontSize: '1rem' }}>{d.code}</td>
                                    <td>
                                        <span style={{ 
                                            padding: '2px 8px', 
                                            background: d.discountType === "PERCENT" ? '#fef3c7' : '#dcfce7',
                                            color: d.discountType === "PERCENT" ? '#92400e' : '#166534',
                                            borderRadius: '4px',
                                            fontSize: '0.75rem',
                                            fontWeight: 700
                                        }}>
                                            {d.discountType === "PERCENT" ? "PHẦN TRĂM" : "TIỀN MẶT"}
                                        </span>
                                    </td>
                                    <td style={{ fontWeight: 600 }}>
                                        {d.discountValue.toLocaleString()} {d.discountType === "PERCENT" ? "%" : "đ"}
                                    </td>
                                    <td>{d.minOrderValue.toLocaleString()} đ</td>
                                    <td>{d.maxDiscountAmount ? `${d.maxDiscountAmount.toLocaleString()} đ` : '—'}</td>
                                    <td>
                                        <div style={{ fontSize: '0.85rem' }}>
                                            <b>{d.usedCount}</b> {d.maxUses ? `/ ${d.maxUses}` : '(Vô hạn)'}
                                        </div>
                                    </td>
                                    <td>
                                        <button 
                                            onClick={() => handleToggle(d.discountId)} 
                                            className={`${styles.statusBadge} ${d.isActive ? styles.statusPublished : styles.statusClosed}`} 
                                            style={{ cursor: 'pointer', border: 'none', appearance: 'none', width: '100px', justifyContent: 'center' }}
                                            title="Click để thay đổi trạng thái"
                                        >
                                            {d.isActive ? 'Đang bật' : 'Đã tắt'}
                                        </button>
                                    </td>
                                    <td>
                                        <div className={styles.btnRow}>
                                            <button className={styles.btnEdit} onClick={() => handleOpenModal(d)}>Sửa</button>
                                            <button className={styles.btnDelete} onClick={() => handleDelete(d.discountId)}>Xoá</button>
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
                            Hiển thị <b>{Math.min(filteredDiscounts.length, (currentPage - 1) * pageSize + 1)}-{Math.min(filteredDiscounts.length, currentPage * pageSize)}</b> trên tổng số <b>{filteredDiscounts.length}</b> mã
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

            {showModal && (
                <div className={styles.modalOverlay} onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
                    <div className={styles.modal} style={{ maxWidth: '600px' }}>
                        <div className={styles.modalHead}>
                            <span className={styles.modalTitle}>{editingId ? 'Sửa mã giảm giá' : 'Thêm mã giảm giá'}</span>
                            <button className={styles.modalClose} onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <div className={styles.modalBody} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className={styles.field}>
                                <label className={styles.label}>Mã giảm giá *</label>
                                <input className={styles.input} value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="VD: SUMMER10" />
                            </div>
                            <div className={styles.field}>
                                <label className={styles.label}>Loại giảm giá</label>
                                <select className={styles.select} value={form.discountType} onChange={e => setForm({ ...form, discountType: e.target.value })}>
                                    <option value="PERCENT">Phần trăm (%)</option>
                                    <option value="AMOUNT">Số tiền (VNĐ)</option>
                                </select>
                            </div>
                            <div className={styles.field}>
                                <label className={styles.label}>Giá trị giảm *</label>
                                <input type="number" min="0" step="0.1" className={styles.input} value={form.discountValue} onChange={e => setForm({ ...form, discountValue: Number(e.target.value) })} />
                            </div>
                            <div className={styles.field}>
                                <label className={styles.label}>Đơn tối thiểu (VNĐ)</label>
                                <input type="number" min="0" className={styles.input} value={form.minOrderValue} onChange={e => setForm({ ...form, minOrderValue: Number(e.target.value) })} />
                            </div>
                            <div className={styles.field}>
                                <label className={styles.label}>Giảm tối đa (VNĐ)</label>
                                <input type="number" min="0" className={styles.input} value={form.maxDiscountAmount || ''} onChange={e => setForm({ ...form, maxDiscountAmount: e.target.value ? Number(e.target.value) : undefined })} placeholder="Không giới hạn" />
                            </div>
                            <div className={styles.field}>
                                <label className={styles.label}>Lượt dùng tối đa</label>
                                <input type="number" min="1" className={styles.input} value={form.maxUses || ''} onChange={e => setForm({ ...form, maxUses: e.target.value ? Number(e.target.value) : undefined })} placeholder="Vô hạn" />
                            </div>
                            <div className={styles.field}>
                                <label className={styles.label}>Có hiệu lực từ</label>
                                <input type="datetime-local" className={styles.input} value={form.validFrom || ''} onChange={e => setForm({ ...form, validFrom: e.target.value || undefined })} />
                            </div>
                            <div className={styles.field}>
                                <label className={styles.label}>Hết hiệu lực vào</label>
                                <input type="datetime-local" className={styles.input} value={form.validTo || ''} onChange={e => setForm({ ...form, validTo: e.target.value || undefined })} />
                            </div>
                        </div>
                        <div className={styles.modalFoot}>
                            <button className={styles.btnCancel} onClick={() => setShowModal(false)}>Huỷ</button>
                            <button className={styles.btnSave} onClick={handleSave}>Lưu</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
