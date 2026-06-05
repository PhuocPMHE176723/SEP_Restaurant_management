"use client";

import { useState } from "react";
import styles from "./RefundModal.module.css";

interface RefundModalProps {
  open: boolean;
  reservation: any;
  loading?: boolean;
  viewOnly?: boolean;
  onClose: () => void;
  onConfirm?: (data: {
    refundMethod: string;
    refundProff: File | null;
  }) => Promise<void> | void;
}

export default function RefundModal({
  open,
  reservation,
  loading = false,
  viewOnly = false,
  onClose,
  onConfirm,
}: RefundModalProps) {
  const [refundMethod, setRefundMethod] =
    useState("BANK_TRANSFER");

  const [proofImage, setProofImage] =
    useState<File | null>(null);

  const [preview, setPreview] =
    useState<string>("");

  if (!open || !reservation) return null;

  const handleImageChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setProofImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {

    if (!proofImage) {
      alert("Vui lòng tải ảnh bằng chứng");
      return;
    }

    await onConfirm?.({
      refundMethod,
      refundProff: proofImage,
    });
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        {/* HEADER */}
        <div className={styles.header}>
          <div>
            <h2>
              <span className={styles.dot}></span>

              {viewOnly
                ? "Chi tiết hoàn tiền"
                : "Cập nhật hoàn tiền"}
            </h2>

            <p>
              {viewOnly
                ? "Thông tin hoàn tiền đã lưu"
                : "Xác nhận đã hoàn tiền cho khách"}
            </p>
          </div>

          <button
            className={styles.closeBtn}
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* CONTENT */}
        <div className={styles.content}>
          <div className={styles.infoCard}>
            <div>
              <label>Khách hàng</label>

              <strong>
                {reservation.customerName}
              </strong>
            </div>

            <div>
              <label>Số điện thoại</label>

              <strong>
                {reservation.customerPhone}
              </strong>
            </div>

            <div>
              <label>Chi tiết đơn</label>

              <strong>
                {reservation.partySize > 0
                  ? `${reservation.partySize} khách`
                  : `${reservation.totalTables} bàn`}
              </strong>
            </div>

            <div>
              <label>Tiền cọc</label>

              <strong className={styles.deposit}>
                {(
                  reservation.depositAmount ?? 0
                ).toLocaleString("vi-VN")}{" "}
                đ
              </strong>
            </div>
          </div>

          {/* FORM */}
          <div className={styles.row}>
            <div>
              <label>
                PHƯƠNG THỨC HOÀN TIỀN
              </label>

              <select
                disabled={viewOnly}
                value={
                  viewOnly
                    ? reservation.refundMethod ??
                    "BANK_TRANSFER"
                    : refundMethod
                }
                onChange={(e) =>
                  setRefundMethod(
                    e.target.value
                  )
                }
                className={styles.input}
              >
                <option value="BANK_TRANSFER">
                  Chuyển khoản
                </option>

                <option value="CASH">
                  Tiền mặt
                </option>
              </select>
            </div>

            <div>
              <label>
                SỐ TIỀN HOÀN LẠI
              </label>

              <input
                disabled
                className={styles.input}
                value={(
                  reservation.refundAmount ??
                  reservation.depositAmount ??
                  0
                ).toLocaleString("vi-VN")}
              />
            </div>
          </div>

          {/* ẢNH CHỨNG MINH */}
          <div style={{ marginTop: 24 }}>
            <label>
              ẢNH BẰNG CHỨNG HOÀN TIỀN
            </label>

            {viewOnly ? (
              <div
                className={
                  styles.previewBox
                }
              >
                {reservation.refund_proof_url ? (
                  <img
                    src={`${reservation.refund_proof_url}`}
                    alt="Refund Proof"
                    className={
                      styles.preview
                    }
                  />
                ) : (
                  <div>
                    Không có ảnh bằng
                    chứng
                  </div>
                )}
              </div>
            ) : (
              <div
                className={
                  styles.uploadWrapper
                }
              >
                <label
                  className={
                    styles.uploadBox
                  }
                >
                  <input
                    type="file"
                    hidden
                    accept=".jpg,.jpeg,.png,.webp"
                    onChange={
                      handleImageChange
                    }
                  />

                  <div>
                    <div
                      className={
                        styles.uploadIcon
                      }
                    >
                      ⬆
                    </div>

                    <strong>
                      Nhấp để tải ảnh
                    </strong>

                    <p>
                      JPG, PNG,
                      WEBP...
                    </p>
                  </div>
                </label>

                <div
                  className={
                    styles.previewBox
                  }
                >
                  {preview ? (
                    <img
                      src={preview}
                      alt="Preview"
                      className={
                        styles.preview
                      }
                    />
                  ) : (
                    <div>
                      Chưa có ảnh
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* NOTE */}
          {viewOnly &&
            reservation.refund_note && (
              <div
                style={{
                  marginTop: 20,
                }}
              >
                <label>
                  Ghi chú hoàn tiền
                </label>

                <textarea
                  disabled
                  className={
                    styles.input
                  }
                  value={
                    reservation.refund_note
                  }
                />
              </div>
            )}
        </div>

        {/* FOOTER */}
        <div className={styles.footer}>
          <button
            className={styles.cancelBtn}
            onClick={onClose}
          >
            Đóng
          </button>

          {!viewOnly && (
            <button
              className={styles.confirmBtn}
              onClick={() => {
                handleSubmit();
              }}
            >
              Xác nhận hoàn tiền
            </button>
          )}
        </div>
      </div>
    </div>
  );
}