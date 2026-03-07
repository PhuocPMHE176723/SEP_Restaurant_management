"use client";

import { useEffect, useState } from "react";
import { getInventoryOnHand } from "../../../lib/api/warehouse";
import { exportInventoryPDF } from "../../../lib/exportPDF";
import styles from "../../admin/admin.module.css";

import { InventoryOnHandResponse as Inventory } from "../../../types/models";

export default function InventoryPage() {
    const [items, setItems] = useState<Inventory[]>([]);
    const [loading, setLoading] = useState(true);

    // Filter & Pagination state
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("ALL");
    const [filterIngredient, setFilterIngredient] = useState("ALL");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    useEffect(() => {
        async function load() {
            setLoading(true);
            try {
                const res = await getInventoryOnHand();
                setItems(res.data || res);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    // Compute max stock per ingredient from stock movements via API
    // We derive it here by taking each ingredient's peak positive running total
    // Status logic:
    // - Hết: currentStock === 0
    // - Sắp hết: 0 < currentStock <= 20% of maxStock
    // - Ổn định: currentStock > 20% of maxStock
    function getStatus(item: Inventory) {
        if (item.currentStock <= 0) return "HET";
        const threshold = (item.maxStock ?? 0) * 0.2;
        if (item.currentStock <= threshold) return "SAP_HET";
        return "ON_DINH";
    }

    const displayItems = items.filter(c => {
        const matchSearch = c.ingredientName.toLowerCase().includes(searchTerm.toLowerCase());
        const status = getStatus(c);
        const matchStatus = filterStatus === "ALL" 
            || (filterStatus === "HET" && status === "HET")
            || (filterStatus === "SAP_HET" && status === "SAP_HET")
            || (filterStatus === "ON_DINH" && status === "ON_DINH");
        const matchIngredient = filterIngredient === "ALL" || c.ingredientName === filterIngredient;
        return matchSearch && matchStatus && matchIngredient;
    });

    const totalPages = Math.ceil(displayItems.length / itemsPerPage);
    const paginatedItems = displayItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div className={styles.contentCard}>
            <div className={styles.cardHeader}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                    <div>
                        <h1 className={styles.cardTitle}>Kho nguyên liệu</h1>
                        <p className={styles.pageSubtitle}>Tồn kho hiện tại &amp; cảnh báo</p>
                    </div>
                    <button 
                        className={styles.btnAdd} 
                        style={{ background: "#dc2626" }}
                        onClick={() => exportInventoryPDF(displayItems.map(c => ({ ...c, status: getStatus(c) === "HET" ? "Het" : getStatus(c) === "SAP_HET" ? "Sap het" : "On dinh" })))}
                    >
                        ↓ Xuất PDF
                    </button>
                </div>
            </div>

            <div className={styles.cardBody}>
                <div className={styles.filterBar}>
                    <input 
                        type="text" 
                        className={styles.searchInput}
                        placeholder="Tìm nguyên liệu..." 
                        value={searchTerm} 
                        onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }} 
                    />
                    <select 
                        className={styles.input} 
                        style={{ width: "auto" }}
                        value={filterStatus} 
                        onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                    >
                        <option value="ALL">Tất cả tồn kho</option>
                        <option value="ON_DINH">Ổn định (&gt;20% số giao nhận)</option>
                        <option value="SAP_HET">Sắp hết (≤20%)</option>
                        <option value="HET">Hết kho (0)</option>
                    </select>
                    <select 
                        className={styles.input} 
                        style={{ width: "auto" }}
                        value={filterIngredient} 
                        onChange={e => { setFilterIngredient(e.target.value); setCurrentPage(1); }}
                    >
                        <option value="ALL">Tất cả nguyên liệu</option>
                        {[...items].sort((a, b) => a.ingredientName.localeCompare(b.ingredientName)).map(i => (
                            <option key={i.ingredientId} value={i.ingredientName}>{i.ingredientName}</option>
                        ))}
                    </select>
                </div>

                <div className={styles.tableWrap}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Nguyên liệu</th>
                                <th>Số lượng tồn</th>
                                <th>ĐVT</th>
                                <th>Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={5} className={styles.loading}>Đang tải...</td></tr>
                            ) : paginatedItems.length === 0 ? (
                                <tr><td colSpan={5} className={styles.empty}>Không có dữ liệu phù hợp</td></tr>
                            ) : paginatedItems.map((c, i) => (
                                <tr key={c.ingredientId}>
                                    <td>{(currentPage - 1) * itemsPerPage + i + 1}</td>
                                    <td><strong>{c.ingredientName}</strong></td>
                                    <td>
                                        {(() => {
                                            const status = getStatus(c);
                                            const color = status === "HET" ? "#ef4444" : status === "SAP_HET" ? "#f59e0b" : "#10b981";
                                            return <span style={{ color, fontWeight: "bold" }}>{c.currentStock.toLocaleString("vi-VN")}</span>;
                                        })()}
                                    </td>
                                    <td>{c.unit}</td>
                                    <td>
                                        {(() => {
                                            const status = getStatus(c);
                                            if (status === "HET") return <span className={`${styles.badge} ${styles.badgeInactive}`} style={{ background: "#ef4444", color: "#fff" }}>Hết</span>;
                                            if (status === "SAP_HET") return <span className={`${styles.badge} ${styles.badgeInactive}`}>Sắp hết</span>;
                                            return <span className={`${styles.badge} ${styles.badgeActive}`}>Ổn định</span>;
                                        })()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {totalPages > 1 && (
                    <div className={styles.pagination}>
                        <div className={styles.pageInfo}>
                            Hiển thị từ {(currentPage - 1) * itemsPerPage + 1} đến {Math.min(currentPage * itemsPerPage, displayItems.length)} trong {displayItems.length} kết quả
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
        </div>
    );
}
