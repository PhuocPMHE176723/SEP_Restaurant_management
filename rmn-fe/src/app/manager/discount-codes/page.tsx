"use client";

import { useEffect, useState } from "react";
import { DiscountCode, CreateDiscountCode } from "../../../types/models/promotion";
import { getDiscountCodes, createDiscountCode, updateDiscountCode, deleteDiscountCode, toggleDiscountCode } from "../../../lib/api/promotion";
import styles from "../manager.module.css";
import Swal from "sweetalert2";

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

    useEffect(() => {
        fetchDiscounts();
    }, []);

    async function fetchDiscounts() {
        try {
            setLoading(true);
            const data = await getDiscountCodes();
            setDiscounts(data);
        } catch (error) {
            console.error("Failed to fetch discounts", error);
        } finally {
            setLoading(false);
        }
    }

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
            Swal.fire("Lỗi", "Vui lòng nhập mã giảm giá", "error");
            return;
        }
        if (form.discountValue <= 0) {
            Swal.fire("Lỗi", "Giá trị giảm giả phải lớn hơn 0", "error");
            return;
        }

        try {
            if (editingId) {
                await updateDiscountCode(editingId, form);
                Swal.fire("Thành công", "Đã cập nhật mã giảm giá", "success");
            } else {
                await createDiscountCode(form);
                Swal.fire("Thành công", "Đã tạo mã giảm giá", "success");
            }
            setShowModal(false);
            fetchDiscounts();
        } catch (err: any) {
            Swal.fire("Lỗi", err.message || "Không thể lưu mã giảm giá", "error");
        }
    }

    async function handleDelete(id: number) {
        const result = await Swal.fire({
            title: "Xác nhận xoá?",
            text: "Dữ liệu sẽ không thể khôi phục!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Xoá",
            cancelButtonText: "Huỷ"
        });

        if (result.isConfirmed) {
            try {
                await deleteDiscountCode(id);
                Swal.fire("Đã xoá", "Xoá thành công", "success");
                fetchDiscounts();
            } catch (err: any) {
                Swal.fire("Lỗi", err.message || "Lỗi khi xoá", "error");
            }
        }
    }

    async function handleToggle(id: number) {
        try {
            await toggleDiscountCode(id);
            fetchDiscounts();
        } catch (err: any) {
            Swal.fire("Lỗi", err.message || "Lỗi bật/tắt", "error");
        }
    }

    if (loading) return <div className={styles.loading}>Đang tải...</div>;

    return (
        <div className={styles.contentCard}>
            <div className={styles.cardHeader}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <h1 className={styles.cardTitle}>Quản lý Mã giảm giá</h1>
                        <p className={styles.pageSubtitle}>Danh sách mã giảm giá — {discounts.length} mã</p>
                    </div>
                    <button className={styles.btnAdd} onClick={() => handleOpenModal()}>
                        + Thêm mã mới
                    </button>
                </div>
            </div>

            <div className={styles.cardBody}>
                <div className={styles.tableWrap}>
                    <table className={styles.table}>
                        <thead>
                        <tr>
                            <th>Mã KH</th>
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
                        {discounts.length === 0 ? (
                            <tr><td colSpan={8} className={styles.empty}>Không có mã giảm giá nào</td></tr>
                        ) : (
                            discounts.map(d => (
                                <tr key={d.discountId}>
                                    <td style={{ fontWeight: 600, color: '#2563eb' }}>{d.code}</td>
                                    <td>{d.discountType === "PERCENT" ? "%" : "VNĐ"}</td>
                                    <td>{d.discountValue.toLocaleString()}</td>
                                    <td>{d.minOrderValue.toLocaleString()}</td>
                                    <td>{d.maxDiscountAmount ? d.maxDiscountAmount.toLocaleString() : '-'}</td>
                                    <td>{d.usedCount} {d.maxUses ? `/ ${d.maxUses}` : '(Vô hạn)'}</td>
                                    <td>
                                        <button onClick={() => handleToggle(d.discountId)} className={`${styles.badge} ${d.isActive ? styles.badgeAvailable : styles.badgeInactive}`} style={{ cursor: 'pointer', border: 'none' }}>
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
