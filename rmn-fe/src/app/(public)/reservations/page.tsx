"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "../../../components/Header/Header";
import Footer from "../../../components/Footer/Footer";
import { useAuth } from "../../../contexts/AuthContext";
import {
  getMyReservations,
  cancelReservation,
  type ReservationDTO,
} from "../../../lib/api/reservation";
import Modal from "../../../components/Modal/Modal";
import EditPreorderModal from "../../../components/EditPreorderModal/EditPreorderModal";
import Pagination from "../../../components/Pagination";
import styles from "./page.module.css";

export default function ReservationsPage() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const [reservations, setReservations] = useState<ReservationDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Cancel modal
  const [cancelId, setCancelId] = useState<number | null>(null);
  const [cancelling, setCancelling] = useState(false);

  // Edit preorder modal
  const [editReservation, setEditReservation] = useState<ReservationDTO | null>(null);

  // Result modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"success" | "error">("success");
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Filtering
  const [filterDate, setFilterDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isLoggedIn) {
      router.push("/login");
      return;
    }

    if (mounted && isLoggedIn) {
      loadData();
    }
  }, [mounted, isLoggedIn, router]);
 
  async function loadData() {
    try {
      setLoading(true);
      const data = await getMyReservations();
      setReservations(data);
    } catch (error: any) {
      console.error("Failed to load reservations:", error);
      setModalType("error");
      setModalTitle("Lỗi");
      setModalMessage(error.message || "Không thể tải danh sách đặt bàn");
      setModalOpen(true);
    } finally {
      setLoading(false);
    }
  }

  async function handleCancelConfirm() {
    if (cancelId === null) return;

    try {
      setCancelling(true);
      await cancelReservation(cancelId);

      setModalType("success");
      setModalTitle("Đã hủy đặt bàn");
      setModalMessage("Đặt bàn đã được hủy thành công.");
      setModalOpen(true);

      setCancelId(null);
      loadData();
    } catch (error: any) {
      setModalType("error");
      setModalTitle("Lỗi");
      setModalMessage(error.message || "Không thể hủy đặt bàn");
      setModalOpen(true);
    } finally {
      setCancelling(false);
    }
  }

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  function formatTime(dateStr: string) {
    const date = new Date(dateStr);
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  }

  function getStatusLabel(status: string) {
    const statusMap: Record<string, string> = {
      PENDING: "Chờ xác nhận",
      CONFIRMED: "Đã xác nhận",
      CANCELLED: "Đã hủy",
      NO_SHOW: "Không đến",
      COMPLETED: "Hoàn thành",
      RESERVED: "Đã đặt",
    };
    return statusMap[status] || status;
  }

  function getStatusClass(status: string) {
    const classMap: Record<string, string> = {
      PENDING: styles.statusPending,
      CONFIRMED: styles.statusConfirmed,
      RESERVED: styles.statusConfirmed,
      CANCELLED: styles.statusCancelled,
      NO_SHOW: styles.statusCancelled,
      COMPLETED: styles.statusCompleted,
    };
    return classMap[status] || "";
  }

  const filteredReservations = reservations.filter((res) => {
    const matchesDate = !filterDate || new Date(res.reservedAt).toISOString().split("T")[0] === filterDate;
    const matchesStatus = filterStatus === "ALL" || res.status === filterStatus;
    return matchesDate && matchesStatus;
  });

  if (!mounted || loading) {
    return (
      <>
        <Header />
        <main className={styles.main}>
          <div className="container">
            <div className={styles.loading}>Đang tải...</div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className={styles.main}>
        <div className="container">
          <div className={styles.header}>
            <h1 className={styles.title}>Lịch sử đặt bàn</h1>
            <p className={styles.subtitle}>Quản lý các đơn đặt bàn của bạn</p>
          </div>

          <div className={styles.filterBar}>
            <div className={styles.filterGroup}>
              <div className={styles.filterField}>
                <label className={styles.filterLabel}>Ngày:</label>
                <input 
                  type="date" 
                  className={styles.dateInput}
                  value={filterDate}
                  onChange={(e) => {
                    setFilterDate(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
              <div className={styles.filterField}>
                <label className={styles.filterLabel}>Trạng thái:</label>
                <select 
                  className={styles.statusSelect}
                  value={filterStatus}
                  onChange={(e) => {
                    setFilterStatus(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="ALL">Tất cả</option>
                  <option value="PENDING">Chờ xác nhận</option>
                  <option value="CONFIRMED">Đã xác nhận</option>
                  <option value="COMPLETED">Hoàn thiện</option>
                  <option value="CANCELLED">Đã hủy</option>
                </select>
              </div>
              {(filterDate || filterStatus !== "ALL") && (
                <button 
                  className={`btn btn-primary ${styles.clearFilterBtn}`}
                  onClick={() => {
                    setFilterDate("");
                    setFilterStatus("ALL");
                    setCurrentPage(1);
                  }}
                >
                  Xóa bộ lọc
                </button>
              )}
            </div>
            <div className={styles.filterInfo}>
              Tìm thấy <strong>{filteredReservations.length}</strong> đơn đặt bàn
            </div>
          </div>

          {reservations.length === 0 ? (
            <div className={styles.empty}>
              <h3>Chưa có đặt bàn nào</h3>
              <p>Bạn chưa có lịch sử đặt bàn. Hãy đặt bàn ngay!</p>
              <a href="/booking" className="btn btn-primary">
                Đặt bàn ngay
              </a>
            </div>
          ) : (
            <div className={styles.list}>
              {filteredReservations
                .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                .map((reservation) => (
                <div key={reservation.reservationId} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <span
                      className={`${styles.status} ${getStatusClass(reservation.status)}`}
                    >
                      {getStatusLabel(reservation.status)}
                    </span>
                    {reservation.status === "PENDING" && (
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button
                          className={`btn btn-ghost ${styles.cancelBtn}`}
                          style={{ borderColor: "#d1d5db", color: "#374151" }}
                          onClick={() => setEditReservation(reservation)}
                        >
                          Sửa món ăn
                        </button>
                        <button
                          className={`btn btn-ghost ${styles.cancelBtn}`}
                          onClick={() => setCancelId(reservation.reservationId)}
                          disabled={cancelling}
                        >
                          Hủy đặt bàn
                        </button>
                      </div>
                    )}
                    <div className={styles.cardDate}>
                      Đặt lúc: {formatDate(reservation.createdAt)}{" "}
                      {formatTime(reservation.createdAt)}
                    </div>
                  </div>

                  <div className={styles.cardBody}>
                    <div className={styles.infoRow}>
                      <div className={styles.infoGroup}>
                        <span className={styles.infoLabel}>Ngày:</span>
                        <span className={styles.infoValue}>
                          {formatDate(reservation.reservedAt)}
                        </span>
                      </div>
                      <div className={styles.infoGroup}>
                        <span className={styles.infoLabel}>Giờ:</span>
                        <span className={styles.infoValue}>
                          {formatTime(reservation.reservedAt)}
                        </span>
                      </div>
                      <div className={styles.infoGroup}>
                        <span className={styles.infoLabel}>Số khách:</span>
                        <span className={styles.infoValue}>
                          {reservation.partySize} người
                        </span>
                      </div>
                    </div>
                    {reservation.note && (
                      <div className={styles.note}>
                        <span className={styles.noteLabel}>Ghi chú:</span>
                        <span className={styles.noteText}>
                          {reservation.note}
                        </span>
                      </div>
                    )}

                    {reservation.order &&
                      reservation.order.orderItems.length > 0 && (
                        <div className={styles.orderSection}>
                          <h4 className={styles.orderTitle}>Món ăn đã đặt</h4>
                          <div className={styles.orderItems}>
                            {reservation.order.orderItems.map((item) => (
                              <div
                                key={item.orderItemId}
                                className={styles.orderItem}
                              >
                                <div className={styles.orderItemName}>
                                  <span className={styles.orderItemQty}>
                                    {item.quantity}x
                                  </span>
                                  {item.itemNameSnapshot}
                                </div>
                                <div className={styles.orderItemPrice}>
                                  {(
                                    item.unitPrice * item.quantity
                                  ).toLocaleString("vi-VN")}
                                  đ
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              ))}

              <div style={{ marginTop: '1rem' }}>
                <Pagination
                  currentPage={currentPage}
                  totalPages={Math.ceil(filteredReservations.length / itemsPerPage)}
                  totalItems={filteredReservations.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                />
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />

      {/* Cancel Confirmation Modal */}
      {cancelId !== null && (
        <div
          className={styles.confirmOverlay}
          onClick={() => !cancelling && setCancelId(null)}
        >
          <div
            className={styles.confirmModal}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className={styles.confirmTitle}>Xác nhận hủy đặt bàn</h3>
            <p className={styles.confirmMessage}>
              Bạn có chắc chắn muốn hủy đặt bàn #{cancelId}?<br />
              Hành động này không thể hoàn tác.
            </p>
            <div className={styles.confirmActions}>
              <button
                className="btn btn-ghost"
                onClick={() => setCancelId(null)}
                disabled={cancelling}
              >
                Không
              </button>
              <button
                className={`btn btn-primary ${styles.confirmBtn}`}
                onClick={handleCancelConfirm}
                disabled={cancelling}
              >
                {cancelling ? "Đang hủy..." : "Xác nhận hủy"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Result Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalTitle}
        type={modalType}
      >
        <p>{modalMessage}</p>
      </Modal>

      {/* Edit Preorder Modal */}
      {editReservation && (
        <EditPreorderModal
          reservation={editReservation}
          onClose={() => setEditReservation(null)}
          onSuccess={() => {
            setEditReservation(null);
            setModalType("success");
            setModalTitle("Cập nhật thành công");
            setModalMessage("Danh sách món ăn của bạn đã được cập nhật.");
            setModalOpen(true);
            loadData();
          }}
        />
      )}
    </>
  );
}
