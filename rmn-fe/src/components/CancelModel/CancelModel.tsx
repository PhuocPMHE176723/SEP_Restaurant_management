"use client";

import styles from "./CancelModel.module.css";
import { useEffect, useState } from "react";

interface CancelReservationModalProps {
  open: boolean;
  reservation: any | null;
  onClose: () => void;
  onConfirm: (data: {
    reason: string;
    detail: string;
  }) => Promise<void>;
}

export default function CancelReservationModal({
  open,
  reservation,
  onClose,
  onConfirm,
}: CancelReservationModalProps) {
  const [step, setStep] = useState<"reason" | "confirm">("reason");
  const [cancelReason, setCancelReason] = useState("");
  const [cancelDetail, setCancelDetail] = useState("");
  const [loading, setLoading] = useState(false);
  const [showError, setShowError] = useState(false);

  function resetState() {
    setStep("reason");
    setCancelReason("");
    setCancelDetail("");
    setShowError(false);
    setLoading(false);
  }

  useEffect(() => {
    if (!open) {
      resetState();
    }
  }, [open]);

  if (!open || !reservation) return null;

  const validateForm = () => {
    if (!cancelReason) return false;
    if (cancelReason === "Lý do khác" && cancelDetail.trim().length < 5) {
      return false;
    }
    return true;
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleContinue = () => {
    if (!validateForm()) {
      setShowError(true);
      return;
    }
    setStep("confirm");
  };

  const handleConfirm = async () => {
    try {
      setLoading(true);
      await onConfirm({
        reason: cancelReason,
        detail: cancelDetail,
      });
      handleClose();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles["cancel-modal-overlay"]}>
      {/* STEP 1: CHỌN LÝ DO */}
      {step === "reason" && (
        <div className={styles["cancel-modal"]}>
          <div className={styles["cancel-modal-header"]}>
            <div className={styles["cancel-modal-header-top"]}>
              <div className={styles["cancel-modal-icon"]}>⚠️</div>
              <div>
                <h2 className={styles["cancel-modal-title"]}>Hủy đơn đặt trước</h2>
                <p className={styles["cancel-modal-subtitle"]}>
                  Mã đặt bàn #{reservation.reservationId || reservation.id}
                </p>
              </div>
            </div>
          </div>

          <div className={styles["cancel-modal-body"]}>
            <div className={styles["cancel-info-box"]}>
              <div className={styles["cancel-info-top"]}>
                <div>
                  <p className={styles["cancel-label"]}>Khách hàng</p>
                  <h3 className={styles["cancel-customer-name"]}>
                    {reservation.customerName}
                  </h3>
                  <p className={styles["cancel-phone"]}>{reservation.phone}</p>
                </div>
                <div className={styles["cancel-guest-box"]}>
                  <p className={styles["cancel-label"]}>Số khách</p>
                  <p className={styles["cancel-guest-number"]}>
                    {reservation.numberOfGuests} khách
                  </p>
                </div>
              </div>

              <div className={styles["cancel-date-grid"]}>
                <div className={styles["cancel-date-item"]}>
                  <p className={styles["cancel-label"]}>Ngày đến</p>
                  <p className={styles["cancel-date-value"]}>
                    {new Date(reservation.reservedAt).toLocaleString(
                            "vi-VN",
                          )}
                  </p>
                </div>
                
              </div>
            </div>

            <div className={styles["cancel-form-group"]}>
              <label className={styles["cancel-form-label"]}>
                Lý do huỷ <span className={styles["cancel-required"]}>*</span>
              </label>
              <select
                value={cancelReason}
                onChange={(e) => {
                  setCancelReason(e.target.value);
                  setShowError(false);
                }}
                className={styles["cancel-select"]}
              >
                <option value="">-- Chọn lý do --</option>
                <option value="Khách đổi lịch">Khách đổi lịch</option>
                <option value="Khách báo bận">Khách báo bận</option>
                <option value="Khách không tới">Khách không tới (No-show)</option>
                <option value="Nhà hàng quá tải">Nhà hàng quá tải</option>
                <option value="Lý do khác">Lý do khác</option>
              </select>
            </div>

            <div className={styles["cancel-form-group"]}>
              <label className={styles["cancel-form-label"]}>Ghi chú chi tiết</label>
              <textarea
                rows={3}
                value={cancelDetail}
                placeholder="Nhập thêm mô tả..."
                onChange={(e) => {
                  setCancelDetail(e.target.value);
                  setShowError(false);
                }}
                className={`${styles["cancel-textarea"]} ${showError ? styles["cancel-error"] : ""
                  }`}
              />
              {showError && (
                <p className={styles["cancel-error-text"]}>
                  Vui lòng chọn lý do và nhập mô tả nếu chọn "Lý do khác"
                </p>
              )}
            </div>
          </div>

          <div className={styles["cancel-modal-footer"]}>
            <button onClick={handleClose} className={`${styles["cancel-btn"]} ${styles["cancel-btn-secondary"]}`}>
              Đóng
            </button>
            <button onClick={handleContinue} className={`${styles["cancel-btn"]} ${styles["cancel-btn-danger"]}`}>
              Tiếp tục
            </button>
          </div>
        </div>
      )}

      {/* ======================
      STEP 2: CONFIRM
====================== */}
      {step === "confirm" && (
        <div className={`${styles["cancel-modal"]} ${styles["confirm-step"]}`}>
          {/* Nút X đóng nhanh ở góc */}
          <button className={styles["close-x-btn"]} onClick={handleClose}>
            ✕
          </button>

          <div className={styles["cancel-confirm-body"]}>
            <div className={styles["confirm-icon-wrapper"]}>
              <div className={styles["confirm-icon-inner"]}>!</div>
            </div>

            <h3 className={styles["cancel-confirm-title"]}>Xác nhận huỷ?</h3>

            <p className={styles["cancel-confirm-desc"]}>
              Bạn có chắc chắn muốn huỷ đơn đặt bàn của khách <br />
              <strong>{reservation.customerName}</strong> không?
            </p>

            <div className={styles["confirm-summary-card"]}>
              <span className={styles["summary-label"]}>Lý do huỷ đã chọn:</span>
              <p className={styles["summary-reason"]}>{cancelReason}</p>
              {cancelDetail && (
                <p className={styles["summary-detail"]}>"{cancelDetail}"</p>
              )}
            </div>
          </div>

          <div className={styles["cancel-modal-footer-centered"]}>
            <button
              onClick={() => setStep("reason")}
              className={`${styles["cancel-btn"]} ${styles["cancel-btn-outline"]}`}
            >
              Quay lại
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className={`${styles["cancel-btn"]} ${styles["cancel-btn-danger-solid"]}`}
            >
              {loading ? "Đang xử lý..." : "Xác nhận huỷ"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}