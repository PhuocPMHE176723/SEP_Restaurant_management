"use client";

import React, { useEffect, useState } from "react";
import { getStockMovements, getIngredients } from "@/lib/api/warehouse";
import styles from "../../manager/manager.module.css";
import { format } from "date-fns";
import { History, Calendar, Filter, FileText, Search, User } from "lucide-react";

interface StockMovement {
    movementId: number;
    ingredientId: number;
    ingredientName: string;
    unit: string;
    movementType: string;
    quantity: number;
    refType: string;
    refId?: number;
    movedAt: string;
    createdByStaffName: string;
    note: string;
}

interface Ingredient {
    ingredientId: number;
    ingredientName: string;
}

export default function StockHistoryPage() {
    const [movements, setMovements] = useState<StockMovement[]>([]);
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Filters
    const [startDate, setStartDate] = useState(format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), "yyyy-MM-dd"));
    const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
    const [selectedIngredient, setSelectedIngredient] = useState<string>("");

    const fetchData = async () => {
        try {
            setLoading(true);
            const [movementData, ingredientData] = await Promise.all([
                getStockMovements(startDate, endDate, selectedIngredient ? parseInt(selectedIngredient) : undefined),
                getIngredients()
            ]);
            setMovements(movementData);
            setIngredients(ingredientData);
        } catch (error) {
            console.error("Failed to fetch stock history:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        fetchData();
    };

    const getRefText = (type: string, id?: number) => {
        if (!type) return "-";
        switch (type) {
            case "PURCHASE_RECEIPT": return `Nhập hàng #${id}`;
            case "ORDER_ITEM": return `Xuất món — Order #${id}`;
            case "AUDIT": return `Kiểm kho #${id}`;
            case "ADJUSTMENT": return `Điều chỉnh`;
            default: return type;
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header} style={{ marginBottom: "1.5rem" }}>
                <div>
                    <h1 className={styles.title}>Lịch sử biến động kho</h1>
                    <p className={styles.subtitle}>Chi tiết các lượt nhập, xuất và điều chỉnh nguyên liệu</p>
                </div>
                <div className={styles.statsRow} style={{ display: 'flex', gap: '1rem' }}>
                    <div className={styles.statChip} style={{ background: '#eff6ff', color: '#2563eb', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600 }}>
                        {movements.length} giao dịch
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <form className={styles.filterBar} style={{ marginBottom: "2rem" }} onSubmit={handleFilter}>
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
                <div className={styles.field} style={{ marginBottom: 0, minWidth: '200px' }}>
                    <label className={styles.label}>Nguyên liệu</label>
                    <select 
                        className={styles.select} 
                        value={selectedIngredient} 
                        onChange={(e) => setSelectedIngredient(e.target.value)}
                    >
                        <option value="">Tất cả nguyên liệu</option>
                        {ingredients.map(ing => (
                            <option key={ing.ingredientId} value={ing.ingredientId}>{ing.ingredientName}</option>
                        ))}
                    </select>
                </div>
                <button type="submit" className={styles.btnPrimary} style={{ height: "42px", marginTop: "auto" }}>
                    <Filter size={18} /> Lọc
                </button>
            </form>

            <div className={styles.tableWrap}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Thời gian</th>
                            <th>Nguyên liệu</th>
                            <th>Loại</th>
                            <th>Số lượng</th>
                            <th>Lý do / Nguồn</th>
                            <th>Người thực hiện</th>
                            <th>Ghi chú</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={7} className={styles.loading}>Đang tải dữ liệu...</td></tr>
                        ) : movements.length === 0 ? (
                            <tr><td colSpan={7} className={styles.empty}>Không có dữ liệu biến động trong khoảng thời gian này</td></tr>
                        ) : (
                            movements.map((m) => (
                                <tr key={m.movementId}>
                                    <td style={{ whiteSpace: "nowrap" }}>
                                        {format(new Date(m.movedAt), "dd/MM/yyyy HH:mm")}
                                    </td>
                                    <td><strong>{m.ingredientName}</strong></td>
                                    <td>
                                        <span className={`${styles.statusBadge} ${m.movementType === 'IN' ? styles.statusPublished : styles.statusCancelled}`}>
                                            {m.movementType === 'IN' ? 'NHẬP' : 'XUẤT'}
                                        </span>
                                    </td>
                                    <td style={{ fontWeight: 700, color: m.movementType === 'IN' ? '#059669' : '#dc2626' }}>
                                        {m.movementType === 'IN' ? '+' : '-'}{m.quantity} {m.unit}
                                    </td>
                                    <td>
                                        <div style={{ fontSize: '0.85rem', color: '#475569' }}>
                                            {getRefText(m.refType, m.refId)}
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}>
                                            <User size={14} /> {m.createdByStaffName || "Hệ thống"}
                                        </div>
                                    </td>
                                    <td>
                                        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{m.note || "—"}</span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
