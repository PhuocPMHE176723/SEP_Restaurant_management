"use client";

import React, { useEffect, useState } from "react";
import { getInventoryAudits } from "@/lib/api/warehouse";
import styles from "../manager.module.css";
import { format } from "date-fns";
import { Search, Plus, Filter, RefreshCw, Eye } from "lucide-react";
import Link from "next/link";

interface Audit {
    auditId: number;
    auditCode: string;
    auditDate: string;
    staffName: string;
    note: string;
    itemCount: number;
}

export default function InventoryAuditPage() {
    const [audits, setAudits] = useState<Audit[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchAudits = async () => {
        try {
            setLoading(true);
            const data = await getInventoryAudits();
            setAudits(data);
        } catch (error) {
            console.error("Failed to fetch audits:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAudits();
    }, []);

    const filteredAudits = audits.filter(a => 
        a.auditCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.staffName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Lịch sử Kiểm kho</h1>
                    <p className={styles.subtitle}>Quản lý các phiếu kiểm kê và đối soát hao tổn nguyên liệu</p>
                </div>
                <Link href="/manager/inventory-audit/create" className={styles.addBtn}>
                    <Plus size={20} />
                    Tạo phiếu kiểm kho
                </Link>
            </div>

            <div className={styles.filterBar}>
                <div className={styles.searchGroup}>
                    <Search className={styles.searchIcon} size={20} />
                    <input 
                        type="text" 
                        placeholder="Tìm theo mã phiếu hoặc người kiểm..." 
                        className={styles.searchInput}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button className={styles.refreshBtn} onClick={fetchAudits}>
                    <RefreshCw size={20} />
                </button>
            </div>

            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Mã phiếu</th>
                            <th>Ngày kiểm</th>
                            <th>Người kiểm</th>
                            <th>Số mặt hàng</th>
                            <th>Ghi chú</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={6} style={{ textAlign: "center" }}>Đang tải...</td></tr>
                        ) : filteredAudits.length === 0 ? (
                            <tr><td colSpan={6} style={{ textAlign: "center" }}>Không tìm thấy phiếu kiểm kê nào</td></tr>
                        ) : (
                            filteredAudits.map((audit) => (
                                <tr key={audit.auditId}>
                                    <td className={styles.codeCell}>{audit.auditCode}</td>
                                    <td>{format(new Date(audit.auditDate), "dd/MM/yyyy HH:mm")}</td>
                                    <td>{audit.staffName}</td>
                                    <td>{audit.itemCount}</td>
                                    <td>{audit.note || "-"}</td>
                                    <td>
                                        <Link href={`/manager/inventory-audit/${audit.auditId}`} className={styles.actionBtn}>
                                            <Eye size={18} />
                                            Chi tiết
                                        </Link>
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
