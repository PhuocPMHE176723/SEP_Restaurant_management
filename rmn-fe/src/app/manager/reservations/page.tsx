"use client";

import { useEffect, useState } from "react";
import { adminReservationApi } from "../../../lib/api/admin-reservation";
import {
  ReservationResponse,
  OrderResponse,
  OrderItemResponse,
} from "../../../types/models/reservation";
import Modal from "../../../components/Modal/Modal";
import styles from "./reservations.module.css";

export default function AdminReservationsPage() {
  const [reservations, setReservations] = useState<ReservationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<OrderResponse | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const data = await adminReservationApi.getAllReservations();
      setReservations(data);
      setError(null);
    } catch (err: any) {
      console.error("Failed to fetch reservations", err);
      setError(err.message || "Không thể tải danh sách đặt bàn.");
    } finally {
      setLoading(false);
    }
  };

  const handleViewOrder = (order?: OrderResponse) => {
    if (order) {
      setSelectedOrder(order);
      setIsModalOpen(true);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "PENDING":
        return { text: "Chờ xác nhận", color: "#f59e0b" };
      case "CONFIRMED":
        return { text: "Đã xác nhận", color: "#3b82f6" };
      case "CANCELLED":
        return { text: "Đã huỷ", color: "#ef4444" };
      case "COMPLETED":
        return { text: "Hoàn thành", color: "#10b981" };
      default:
        return { text: status, color: "#64748b" };
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>
          Đang tải dữ liệu...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div style={{ padding: "2rem", textAlign: "center", color: "#ef4444" }}>
          Lỗi: {error}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Lịch sử Đặt bàn</h1>
        <p className={styles.subtitle}>
          Danh sách tất cả các yêu cầu đặt bàn của khách hàng.
        </p>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Mã Đặt bàn</th>
              <th>Khách hàng</th>
              <th>Số điện thoại</th>
              <th>Thời gian đến</th>
              <th>Số người</th>
              <th>Trạng thái</th>
              <th>Chi tiết</th>
              <th>Ghi chú</th>
            </tr>
          </thead>
          <tbody>
            {reservations.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  style={{
                    textAlign: "center",
                    padding: "2rem",
                    color: "#64748b",
                  }}
                >
                  Không có dữ liệu đặt bàn.
                </td>
              </tr>
            ) : (
              reservations.map((res) => {
                const statusInfo = getStatusText(res.status);
                
                let displayPhone = res.customerPhone && res.customerPhone !== "N/A" ? res.customerPhone : "N/A";
                let displayNote = res.note || "";
                
                if (displayNote.includes("SĐT liên hệ:")) {
                  const phoneMatch = displayNote.match(/SĐT liên hệ:\s*([^\n]+)/);
                  if (phoneMatch && displayPhone === "N/A") {
                    displayPhone = phoneMatch[1].trim();
                  }
                  displayNote = displayNote.replace(/SĐT liên hệ:\s*[^\n]+\n?/, "").trim();
                }

                return (
                  <tr key={res.reservationId}>
                    <td>#{res.reservationId}</td>
                    <td>
                      <div style={{ fontWeight: 500, color: "#1e293b" }}>
                        {res.customerName}
                      </div>
                    </td>
                    <td>{displayPhone}</td>
                    <td>{formatDate(res.reservedAt)}</td>
                    <td>{res.partySize}</td>
                    <td>
                      <span
                        className={styles.statusBadge}
                        style={{
                          backgroundColor: `${statusInfo.color}15`,
                          color: statusInfo.color,
                        }}
                      >
                        {statusInfo.text}
                      </span>
                    </td>
                    <td>
                      {res.order && res.order.orderItems.length > 0 ? (
                        <button
                          className={styles.viewOrderBtn}
                          onClick={() => handleViewOrder(res.order)}
                        >
                          Xem món ({res.order.orderItems.length})
                        </button>
                      ) : (
                        <span style={{ color: "#94a3b8", fontSize: "0.8rem" }}>
                          Không đặt món
                        </span>
                      )}
                    </td>
                    <td>
                      <div
                        style={{
                          maxWidth: "200px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                        title={displayNote}
                      >
                        {displayNote || (
                          <span style={{ color: "#94a3b8" }}>Không có</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Chi tiết món ăn - Đơn #${selectedOrder?.orderCode}`}
        type="info"
      >
        <div className={styles.orderDetails}>
          {selectedOrder?.orderItems.map((item: OrderItemResponse) => (
            <div key={item.orderItemId} className={styles.orderItem}>
              <div className={styles.itemName}>{item.menuItemName}</div>
              <div className={styles.itemQty}>x{item.quantity}</div>
              <div className={styles.itemPrice}>
                {(item.unitPrice * item.quantity).toLocaleString("vi-VN")} đ
              </div>
            </div>
          ))}
          <div className={styles.orderTotal}>
            <span>Tổng cộng (tạm tính):</span>
            <span>{(selectedOrder?.totalAmount || 0).toLocaleString("vi-VN")} đ</span>
          </div>
        </div>
      </Modal>
    </div>
  );
}
