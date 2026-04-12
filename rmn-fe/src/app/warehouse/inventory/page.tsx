"use client";

import { useEffect, useState } from "react";
import { getInventoryOnHand } from "../../../lib/api/warehouse";
import { exportInventoryPDF } from "../../../lib/exportPDF";
import managerStyles from "../../manager/manager.module.css";
import localStyles from "../warehouse.module.css";
import { Search, Filter, Download } from "lucide-react";
import { format } from "date-fns";

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
        <div className={managerStyles.pageContainer}>
            <header className={localStyles.pageHeader}>
                <div className={localStyles.titleGroup}>
                    <h1 className={localStyles.pageTitle}>Kho nguyên liệu</h1>
                    <p className={localStyles.pageSubtitle}>Tồn kho hiện tại & cảnh báo</p>
                </div>
                <button 
                    className={managerStyles.btnAdd} 
                    style={{ background: "#dc2626", boxShadow: '0 4px 12px rgba(220, 38, 38, 0.2)' }}
                    onClick={() => exportInventoryPDF(displayItems.map(c => ({ ...c, status: getStatus(c) === "HET" ? "Het" : getStatus(c) === "SAP_HET" ? "Sap het" : "On dinh" })))}
                >
                    <Download size={18} style={{ marginRight: '4px' }} /> Xuất PDF
                </button>
            </header>

            <div className={localStyles.premiumFilterBar}>
                <div className={localStyles.searchGroup}>
                    <Search size={20} />
                    <input 
                        type="text" 
                        placeholder="Tìm nguyên liệu..." 
                        value={searchTerm} 
                        onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }} 
                    />
                </div>
                
                <div className={`${localStyles.searchGroup} ${localStyles.selectGroup}`}>
                    <Filter size={20} />
                    <select 
                        value={filterStatus} 
                        onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                    >
                        <option value="ALL">Tất cả tồn kho</option>
                        <option value="ON_DINH">Ổn định ({'>'}20%)</option>
                        <option value="SAP_HET">Sắp hết (≤20%)</option>
                        <option value="HET">Hết kho (0)</option>
                    </select>
                </div>

                <div className={`${localStyles.searchGroup} ${localStyles.selectGroup}`}>
                    <Filter size={20} />
                    <select 
                        value={filterIngredient} 
                        onChange={e => { setFilterIngredient(e.target.value); setCurrentPage(1); }}
                    >
                        <option value="ALL">Tất cả nguyên liệu</option>
                        {[...items].sort((a, b) => a.ingredientName.localeCompare(b.ingredientName)).map(i => (
                            <option key={i.ingredientId} value={i.ingredientName}>{i.ingredientName}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className={localStyles.premiumTableCard}>
                <table className={localStyles.premiumTable}>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Nguyên liệu</th>
                            <th style={{ textAlign: 'right' }}>Số lượng tồn</th>
                            <th>ĐVT</th>
                            <th>Trạng thái</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Đang tải...</td></tr>
                        ) : paginatedItems.length === 0 ? (
                            <tr><td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Không có dữ liệu phù hợp</td></tr>
                        ) : paginatedItems.map((c, i) => (
                            <tr key={c.ingredientId}>
                                <td>{(currentPage - 1) * itemsPerPage + i + 1}</td>
                                <td><strong style={{ color: '#0f172a' }}>{c.ingredientName}</strong></td>
                                <td style={{ textAlign: 'right' }}>
                                    {(() => {
                                        const status = getStatus(c);
                                        const badgeClass = status === "HET" ? localStyles.textDanger : status === "SAP_HET" ? localStyles.textWarning : localStyles.textSuccess;
                                        return <span className={`${localStyles.stockValue} ${badgeClass}`}>{c.currentStock.toLocaleString("vi-VN")}</span>;
                                    })()}
                                </td>
                                <td><span className={localStyles.unitLabel}>{c.unit}</span></td>
                                <td>
                                    {(() => {
                                        const status = getStatus(c);
                                        const badgeClass = status === "HET" ? localStyles.badgeDanger : status === "SAP_HET" ? localStyles.badgeWarning : localStyles.badgeSuccess;
                                        return <span className={`${localStyles.badge} ${badgeClass}`}>
                                            {status === "HET" ? "HẾT KHO" : status === "SAP_HET" ? "SẮP HẾT" : "ỔN ĐỊNH"}
                                        </span>;
                                    })()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className={managerStyles.pagination}>
                    <div className={managerStyles.pageInfo}>
                        Hiển thị <strong>{(currentPage - 1) * itemsPerPage + 1}</strong> đến <strong>{Math.min(currentPage * itemsPerPage, displayItems.length)}</strong> trong <strong>{displayItems.length}</strong> kết quả
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
        </div>
    );
}
