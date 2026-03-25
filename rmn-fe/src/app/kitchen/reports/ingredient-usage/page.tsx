"use client";

import React, { useEffect, useState } from "react";
import { getConsumptionReport } from "@/lib/api/warehouse";
import { format, startOfMonth, endOfMonth } from "date-fns";
import styles from "../../../manager/manager.module.css";
import { BarChart3, Calendar, Download, Filter } from "lucide-react";
import { toast } from "react-hot-toast";

interface ConsumptionData {
    ingredientId: number;
    ingredientName: string;
    unit: string;
    orderConsumption: number;
    auditLoss: number;
    auditGain: number;
    totalUsage: number;
}

export default function IngredientUsagePage() {
    const [reportData, setReportData] = useState<ConsumptionData[]>([]);
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"));
    const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), "yyyy-MM-dd"));

    const fetchReport = async () => {
        try {
            setLoading(true);
            const data = await getConsumptionReport(startDate, endDate);
            setReportData(data);
        } catch (error: any) {
            toast.error(error.message || "Lỗi khi tải báo cáo");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchReport();
    };

    return (
        <div className={styles.pageContainer}>
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.pageTitle}>Báo cáo Tiêu hao Nguyên liệu</h1>
                    <p className={styles.pageSubtitle}>Theo dõi lượng nguyên liệu đã sử dụng và hao hụt</p>
                </div>
                <button className={styles.btnAdd} onClick={() => window.print()}>
                    <Download size={18} /> Xuất PDF
                </button>
            </div>

            <div className={styles.card} style={{ marginBottom: "1.5rem" }}>
                <form onSubmit={handleSearch} className={styles.controlBar} style={{ display: "flex", gap: "1rem", alignItems: "flex-end" }}>
                    <div className={styles.field} style={{ marginBottom: 0 }}>
                        <label className={styles.label}>Từ ngày</label>
                        <input 
                            type="date" 
                            className={styles.input} 
                            value={startDate} 
                            onChange={(e) => setStartDate(e.target.value)} 
                        />
                    </div>
                    <div className={styles.field} style={{ marginBottom: 0 }}>
                        <label className={styles.label}>Đến ngày</label>
                        <input 
                            type="date" 
                            className={styles.input} 
                            value={endDate} 
                            onChange={(e) => setEndDate(e.target.value)} 
                        />
                    </div>
                    <button type="submit" className={styles.btnPrimary} style={{ height: "42px" }}>
                        <Filter size={18} /> Lọc dữ liệu
                    </button>
                </form>
            </div>

            {loading ? (
                <div className={styles.spinner} />
            ) : (
                <div className={styles.card}>
                    <div className={styles.tableWrap}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Nguyên liệu</th>
                                    <th>Đơn vị</th>
                                    <th style={{ textAlign: "right" }}>Tiêu thụ (Bán hàng)</th>
                                    <th style={{ textAlign: "right" }}>Hao hụt (Kiểm kê)</th>
                                    <th style={{ textAlign: "right" }}>Thặng dư (Kiểm kê)</th>
                                    <th style={{ textAlign: "right", color: "#6366f1" }}>Tổng tiêu thụ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reportData.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} style={{ textAlign: "center", padding: "2rem" }}>
                                            Không có dữ liệu tiêu hao trong khoảng thời gian này
                                        </td>
                                    </tr>
                                ) : (
                                    reportData.map((item) => (
                                        <tr key={item.ingredientId}>
                                            <td><strong>{item.ingredientName}</strong></td>
                                            <td>{item.unit}</td>
                                            <td style={{ textAlign: "right" }}>{item.orderConsumption.toLocaleString()}</td>
                                            <td style={{ textAlign: "right", color: "#ef4444" }}>
                                                {item.auditLoss > 0 ? `+${item.auditLoss.toLocaleString()}` : "-"}
                                            </td>
                                            <td style={{ textAlign: "right", color: "#10b981" }}>
                                                {item.auditGain > 0 ? `+${item.auditGain.toLocaleString()}` : "-"}
                                            </td>
                                            <td style={{ textAlign: "right", fontWeight: "700", color: "#4f46e5" }}>
                                                {item.totalUsage.toLocaleString()}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <div style={{ marginTop: "1rem", color: "#64748b", fontSize: "0.875rem" }}>
                <p>* <strong>Tổng tiêu thụ</strong> = Tiêu thụ bán hàng + Hao hụt kiểm kê - Thặng dư kiểm kê.</p>
                <p>* Dữ liệu chỉ bao gồm các món ăn đã được xác nhận "Xong món" (SERVED).</p>
            </div>
        </div>
    );
}
