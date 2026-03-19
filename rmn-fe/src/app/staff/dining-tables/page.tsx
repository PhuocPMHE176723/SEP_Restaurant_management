"use client";

import { useState, useEffect } from "react";
import { diningTableApi } from "../../../lib/api/dining-table";
import type { DiningTableResponse } from "../../../types/models";
import Pagination from "../../../components/Pagination";
import styles from "../../manager/manager.module.css";

export default function StaffTablesPage() {
  const [allTables, setAllTables] = useState<DiningTableResponse[]>([]);
  const [filteredTables, setFilteredTables] = useState<DiningTableResponse[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);

  useEffect(() => {
    fetchTables();
  }, []);

  useEffect(() => {
    filterTables();
  }, [allTables, statusFilter, searchTerm]);

  const fetchTables = async () => {
    try {
      const data = await diningTableApi.getAllTables();
      setAllTables(data);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch tables:", error);
      setLoading(false);
    }
  };

  const filterTables = () => {
    let filtered = allTables;

    if (statusFilter !== "ALL") {
      filtered = filtered.filter((table) => table.status === statusFilter);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (table) =>
          table.tableCode.toLowerCase().includes(term) ||
          table.tableName?.toLowerCase().includes(term),
      );
    }

    setFilteredTables(filtered);
    setCurrentPage(1);
  };

  // Pagination calculations
  const totalItems = filteredTables.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentTables = filteredTables.slice(startIndex, startIndex + itemsPerPage);

  const getStatusText = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return "Trống";
      case "OCCUPIED":
        return "Có khách";
      case "RESERVED":
        return "Đã đặt";
      case "MAINTENANCE":
        return "Bảo trì";
      default:
        return status;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case "AVAILABLE": return styles.statusPublished;
      case "OCCUPIED": return styles.statusCancelled;
      case "RESERVED": return styles.statusPending;
      case "MAINTENANCE": return styles.statusClosed;
      default: return styles.statusDefault;
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Danh sách bàn</h1>
          <p className={styles.pageSubtitle}>
            Xem và quản lý tình trạng tất cả bàn trong nhà hàng
          </p>
        </div>
      </div>

      <div className={styles.controlBar} style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <div className={styles.searchBox} style={{ flex: 1, minWidth: '300px' }}>
          <input
            type="text"
            className={styles.input}
            placeholder="Tìm kiếm bàn theo tên hoặc mã..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className={styles.filterGroup}>
          <select 
            className={styles.select}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="AVAILABLE">Bàn trống</option>
            <option value="OCCUPIED">Bàn có khách</option>
            <option value="RESERVED">Bàn đã đặt</option>
            <option value="MAINTENANCE">Bảo trì</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className={styles.spinner} />
      ) : (
        <>
          <div className={styles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0 }}>Sơ đồ bàn ({totalItems})</h3>
              <div style={{ fontSize: '0.9rem', color: '#64748b' }}>
                Trang {currentPage} / {totalPages || 1}
              </div>
            </div>
            
            {filteredTables.length === 0 ? (
              <div className={styles.emptyState}>
                <p>Không tìm thấy bàn nào phù hợp với bộ lọc.</p>
              </div>
            ) : (
              <div className={styles.tableGrid}>
                {currentTables.map((table) => (
                  <div
                    key={table.tableId}
                    className={`${styles.tableCard} ${styles[table.status.toLowerCase()]}`}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <h4 style={{ margin: 0 }}>{table.tableName || table.tableCode}</h4>
                      <span className={`${styles.status} ${getStatusClass(table.status)}`}>
                        {getStatusText(table.status)}
                      </span>
                    </div>
                    <p style={{ margin: '0.5rem 0' }}>Sức chứa: {table.capacity} chỗ</p>
                    {!table.isActive && (
                      <span className={styles.inactive} style={{ display: 'block', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                        Tạm dừng hoạt động
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div style={{ marginTop: '2rem' }}>
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
