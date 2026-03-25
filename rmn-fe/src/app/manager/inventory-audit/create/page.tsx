"use client";

import React, { useEffect, useState } from "react";
import { getInventoryOnHand, createInventoryAudit } from "@/lib/api/warehouse";
import styles from "../../manager.module.css";
import { Save, X, ArrowLeft, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

interface InventoryItem {
    ingredientId: number;
    ingredientName: string;
    unit: string;
    quantityOnHand: number;
}

export default function CreateAuditPage() {
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [actualQuantities, setActualQuantities] = useState<Record<number, number>>({});
    const [note, setNote] = useState("");
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await getInventoryOnHand();
                setItems(data);
                // Initialize actual quantities with system values
                const initialQty: Record<number, number> = {};
                data.forEach((item: InventoryItem) => {
                    initialQty[item.ingredientId] = item.quantityOnHand;
                });
                setActualQuantities(initialQty);
            } catch (error) {
                toast.error("Không thể tải dữ liệu tồn kho");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleQtyChange = (id: number, val: string) => {
        const num = parseFloat(val);
        setActualQuantities(prev => ({
            ...prev,
            [id]: isNaN(num) ? 0 : num
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            const auditItems = items.map(item => ({
                ingredientId: item.ingredientId,
                actualQuantity: actualQuantities[item.ingredientId] || 0
            }));

            await createInventoryAudit({
                note,
                items: auditItems
            });

            toast.success("Đã tạo phiếu kiểm kê và điều chỉnh tồn kho thành công!");
            router.push("/manager/inventory-audit");
        } catch (error: any) {
            toast.error(error.message || "Lỗi khi tạo phiếu kiểm kê");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className={styles.container}>Đang tải...</div>;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <Link href="/manager/inventory-audit" className={styles.backBtn}>
                    <ArrowLeft size={20} />
                    Quay lại
                </Link>
                <h1 className={styles.title}>Tạo phiếu kiểm kho mới</h1>
            </div>

            <form onSubmit={handleSubmit}>
                <div className={styles.card} style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Ghi chú kiểm kê</label>
                        <textarea 
                            className={styles.textarea} 
                            placeholder="Nhập lý do kiểm kê, tình trạng kho..."
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                        />
                    </div>
                </div>

                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Tên nguyên liệu</th>
                                <th>Đơn vị</th>
                                <th>Tồn hệ thống</th>
                                <th>Tồn thực tế</th>
                                <th>Chênh lệch</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item) => {
                                const systemQty = item.quantityOnHand;
                                const actualQty = actualQuantities[item.ingredientId] || 0;
                                const diff = actualQty - systemQty;
                                
                                return (
                                    <tr key={item.ingredientId}>
                                        <td>{item.ingredientName}</td>
                                        <td>{item.unit}</td>
                                        <td>{systemQty.toLocaleString()}</td>
                                        <td>
                                            <input 
                                                type="number" 
                                                step="0.001"
                                                className={styles.input}
                                                style={{ width: '120px' }}
                                                value={actualQty}
                                                onChange={(e) => handleQtyChange(item.ingredientId, e.target.value)}
                                            />
                                        </td>
                                        <td style={{ color: diff === 0 ? 'inherit' : diff > 0 ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>
                                            {diff > 0 ? `+${diff.toLocaleString()}` : diff.toLocaleString()}
                                            {diff !== 0 && <AlertTriangle size={14} style={{ marginLeft: '4px', verticalAlign: 'middle' }} />}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <div className={styles.actionBar} style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                    <button 
                        type="button" 
                        className={styles.cancelBtn} 
                        onClick={() => router.push("/manager/inventory-audit")}
                        disabled={submitting}
                    >
                        Hủy bỏ
                    </button>
                    <button type="submit" className={styles.addBtn} disabled={submitting}>
                        {submitting ? "Đang lưu..." : <><Save size={20} /> Hoàn tất kiểm kê</>}
                    </button>
                </div>
            </form>
        </div>
    );
}
