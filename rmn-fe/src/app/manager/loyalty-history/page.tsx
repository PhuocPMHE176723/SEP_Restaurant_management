"use client";

import { useEffect, useState } from "react";
import { LoyaltyLedger } from "../../../types/models/promotion";
import { getLoyaltyLedgers } from "../../../lib/api/promotion";
import styles from "../manager.module.css";

export default function LoyaltyHistoryPage() {
    const [ledgers, setLedgers] = useState<LoyaltyLedger[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLedgers();
    }, []);

    async function fetchLedgers() {
        try {
            setLoading(true);
            const data = await getLoyaltyLedgers();
            setLedgers(data);
        } catch (error) {
            console.error("Failed to fetch loyalty ledgers", error);
        } finally {
            setLoading(false);
        }
    }

    if (loading) return <div className={styles.loading}>Đang tải...</div>;

    return (
        <div className={styles.page}>
            <header className={styles.pageHeader}>
                <h1 className={styles.pageTitle}>Lịch sử Tích / Đổi điểm</h1>
            </header>

            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Mã Giao Dịch</th>
                            <th>Khách hàng</th>
                            <th>SĐT Khách hàng</th>
                            <th>Phân loại</th>
                            <th>Mã tham chiếu</th>
                            <th>Biến động Điểm</th>
                            <th>Ghi chú</th>
                            <th>Nhân viên thực hiện</th>
                            <th>Thời gian</th>
                        </tr>
                    </thead>
                    <tbody>
                        {ledgers.length === 0 ? (
                            <tr><td colSpan={9} className={styles.empty}>Không có lịch sử biến động điểm</td></tr>
                        ) : (
                            ledgers.map(l => (
                                <tr key={l.ledgerId}>
                                    <td>#{l.ledgerId}</td>
                                    <td>{l.customerName}</td>
                                    <td>{l.customerPhone}</td>
                                    <td>
                                        <span className={`${styles.badge} ${l.refType === 'INVOICE' ? styles.badgeAvailable : l.refType === 'REDEEM' ? styles.badgeReserved : styles.badgeOccupied}`}>
                                            {l.refType}
                                        </span>
                                    </td>
                                    <td>{l.refId ? `#${l.refId}` : '-'}</td>
                                    <td style={{ fontWeight: 600, color: l.pointsChange > 0 ? '#16a34a' : '#dc2626' }}>
                                        {l.pointsChange > 0 ? `+${l.pointsChange}` : l.pointsChange}
                                    </td>
                                    <td>{l.note || '-'}</td>
                                    <td>{l.createdByStaffName || 'Hệ thống'}</td>
                                    <td>{new Date(l.createdAt).toLocaleString('vi-VN')}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
