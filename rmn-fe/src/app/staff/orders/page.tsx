"use client";

import { useState, useEffect } from "react";
import { orderApi, OrderResponse } from "../../../lib/api/order";
import Pagination from "../../../components/Pagination";
import styles from "../../manager/manager.module.css";

export default function StaffOrdersPage() {
  const [allOrders, setAllOrders] = useState<OrderResponse[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8);

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [allOrders, statusFilter, searchTerm]);

  const fetchOrders = async () => {
    try {
      const data = await orderApi.getAllOrders();
      setAllOrders(data);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = allOrders;

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

    setFilteredOrders(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  };

  // Pagination calculations
  const totalItems = filteredOrders.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentOrders = Array.isArray(filteredOrders)
    ? filteredOrders.slice(startIndex, endIndex)
    : [];

  const getStatusText = (status: string) => {
    switch (status) {
      case "OPEN":
        return "Mở";
      case "SENT_TO_KITCHEN":
        return "Gửi bếp";
      case "SERVED":
        return "Đã phục vụ";
      case "CANCELLED":
        return "Đã hủy";
      case "CLOSED":
        return "Đã đóng";
      default:
        return status;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case "OPEN":
        return styles.statusOpen;
      case "SENT_TO_KITCHEN":
        return styles.statusInProgress;
      case "SERVED":
        return styles.statusCompleted;
      case "CANCELLED":
        return styles.statusCancelled;
      case "CLOSED":
        return styles.statusClosed;
      default:
        return "";
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

  const handleStatusUpdate = async (orderId: number, newStatus: string) => {
    try {
      await orderApi.updateOrderStatus(orderId, { status: newStatus });
      await fetchOrders(); // Refresh the list
    } catch (error) {
      console.error("Failed to update order status:", error);
      alert("Có lỗi khi cập nhật trạng thái order");
    }
  };

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Quản lý Order</h1>
          <p className={styles.pageSubtitle}>
            Theo dõi và quản lý tất cả order trong nhà hàng
          </p>
        </div>
      </div>

      {loading ? (
        <div className="spinner" />
      ) : (
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
                    Chưa có order nào
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
                      <span
                        className={`${styles.statusBadge} ${getStatusClass(order.status)}`}
                      >
                        {getStatusText(order.status)}
                      </span>
                    </td>
                    <td>{order.orderItems.length} món</td>
                    <td>{formatCurrency(order.totalAmount)}</td>
                    <td>{formatDateTime(order.openedAt)}</td>
                    <td>
                      <div className={styles.actionButtons}>
                        {order.status === "OPEN" && (
                          <button
                            className={styles.btnSecondary}
                            onClick={() =>
                              handleStatusUpdate(
                                order.orderId,
                                "SENT_TO_KITCHEN",
                              )
                            }
                          >
                            Gửi bếp
                          </button>
                        )}
                        {order.status === "SENT_TO_KITCHEN" && (
                          <button
                            className={styles.btnSuccess}
                            onClick={() =>
                              handleStatusUpdate(order.orderId, "SERVED")
                            }
                          >
                            Đã phục vụ
                          </button>
                        )}
                        {order.status === "SERVED" && (
                          <button
                            className={styles.btnPrimary}
                            onClick={() =>
                              handleStatusUpdate(order.orderId, "CLOSED")
                            }
                          >
                            Đóng order
                          </button>
                        )}
                        {(order.status === "OPEN" ||
                          order.status === "SENT_TO_KITCHEN") && (
                          <button
                            className={styles.btnDanger}
                            onClick={() =>
                              handleStatusUpdate(order.orderId, "CANCELLED")
                            }
                          >
                            Hủy
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
      )}
    </div>
  );
}
