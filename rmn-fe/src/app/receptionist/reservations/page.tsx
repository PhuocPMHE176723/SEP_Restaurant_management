"use client";

import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { adminReservationApi } from "../../../lib/api/admin-reservation";
import type { ReservationResponse } from "../../../types/models";
import Pagination from "../../../components/Pagination";
import TableSelectModal from "../../../components/TableSelectModal/TableSelectModal";
import styles from "../../manager/manager.module.css";

export default function ReceptionistReservationsPage() {
  const [reservations, setReservations] = useState<ReservationResponse[]>([]);
  const [filteredReservations, setFilteredReservations] = useState<
    ReservationResponse[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedRes, setSelectedRes] = useState<ReservationResponse | null>(null);
  const [showTableModal, setShowTableModal] = useState(false);
  const [search, setSearch] = useState<string>("");

  useEffect(() => {
    fetchReservations();
  }, []);

  useEffect(() => {
    filterReservations();
  }, [reservations, filter, searchTerm]);

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

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (reservation) =>
          reservation.customerName?.toLowerCase().includes(term) ||
          reservation.customerPhone?.toLowerCase().includes(term),
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

  const handleCheckInClick = (reservation: ReservationResponse) => {
    setSelectedRes(reservation);
    setShowTableModal(true);
  };

  const onTableSelect = async (tableId: number) => {
    if (!selectedRes) return;
    setShowTableModal(false);
    await handleStatusUpdate(selectedRes.reservationId, "CHECKED_IN", tableId);
    setSelectedRes(null);
  };

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Quản lý Đặt bàn</h1>
          <p className={styles.pageSubtitle}>
            Theo dõi và xác nhận các yêu cầu đặt bàn của khách hàng
          </p>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: "0.75rem",
          marginBottom: "1rem",
          flexWrap: "wrap",
        }}
      >
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className={styles.input}
          style={{ width: "180px" }}
        />
        <input
          type="search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Tìm theo tên/SĐT/mã"
          className={styles.input}
          style={{ minWidth: "220px" }}
        />
      </div>

      {loading ? (
        <div className={styles.spinner} />
      ) : (
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
                    {searchTerm || date
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
                        className={`${styles.statusBadge} ${styles[reservation.status.toLowerCase()]}`}
                      >
                        {reservation.status}
                      </span>
                    </td>
                    <td>{reservation.note || "-"}</td>
                    <td>
                      {reservation.status === "PENDING" && (
                        <button
                          className="btn btn-sm btn-success"
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
                          className="btn btn-sm btn-primary"
                          onClick={() => handleCheckInClick(reservation)}
                        >
                          Check-in
                        </button>
                      )}
                      {(reservation.status === "PENDING" ||
                        reservation.status === "CONFIRMED") && (
                        <button
                          className="btn btn-sm btn-danger"
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
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          )}
        </div>
      )}

      {showTableModal && selectedRes && (
        <TableSelectModal 
          partySize={selectedRes.partySize} 
          onSelect={onTableSelect} 
          onClose={() => setShowTableModal(false)} 
        />
      )}
    </div>
  );
}
