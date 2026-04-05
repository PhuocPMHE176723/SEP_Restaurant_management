"use client";

import { useState, useEffect } from "react";
import { diningTableApi } from "../../../lib/api/dining-table";
import { orderApi, OrderResponse } from "../../../lib/api/order";
import type { DiningTableResponse } from "../../../types/models";
import Pagination from "../../../components/Pagination";
import OrderDetailModal from "../../../components/OrderDetailModal";
import styles from "../../manager/manager.module.css";

export default function StaffTablesPage() {
  const [allTables, setAllTables] = useState<DiningTableResponse[]>([]);
  const [filteredTables, setFilteredTables] = useState<DiningTableResponse[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [capacityFilter, setCapacityFilter] = useState<number | "ALL">("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchTables();
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const data = await orderApi.getAllOrders();
      setOrders(data);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    }
  };

  useEffect(() => {
    filterTables();
  }, [allTables, statusFilter, searchTerm, capacityFilter]);

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
    let filtered = [...allTables];

    if (statusFilter !== "ALL") {
      filtered = filtered.filter((table) => table.status === statusFilter);
    }

    if (capacityFilter !== "ALL") {
      filtered = filtered.filter((table) => table.capacity >= (capacityFilter as number));
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (table) =>
          table.tableCode.toLowerCase().includes(term) ||
          table.tableName?.toLowerCase().includes(term),
      );
    }

    // Sort logically (e.g., T1-1, T1-2... VIP 1...)
    filtered.sort((a, b) => {
      return (a.tableName || a.tableCode).localeCompare(b.tableName || b.tableCode, undefined, { numeric: true, sensitivity: 'base' });
    });

    setFilteredTables(filtered);
    setCurrentPage(1);
  };

  // Pagination calculations
  const totalItems = filteredTables.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentTables = filteredTables.slice(startIndex, startIndex + itemsPerPage);

  const handleTableClick = (table: DiningTableResponse) => {
    if (table.status === "OCCUPIED") {
        const order = orders.find(o => {
            // Direct match
            if (o.tableId === table.tableId && (o.status === "OPEN" || o.status === "SENT_TO_KITCHEN" || o.status === "SERVED")) return true;
            
            // Extra table match in Note: [Tables:1,2,3]
            if (o.note?.startsWith("[Tables:") && (o.status === "OPEN" || o.status === "SENT_TO_KITCHEN" || o.status === "SERVED")) {
                const endBracket = o.note.indexOf(']');
                if (endBracket > 8) {
                    const tableIdsStr = o.note.substring(8, endBracket);
                    const tableIds = tableIdsStr.split(',').map(id => parseInt(id.trim()));
                    if (tableIds.includes(table.tableId)) return true;
                }
            }
            return false;
        });

        if (order) {
            setSelectedOrderId(order.orderId);
            setIsModalOpen(true);
        }
    }
  };

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

      <div
        className={styles.filterBar}
        style={{
          display: "flex",
          gap: "1rem",
          marginBottom: "1.5rem",
          padding: "1rem",
          background: "#fff",
          borderRadius: "16px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <div style={{ flex: 1, minWidth: '300px', position: 'relative' }}>
          <input
            type="text"
            className={styles.input}
            placeholder="Tìm kiếm bàn theo tên hoặc mã..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: "100%", paddingLeft: '2.5rem' }}
          />
          <svg 
            style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
          </svg>
        </div>
        
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <select 
            className={styles.select}
            value={capacityFilter}
            onChange={(e) => setCapacityFilter(e.target.value === "ALL" ? "ALL" : parseInt(e.target.value))}
            style={{ width: '160px', padding: '0.5rem' }}
          >
            <option value="ALL">Tất cả sức chứa</option>
            <option value="2">≥ 2 người</option>
            <option value="4">≥ 4 người</option>
            <option value="6">≥ 6 người</option>
            <option value="8">≥ 8 người</option>
            <option value="10">≥ 10 người</option>
          </select>

          <select 
            className={styles.select}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: '160px', padding: '0.5rem' }}
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
                    style={{ cursor: table.status === 'OCCUPIED' ? 'pointer' : 'default' }}
                    onClick={() => handleTableClick(table)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 style={{ margin: 0, fontWeight: 800, fontSize: '1.1rem' }}>{table.tableName || table.tableCode}</h4>
                      <span className={`${styles.statusBadge} ${getStatusClass(table.status)}`} style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}>
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

      <OrderDetailModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        orderId={selectedOrderId}
        onOrderUpdate={() => {
            fetchTables();
            fetchOrders();
        }}
      />
    </div>
  );
}
