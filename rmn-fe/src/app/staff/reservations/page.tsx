"use client";

import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { adminReservationApi } from "../../../lib/api/admin-reservation";
import type { ReservationResponse } from "../../../types/models";
import Pagination from "../../../components/Pagination";
import styles from "../../manager/manager.module.css";

export default function StaffReservationsPage() {
  const [reservations, setReservations] = useState<ReservationResponse[]>([]);
  const [filteredReservations, setFilteredReservations] = useState<
    ReservationResponse[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [search, setSearch] = useState<string>("");

  useEffect(() => {
    fetchReservations();
  }, []);

  useEffect(() => {
    filterReservations();
  }, [reservations, filter, search, date]);

  const fetchReservations = async () => {
    try {
      const data = await adminReservationApi.getAllReservations();
      setReservations(data);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch reservations:", error);
      setLoading(false);
    }
  };

  const filterReservations = () => {
    let filtered = reservations;

    if (filter !== "ALL") {
      filtered = filtered.filter(
        (reservation) => reservation.status === filter,
      );
    }

    if (date) {
      filtered = filtered.filter((reservation) => 
        new Date(reservation.reservedAt).toISOString().split("T")[0] === date
      );
    }

    if (search) {
      const term = search.toLowerCase();
      filtered = filtered.filter(
        (reservation) =>
          reservation.customerName?.toLowerCase().includes(term) ||
          reservation.customerPhone?.toLowerCase().includes(term) ||
          reservation.reservationId.toString().includes(term),
      );
    }

    setFilteredReservations(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  };

  // Pagination calculations
  const totalItems = filteredReservations.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentReservations = filteredReservations.slice(startIndex, endIndex);

  const handleStatusUpdate = async (
    id: number,
    status: string,
    tableId?: number,
  ) => {
    try {
      await adminReservationApi.updateReservationStatus(id, {
        status,
        tableId,
      });
      await fetchReservations(); // Refresh data
      Swal.fire({
        title: "Thành công",
        text: "Cập nhật trạng thái thành công!",
        icon: "success",
        confirmButtonColor: "var(--brand-primary)"
      });
    } catch (error) {
      console.error("Failed to update status:", error);
      Swal.fire({
        title: "Lỗi",
        text: "Cập nhật thất bại!",
        icon: "error",
        confirmButtonColor: "var(--error)"
      });
    }
  };

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Đặt bàn</h1>
          <p className={styles.pageSubtitle}>
            Quản lý đặt bàn và cập nhật trạng thái
          </p>
        </div>
      </div>

      <div
        className={styles.filterBar}
        style={{
          display: "flex",
          gap: "0.75rem",
          marginBottom: "1.5rem",
          padding: "1rem",
          background: "#fff",
          borderRadius: "16px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>Ngày:</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={styles.input}
            style={{ width: "160px", padding: '0.5rem' }}
          />
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>Trạng thái:</span>
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className={styles.select}
            style={{ width: "160px", padding: '0.5rem' }}
          >
            <option value="ALL">Tất cả</option>
            <option value="PENDING">Đang chờ</option>
            <option value="CONFIRMED">Đã xác nhận</option>
            <option value="CHECKED_IN">Đã check-in</option>
            <option value="CANCELLED">Đã hủy</option>
          </select>
        </div>

        <div style={{ flex: 1, minWidth: '200px', maxWidth: '400px', position: 'relative' }}>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm tên, SĐT hoặc mã đặt bàn..."
            className={styles.input}
            style={{ width: "100%", paddingLeft: '2.5rem', paddingRight: '1rem' }}
          />
          <svg 
            style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
          </svg>
        </div>
      </div>

      {loading ? (
        <div className={styles.spinner} />
      ) : (
        <>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
            <thead>
              <tr>
                <th>Mã</th>
                <th>Khách hàng</th>
                <th>SĐT</th>
                <th>Số khách</th>
                <th>Thời gian</th>
                <th>Trạng thái</th>
                <th>Ghi chú</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredReservations.length === 0 ? (
                <tr>
                  <td colSpan={8} className={styles.empty}>
                    {search || date
                      ? "Không tìm thấy đặt bàn nào"
                      : "Chưa có đặt bàn nào"}
                  </td>
                </tr>
              ) : (
                currentReservations.map((reservation) => (
                  <tr key={reservation.reservationId}>
                    <td>#{reservation.reservationId}</td>
                    <td>{reservation.customerName}</td>
                    <td>{reservation.customerPhone}</td>
                    <td>{reservation.partySize}</td>
                    <td>
                      {new Date(reservation.reservedAt).toLocaleString("vi-VN")}
                    </td>
                    <td>
                      <span
                        className={`${styles.statusBadge} ${
                          reservation.status === "PENDING" ? styles.statusPending :
                          reservation.status === "CONFIRMED" ? styles.statusConfirmed :
                          reservation.status === "CHECKED_IN" ? styles.statusCheckedIn :
                          reservation.status === "CANCELLED" ? styles.statusCancelled :
                          styles.statusDefault
                        }`}
                      >
                        {reservation.status === "PENDING" ? "Đang chờ" :
                         reservation.status === "CONFIRMED" ? "Đã xác nhận" :
                         reservation.status === "CHECKED_IN" ? "Check-in" :
                         reservation.status === "CANCELLED" ? "Đã hủy" :
                         reservation.status}
                      </span>
                    </td>
                    <td>{reservation.note || "-"}</td>
                    <td>
                      <div className={styles.actionButtons}>
                        {reservation.status === "PENDING" && (
                          <button
                            className={styles.btnSuccess}
                            onClick={() =>
                              handleStatusUpdate(
                                reservation.reservationId,
                                "CONFIRMED",
                              )
                            }
                          >
                            Xác nhận
                          </button>
                        )}
                        {reservation.status === "CONFIRMED" && (
                          <button
                            className={styles.btnPrimary}
                            onClick={() =>
                              handleStatusUpdate(
                                reservation.reservationId,
                                "CHECKED_IN",
                              )
                            }
                          >
                            Check-in
                          </button>
                        )}
                        {(reservation.status === "PENDING" ||
                          reservation.status === "CONFIRMED") && (
                          <button
                            className={styles.btnDanger}
                            onClick={() =>
                              handleStatusUpdate(
                                reservation.reservationId,
                                "CANCELLED",
                              )
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

          {totalPages > 1 && (
            <div style={{ marginTop: "1rem" }}>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
