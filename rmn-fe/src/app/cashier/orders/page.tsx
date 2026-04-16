"use client";

import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { orderApi, OrderResponse } from "../../../lib/api/order";
import Pagination from "../../../components/Pagination";
import OrderDetailModal from "../../../components/OrderDetailModal";
import { useRouter } from "next/navigation";
import styles from "../../manager/manager.module.css";

export default function CashierOrdersPage() {
  const router = useRouter();
  const [allOrders, setAllOrders] = useState<OrderResponse[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("OPEN");
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [startDate, endDate]);

  useEffect(() => {
    filterOrders();
  }, [allOrders, statusFilter, searchTerm, startDate, endDate]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await orderApi.getAllOrders(startDate, endDate);
      setAllOrders(data);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      setLoading(false);
    }
  };

  const filterOrders = () => {
    const allowed = ["OPEN", "SENT_TO_KITCHEN", "SERVED", "CLOSED"];
    let filtered = allOrders.filter(o => allowed.includes(o.status));

    if (statusFilter !== "ALL") {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (order) =>
          order.orderCode.toLowerCase().includes(term) ||
          order.customerName?.toLowerCase().includes(term) ||
          order.tableName?.toLowerCase().includes(term),
      );
    }

    // Sắp xếp thời gian mới nhất lên đầu (Descending)
    filtered.sort((a, b) => new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime());

    setFilteredOrders(filtered || []);
    setCurrentPage(1);
  };

  // Pagination calculations
  const totalItems = filteredOrders.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentOrders = Array.isArray(filteredOrders)
    ? filteredOrders.slice(startIndex, startIndex + itemsPerPage)
    : [];

  const getStatusText = (status: string) => {
    switch (status?.toUpperCase()) {
      case "OPEN": return "Mới mở";
      case "SENT_TO_KITCHEN": return "Đang chờ bếp";
      case "SERVED": return "Đã phục vụ";
      case "CANCELLED": return "Đã hủy";
      case "CLOSED": return "Đã thanh toán";
      case "RESERVED": return "Đã đặt bàn";
      default: return status;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status?.toUpperCase()) {
      case "OPEN": return styles.statusOpen;
      case "SENT_TO_KITCHEN": return styles.statusSentToKitchen;
      case "SERVED": return styles.statusServed;
      case "CANCELLED": return styles.statusCancelled;
      case "CLOSED": return styles.statusClosed;
      case "RESERVED": return styles.statusReserved;
      default: return styles.statusDefault;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("vi-VN");
  };

  const openOrderDetail = (orderId: number) => {
    setSelectedOrderId(orderId);
    setIsModalOpen(true);
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Quản lý Order</h1>
          <p className={styles.pageSubtitle}>
            Theo dõi và quản lý tất cả order trong nhà hàng
          </p>
        </div>
      </div>

      <div className={styles.controlBar} style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <div className={styles.searchBox} style={{ flex: 1, minWidth: '300px' }}>
          <input
            type="text"
            className={styles.input}
            placeholder="Tìm theo mã order, bàn hoặc tên khách..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>Từ ngày:</span>
          <input
            type="date"
            className={styles.input}
            style={{ width: '160px' }}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>Đến ngày:</span>
          <input
            type="date"
            className={styles.input}
            style={{ width: '160px' }}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>Trạng thái:</span>
          <div className={styles.statusButtonGroup}>
            {[
              { value: "ALL", label: "Tất cả" },
              { value: "OPEN", label: "Mới mở" },
              { value: "SENT_TO_KITCHEN", label: "Chờ bếp" },
              { value: "SERVED", label: "Đã phục vụ" },
              { value: "CLOSED", label: "Hoàn thành" },
            ].map((s) => (
              <button
                key={s.value}
                onClick={() => setStatusFilter(s.value)}
                className={`${styles.statusBtn} ${statusFilter === s.value ? styles.statusBtnActive : ""}`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className={styles.spinner} />
      ) : (
        <div className={styles.card}>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.colNarrow}>Mã</th>
                  <th className={styles.colNarrow}>Bàn</th>
                  <th>Khách hàng</th>
                  <th className={styles.colNarrow}>Trạng thái</th>
                  <th className={styles.colNarrow}>Món</th>
                  <th className={styles.colMedium}>Tổng tiền</th>
                  <th>Thời gian</th>
                  <th className={styles.colCompact}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {currentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className={styles.empty}>
                      Chưa có order nào phù hợp
                    </td>
                  </tr>
                ) : (
                  currentOrders.map((order) => (
                    <tr key={order.orderId}>
                      <td>
                        <strong>{order.orderCode}</strong>
                      </td>
                      <td>{order.tableName || "-"}</td>
                      <td>{order.customerName || "Khách lẻ"}</td>
                      <td>
                        <span className={`${styles.statusBadge} ${getStatusClass(order.status)}`}>
                          {getStatusText(order.status)}
                        </span>
                        {order.orderItems.some(i => i.status === 'WAIT_CONFIRM') && (
                          <span style={{ 
                            marginLeft: '5px', 
                            fontSize: '0.65rem', 
                            backgroundColor: '#fb7185', 
                            color: 'white', 
                            padding: '2px 5px', 
                            borderRadius: '10px',
                            fontWeight: 'bold',
                            animation: 'pulse 2s infinite'
                          }}>
                            MÓN MỚI
                          </span>
                        )}
                      </td>
                      <td>{order.orderItems.length} món</td>
                      <td>
                        <span style={{ fontWeight: 600, color: '#0f172a' }}>
                          {formatCurrency(order.totalAmount)}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        {formatDateTime(order.openedAt)}
                      </td>
                      <td>
                        <div className={styles.btnRow}>
                          <button 
                            className={`${styles.btnPrimary} btn-sm`}
                            onClick={() => openOrderDetail(order.orderId)}
                          >
                            Chi tiết
                          </button>
                          {(order.status !== "CLOSED" && order.status !== "CANCELLED") && (
                            <button 
                              className={`${styles.btnSuccess} btn-sm`}
                              onClick={() => router.push(`/cashier/checkout/${order.orderId}`)}
                            >
                              Thanh toán
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div style={{ padding: '1rem' }}>
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
      )}

      <OrderDetailModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        orderId={selectedOrderId}
        onOrderUpdate={fetchOrders}
      />
    </div>
  );
}
