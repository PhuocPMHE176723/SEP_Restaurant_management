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
  const [selectedOrder, setSelectedOrder] = useState<OrderResponse | null>(null);
  const [selectedNote, setSelectedNote] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);

  // Filters & Pagination State
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const data = await adminReservationApi.getAllReservations();
      // Sort by latest first
      const sortedData = [...data].sort((a, b) => b.reservationId - a.reservationId);
      setReservations(sortedData);
      setError(null);
    } catch (err: any) {
      console.error("Failed to fetch reservations", err);
      setError(err.message || "Không thể tải danh sách đặt bàn.");
    } finally {
      setLoading(false);
    }
  };

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, dateFilter]);

  const filteredReservations = reservations.filter((res) => {
    const matchesSearch =
      res.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (res.customerPhone && res.customerPhone.includes(searchTerm)) ||
      (res.note && res.note.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === "ALL" || res.status === statusFilter;
    
    const matchesDate = !dateFilter || res.reservedAt.startsWith(dateFilter);

    return matchesSearch && matchesStatus && matchesDate;
  });

  const totalPages = Math.ceil(filteredReservations.length / pageSize);
  const paginatedReservations = filteredReservations.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

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
      case "CHECKED_IN":
          return { text: "Đã đến", color: "#8b5cf6" };
      default:
        return { text: status, color: "#64748b" };
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div style={{ padding: "5rem", textAlign: "center", color: "#94a3b8" }}>
          <div className="spinner" style={{ marginBottom: "1rem" }}></div>
          Đang tải dữ liệu đặt bàn...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Lịch sử Đặt bàn</h1>
        </div>
        <div style={{ 
          padding: "3rem", 
          textAlign: "center", 
          background: "#fef2f2", 
          color: "#991b1b",
          borderRadius: "12px",
          border: "1px solid #fecaca" 
        }}>
          <p style={{ fontWeight: 600, marginBottom: "0.5rem" }}>Đã xảy ra lỗi khi tải dữ liệu:</p>
          <p>{error}</p>
          <button 
            className={styles.viewOrderBtn} 
            style={{ marginTop: "1rem", background: "#fecaca" }}
            onClick={() => fetchReservations()}
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Lịch sử Đặt bàn</h1>
        <p className={styles.subtitle}>
          Quản lý và tra cứu lịch sử đặt bàn của khách hàng một cách hiệu quả.
        </p>
      </div>

      <div className={styles.filterBar}>
        <div className={styles.searchGroup}>
          <svg className={styles.searchIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Tìm theo tên khách, SĐT hoặc ghi chú..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className={styles.filterGroup}>
          <select
            className={styles.selectFilter}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="PENDING">Chờ xác nhận</option>
            <option value="CONFIRMED">Đã xác nhận</option>
            <option value="CHECKED_IN">Đã đến</option>
            <option value="COMPLETED">Hoàn thành</option>
            <option value="CANCELLED">Đã huỷ</option>
          </select>

          <input
            type="date"
            className={styles.selectFilter}
            style={{ minWidth: "180px" }}
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />

          {(searchTerm || statusFilter !== "ALL" || dateFilter) && (
            <button 
              className={styles.viewOrderBtn}
              style={{ background: "#fff1f2", color: "#e11d48", borderColor: "#fecdd3" }}
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("ALL");
                setDateFilter("");
              }}
            >
              Xoá lọc
            </button>
          )}
        </div>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Khách hàng</th>
              <th>Số điện thoại</th>
              <th>Thời gian đến</th>
              <th>Số người</th>
              <th>Trạng thái</th>
              <th>Chi tiết món</th>
              <th>Ghi chú</th>
            </tr>
          </thead>
          <tbody>
            {paginatedReservations.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", padding: "4rem", color: "#94a3b8" }}>
                  {searchTerm || statusFilter !== "ALL" || dateFilter 
                    ? "Không tìm thấy kết quả phù hợp với bộ lọc." 
                    : "Chưa có dữ liệu đặt bàn nào."}
                </td>
              </tr>
            ) : (
              paginatedReservations.map((res) => {
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
                    <td style={{ fontWeight: 600, color: "#94a3b8" }}>#{res.reservationId}</td>
                    <td>
                      <div style={{ fontWeight: 600, color: "#1e293b" }}>{res.customerName}</div>
                    </td>
                    <td>{displayPhone}</td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{formatDate(res.reservedAt).split(" ")[0]}</div>
                      <div style={{ fontSize: "0.8rem", color: "#64748b" }}>{formatDate(res.reservedAt).split(" ")[1]}</div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{res.partySize}</span> 
                      <span style={{ fontSize: "0.8rem", color: "#94a3b8", marginLeft: "2px" }}>người</span>
                    </td>
                    <td>
                      <span
                        className={`${styles.statusBadge} ${
                          res.status === "PENDING" ? styles.statusPending :
                          res.status === "CONFIRMED" ? styles.statusConfirmed :
                          res.status === "CHECKED_IN" ? styles.statusConfirmed : // Use confirmed color for check-in too
                          res.status === "COMPLETED" ? styles.statusServed :
                          res.status === "CANCELLED" ? styles.statusCancelled :
                          styles.statusDefault
                        }`}
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
                        <span style={{ color: "#94a3b8", fontSize: "0.8rem", fontStyle: "italic" }}>
                          Không đặt trước
                        </span>
                      )}
                    </td>
                    <td>
                      {displayNote ? (
                        <div
                          style={{
                            maxWidth: "180px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            cursor: "pointer",
                            color: "#3b82f6",
                            textDecoration: "underline",
                            textUnderlineOffset: "2px"
                          }}
                          title="Click để xem chi tiết"
                          onClick={() => {
                            setSelectedNote(displayNote);
                            setIsNoteModalOpen(true);
                          }}
                        >
                          {displayNote}
                        </div>
                      ) : (
                        <span style={{ color: "#cbd5e1" }}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <div className={styles.paginationInfo}>
            Hiển thị <b>{Math.min(filteredReservations.length, (currentPage - 1) * pageSize + 1)}-{Math.min(filteredReservations.length, currentPage * pageSize)}</b> trên tổng số <b>{filteredReservations.length}</b> đặt bàn
          </div>
          <button
            className={styles.pageBtn}
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => prev - 1)}
          >
            &laquo;
          </button>
          
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i + 1}
              className={`${styles.pageBtn} ${currentPage === i + 1 ? styles.activePage : ""}`}
              onClick={() => setCurrentPage(i + 1)}
            >
              {i + 1}
            </button>
          ))}

          <button
            className={styles.pageBtn}
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => prev + 1)}
          >
            &raquo;
          </button>
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Chi tiết thực đơn - Đơn #${selectedOrder?.orderCode}`}
        type="info"
      >
        <div className={styles.orderDetails}>
          {selectedOrder?.orderItems.map((item: OrderItemResponse) => (
            <div key={item.orderItemId} className={styles.orderItem}>
              <div className={styles.itemName}>{item.itemNameSnapshot}</div>
              <div className={styles.itemQty}>x{item.quantity}</div>
              <div className={styles.itemPrice}>
                {(item.unitPrice * item.quantity).toLocaleString("vi-VN")} đ
              </div>
            </div>
          ))}
          <div className={styles.orderTotal}>
            <span>Tổng giá trị đơn hàng:</span>
            <span>{(selectedOrder?.totalAmount || 0).toLocaleString("vi-VN")} đ</span>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isNoteModalOpen}
        onClose={() => setIsNoteModalOpen(false)}
        title="Ghi chú từ khách hàng"
        type="info"
      >
        <div style={{ 
          padding: "1.5rem", 
          lineHeight: "1.6", 
          color: "#1e293b",
          fontSize: "1rem",
          whiteSpace: "pre-wrap",
          background: "#f8fafc",
          borderRadius: "8px",
          border: "1px solid #e2e8f0"
        }}>
          {selectedNote}
        </div>
        <div style={{ marginTop: "1.5rem", textAlign: "right" }}>
          <button 
            className={styles.viewOrderBtn}
            onClick={() => setIsNoteModalOpen(false)}
          >
            Đóng
          </button>
        </div>
      </Modal>
    </div>
  );
}
