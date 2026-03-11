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
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

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
  const endIndex = startIndex + itemsPerPage;
  const currentTables = filteredTables.slice(startIndex, endIndex);

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
      case "AVAILABLE":
        return styles.statusAvailable;
      case "OCCUPIED":
        return styles.statusOccupied;
      case "RESERVED":
        return styles.statusReserved;
      case "MAINTENANCE":
        return styles.statusMaintenance;
      default:
        return "";
    }
  };
  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Danh sách bàn</h1>
          <p className={styles.pageSubtitle}>
            Xem tình trạng tất cả bàn trong nhà hàng
          </p>
        </div>
      </div>

      {loading ? (
        <div className="spinner" />
      ) : (
        <>
          {/* Table grid view */}
          <div className={styles.card}>
            <h3>Tổng quan bàn ({totalItems} bàn)</h3>
            <div className={styles.tableGrid}>
              {currentTables.map((table) => (
                <div
                  key={table.tableId}
                  className={`${styles.tableCard} ${styles[table.status.toLowerCase()]}`}
                >
                  <h4>{table.tableName || table.tableCode}</h4>
                  <p>{table.capacity} chỗ</p>
                  <span
                    className={`${styles.status} ${getStatusClass(table.status)}`}
                  >
                    {getStatusText(table.status)}
                  </span>
                  {!table.isActive && (
                    <span className={styles.inactive}>Không hoạt động</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Table list view */}
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.colNarrow}>Mã</th>
                  <th>Tên bàn</th>
                  <th className={styles.colNarrow}>Sức chứa</th>
                  <th className={styles.colNarrow}>Trạng thái</th>
                  <th className={styles.colCompact}>Hoạt động</th>
                </tr>
              </thead>
              <tbody>
                {currentTables.length === 0 ? (
                  <tr>
                    <td colSpan={5} className={styles.empty}>
                      Chưa có bàn nào
                    </td>
                  </tr>
                ) : (
                  currentTables.map((table) => (
                    <tr key={table.tableId}>
                      <td>{table.tableCode}</td>
                      <td>{table.tableName || "-"}</td>
                      <td>{table.capacity} người</td>
                      <td>
                        <span
                          className={`${styles.statusBadge} ${getStatusClass(table.status)}`}
                        >
                          {getStatusText(table.status)}
                        </span>
                      </td>
                      <td>
                        {table.isActive ? (
                          <span className={styles.active}>Hoạt động</span>
                        ) : (
                          <span className={styles.inactive}>
                            Không hoạt động
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
