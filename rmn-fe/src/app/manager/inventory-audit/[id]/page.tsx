"use client";

import React, { useEffect, useState } from "react";
import { getInventoryAuditById } from "@/lib/api/warehouse";
import styles from "../../manager.module.css";
import { format } from "date-fns";
import { ArrowLeft, Printer, Info } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface AuditDetail {
    auditId: number;
    auditCode: string;
    auditDate: string;
    staff: { fullName: string };
    note: string;
    auditItems: {
        auditItemId: number;
        ingredient: { ingredientName: string; unit: string };
        systemQuantity: number;
        actualQuantity: number;
        difference: number;
    }[];
}

export default function AuditDetailPage() {
    const { id } = useParams();
    const [audit, setAudit] = useState<AuditDetail | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await getInventoryAuditById(Number(id));
                setAudit(data);
            } catch (error) {
                console.error("Failed to fetch audit detail:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    if (loading) return <div className={styles.container}>Đang tải...</div>;
    if (!audit) return <div className={styles.container}>Không tìm thấy phiếu kiểm kê</div>;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <Link href="/manager/inventory-audit" className={styles.backBtn}>
                    <ArrowLeft size={20} />
                    Quay lại
                </Link>
                <h1 className={styles.title}>Chi tiết phiếu kiểm kho #{audit.auditCode}</h1>
                <button className={styles.addBtn} onClick={() => window.print()}>
                    <Printer size={20} />
                    In phiếu
                </button>
            </div>

            <div className={styles.card} style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                    <div>
                        <p><strong>Ngày kiểm:</strong> {format(new Date(audit.auditDate), "dd/MM/yyyy HH:mm")}</p>
                        <p><strong>Người thực hiện:</strong> {audit.staff.fullName}</p>
                    </div>
                    <div>
                        <p><strong>Ghi chú:</strong> {audit.note || "Không có"}</p>
                    </div>
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
                        {audit.auditItems.map((item) => (
                            <tr key={item.auditItemId}>
                                <td>{item.ingredient.ingredientName}</td>
                                <td>{item.ingredient.unit}</td>
                                <td>{item.systemQuantity.toLocaleString()}</td>
                                <td>{item.actualQuantity.toLocaleString()}</td>
                                <td style={{ color: item.difference === 0 ? 'inherit' : item.difference > 0 ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>
                                    {item.difference > 0 ? `+${item.difference.toLocaleString()}` : item.difference.toLocaleString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div style={{ marginTop: '2rem', display: 'flex', alignItems: 'center', gap: '10px', color: '#666', fontSize: '14px' }}>
                <Info size={16} />
                <p>Số lượng chênh lệch đã được hệ thống tự động điều chỉnh vào sổ kho ngay sau khi chốt phiếu.</p>
            </div>
        </div>
    );
}
