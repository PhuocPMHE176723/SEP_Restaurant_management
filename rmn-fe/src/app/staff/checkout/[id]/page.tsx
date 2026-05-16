"use client";

import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { useParams, useRouter } from "next/navigation";
import styles from "../Checkout.module.css";
import { invoiceApi, InvoicePreview } from "@/lib/api/invoice";
import { CustomerLookupResponse } from "@/lib/api/customer";
import CustomerLookupModal from "@/components/CustomerLookupModal";
import { getSepayConfig, checkInvoicePayment } from "@/lib/api/payment";
import { showSuccess, showError } from "@/lib/ui/alerts";
import Modal from "@/components/Modal/Modal";

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = Number(params.id);

  const [preview, setPreview] = useState<InvoicePreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [customer, setCustomer] = useState<CustomerLookupResponse | null>(null);
  const [discountCode, setDiscountCode] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [note, setNote] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [sepayConfig, setSepayConfig] = useState<{
    account: string;
    bank: string;
  } | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [isAutoChecking, setIsAutoChecking] = useState(false);
  const [qrTimer, setQrTimer] = useState(300); // 5 minutes
  const [selectedItemIndices, setSelectedItemIndices] = useState<number[]>([]);

  const getTierBadge = (tier?: string) => {
    const label = tier?.trim() || "Thành viên";
    const normalized = label
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "");

    if (normalized.includes("kim cuong")) {
      return {
        label: "Kim Cương",
        bg: "linear-gradient(135deg, #e0f2fe 0%, #f8fafc 100%)",
        color: "#0f172a",
        border: "1px solid #bae6fd",
        shadow: "0 6px 18px rgba(56, 189, 248, 0.35)",
      };
    }

    if (normalized.includes("vang")) {
      return {
        label: "Vàng",
        bg: "linear-gradient(135deg, #fef9c3 0%, #fff7ed 100%)",
        color: "#854d0e",
        border: "1px solid #fde68a",
        shadow: "0 6px 18px rgba(234, 179, 8, 0.35)",
      };
    }

    if (normalized.includes("bac")) {
      return {
        label: "Bạc",
        bg: "linear-gradient(135deg, #e2e8f0 0%, #f8fafc 100%)",
        color: "#334155",
        border: "1px solid #cbd5f5",
        shadow: "0 6px 18px rgba(148, 163, 184, 0.35)",
      };
    }

    return {
      label,
      bg: "linear-gradient(135deg, #e0f2fe 0%, #f8fafc 100%)",
      color: "#0f172a",
      border: "1px solid #bae6fd",
      shadow: "0 6px 18px rgba(56, 189, 248, 0.25)",
    };
  };

  useEffect(() => {
    if (orderId) {
      fetchPreview();
      getSepayConfig().then(setSepayConfig).catch(console.error);

      // Khôi phục timer từ localStorage nếu có
      const savedStartTime = localStorage.getItem(`qr_start_${orderId}`);
      if (savedStartTime) {
        const elapsed = Math.floor(
          (Date.now() - Number(savedStartTime)) / 1000,
        );
        const remaining = 300 - elapsed;
        if (remaining > 0) {
          setQrTimer(remaining);
          setShowQrModal(true);
          setPaymentMethod("BANK");
        } else {
          localStorage.removeItem(`qr_start_${orderId}`);
        }
      }
    }
  }, [orderId]);

  // Cảnh báo khi rời trang nếu đang hiện QR
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (showQrModal && !isSuccess) {
        e.preventDefault();
        e.returnValue =
          "Nếu bạn rời đi, phiên quét mã QR sẽ bị hủy. Bạn có chắc chắn?";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [showQrModal, isSuccess]);

  // Automated polling for Bank Transfer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    const isExpired = qrTimer <= 0;
    if (
      showQrModal &&
      paymentMethod === "BANK" &&
      sepayConfig &&
      !isSuccess &&
      !isAutoChecking &&
      !isExpired
    ) {
      interval = setInterval(async () => {
        try {
          const res = await checkInvoicePayment(
            Number(orderId),
            preview?.orderCode || "",
          );
          if (res.success) {
            clearInterval(interval);
            setIsAutoChecking(true);
            setShowQrModal(false);
            // Auto complete checkout
            handleCheckout();
          }
        } catch (err) {
          console.error("Payment polling error:", err);
        }
      }, 5000); // 5 second polling
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [
    showQrModal,
    paymentMethod,
    sepayConfig,
    orderId,
    preview?.orderCode,
    isSuccess,
    isAutoChecking,
    qrTimer,
  ]);

  // QR Modal timer
  useEffect(() => {
    let timerId: NodeJS.Timeout;
    if (showQrModal && qrTimer > 0 && !isSuccess) {
      timerId = setInterval(() => {
        setQrTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timerId);
  }, [showQrModal, qrTimer, isSuccess]);

  const isExpired = qrTimer <= 0;

  const fetchPreview = async (code?: string) => {
    try {
      setLoading(true);
      const data = await invoiceApi.getPreview(
        orderId,
        code || discountCode,
        0,
        getSelectedItemIds(),
        customer?.customerId,
      );
      setPreview(data);
    } catch (err: any) {
      setError(err.message || "Không thể tải thông tin đơn hàng.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPreview();
  }, [customer?.customerId]);

  const getSelectedItemIds = () => {
    if (!preview) return [];
    return preview.items
      .filter((_: any, idx: number) => selectedItemIndices.includes(idx))
      .map((item: any) => item.orderItemId);
  };

  useEffect(() => {
    if (preview?.items) {
      setSelectedItemIndices(preview.items.map((_: any, idx: number) => idx));
    }
  }, [preview?.orderId]);

  const handleToggleItem = (idx: number) => {
    setSelectedItemIndices((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx],
    );
  };

  useEffect(() => {
    if (preview) {
      fetchPreview();
    }
  }, [selectedItemIndices]);

  const handleApplyDiscount = async () => {
    if (!discountCode) return;
    try {
      await fetchPreview(discountCode);
      showSuccess("Đã cập nhật mã giảm giá");
    } catch (err: any) {
      showError(err.message || "Mã giảm giá không hợp lệ");
      setDiscountCode("");
    }
  };

  const handleDownloadInvoice = async () => {
    try {
      const invoiceElement = document.querySelector(`.${styles.invoicePrint}`) as HTMLElement;
      if (!invoiceElement) return;

      // Temporarily show for capture
      invoiceElement.style.display = "block";
      invoiceElement.style.position = "absolute";
      invoiceElement.style.left = "-9999px";

      const html2canvas = (await import("html2canvas")).default;
      const jsPDF = (await import("jspdf")).default;

      const canvas = await html2canvas(invoiceElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      // Restore
      invoiceElement.style.display = "";
      invoiceElement.style.position = "";
      invoiceElement.style.left = "";

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [80, 150], // Receipt size
      });

      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`HoaDon_${preview.orderCode}.pdf`);
    } catch (error) {
      console.error("PDF generation error:", error);
      Swal.fire("Lỗi", "Không thể tạo file PDF.", "error");
    }
  };

  const handleCheckout = async () => {
    if (isProcessing || isSuccess) return;

    // Nếu chọn chuyển khoản mà chưa hiện QR thì hiện QR trước
    if (paymentMethod === "BANK" && !showQrModal) {
      setShowQrModal(true);
      setQrTimer(300);
      localStorage.setItem(`qr_start_${orderId}`, Date.now().toString());
      return;
    }

    setIsProcessing(true);
    try {
      await invoiceApi.checkout({
        orderId,
        discountCode: discountCode || undefined,
        pointsToUse: 0,
        paidAmount: preview?.amountToPay ?? 0,
        selectedItemIds: getSelectedItemIds(),
        customerId: customer?.customerId,
      });
      setIsSuccess(true);
      localStorage.removeItem(`qr_start_${orderId}`);

      const result = await Swal.fire({
        title: "Thanh toán thành công!",
        text: "Hóa đơn đang được tải xuống tự động...",
        icon: "success",
        showCancelButton: true,
        confirmButtonText: "Tải lại hóa đơn",
        cancelButtonText: "Đóng",
        confirmButtonColor: "var(--brand-primary)",
        cancelButtonColor: "#64748b",
        timer: 3000,
        timerProgressBar: true,
      });

      // Auto download
      await handleDownloadInvoice();

      if (result.isConfirmed) {
        await handleDownloadInvoice();
      }

      router.push("/staff/orders");
    } catch (err: any) {
      Swal.fire({
        title: "Thanh toán thất bại",
        text: err.message || "Vui lòng thử lại sau.",
        icon: "error",
        confirmButtonColor: "var(--error)",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) return <div className={styles.container}>Đang tải...</div>;
  if (!preview)
    return <div className={styles.container}>Không tìm thấy đơn hàng.</div>;

  return (
    <div className={styles.container}>
      {/* Dedicated Print Invoice - Hidden on screen, visible on print */}
      <div className={styles.invoicePrint}>
        <div style={{ textAlign: "center", marginBottom: "1rem" }}>
          <h2 style={{ margin: "0 0 5px 0", fontSize: "20px" }}>
            NHÀ HÀNG G26
          </h2>
          <p style={{ margin: "2px 0", fontSize: "12px" }}>
            Địa chỉ: 123 Đường ABC, Quận XYZ, TP. HCM
          </p>
          <p style={{ margin: "2px 0", fontSize: "12px" }}>
            Số điện thoại: 0123 456 789
          </p>
          <div
            style={{
              borderBottom: "1px dashed #000",
              margin: "10px 0",
            }}
          ></div>
          <h3 style={{ margin: "10px 0 5px 0", fontSize: "18px" }}>
            HÓA ĐƠN THANH TOÁN
          </h3>
          <p style={{ margin: "2px 0", fontSize: "12px" }}>
            Mã đơn: #{preview.orderCode}
          </p>
          <p style={{ margin: "2px 0", fontSize: "12px" }}>
            Ngày: {new Date().toLocaleString("vi-VN")}
          </p>
          <p style={{ margin: "2px 0", fontSize: "12px" }}>
            Nhân viên: {customer?.fullName || "Staff"}
          </p>
        </div>

        <table
          style={{
            width: "100%",
            fontSize: "12px",
            borderCollapse: "collapse",
          }}
        >
          <thead>
            <tr style={{ borderBottom: "1px solid #000" }}>
              <th style={{ textAlign: "left", padding: "5px 0" }}>Tên món</th>
              <th style={{ textAlign: "center", padding: "5px 0" }}>SL</th>
              <th style={{ textAlign: "right", padding: "5px 0" }}>T.Tiền</th>
            </tr>
          </thead>
          <tbody>
            {preview.items
              ?.filter((_: any, idx: number) =>
                selectedItemIndices.includes(idx),
              )
              .map((item: any, idx: number) => (
                <tr key={idx} style={{ borderBottom: "1px dashed #eee" }}>
                  <td style={{ padding: "8px 0" }}>{item.itemNameSnapshot}</td>
                  <td style={{ textAlign: "center" }}>{item.quantity}</td>
                  <td style={{ textAlign: "right" }}>
                    {(item.unitPrice * item.quantity).toLocaleString()}đ
                  </td>
                </tr>
              ))}
          </tbody>
        </table>

        <div
          style={{ borderBottom: "1px solid #000", margin: "10px 0" }}
        ></div>

        <div style={{ fontSize: "13px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              margin: "4px 0",
            }}
          >
            <span>Tạm tính:</span>
            <span>{preview.subtotal.toLocaleString()}đ</span>
          </div>
          {preview.discountAmount > 0 && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                margin: "4px 0",
              }}
            >
              <span>Giảm giá:</span>
              <span>-{preview.discountAmount.toLocaleString()}đ</span>
            </div>
          )}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              margin: "4px 0",
            }}
          >
            <span>Thuế VAT (8%):</span>
            <span>{preview.vatAmount.toLocaleString()}đ</span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              margin: "8px 0",
              fontWeight: "bold",
              fontSize: "16px",
            }}
          >
            <span>TỔNG CỘNG:</span>
            <span>{preview.amountToPay.toLocaleString()}đ</span>
          </div>
        </div>

        <div
          style={{
            borderBottom: "1px dashed #000",
            margin: "15px 0",
          }}
        ></div>

        <div style={{ textAlign: "center", fontSize: "12px" }}>
          <p style={{ margin: "5px 0" }}>Cảm ơn Quý khách. Hẹn gặp lại!</p>
          <p style={{ margin: "5px 0", fontStyle: "italic" }}>
            Mật khẩu Wifi: g26restaurant
          </p>
        </div>
      </div>

      <header className={styles.header}>
        <button className={styles.backButton} onClick={() => router.back()}>
          ← Quay lại
        </button>
        <h1 className={styles.title}>BILL #{preview.orderCode}</h1>
        {isSuccess && (
          <button
            className={styles.backButton}
            onClick={handleDownloadInvoice}
            style={{ background: "#0f172a", color: "white" }}
          >
            🖨️ Tải Hóa Đơn (PDF)
          </button>
        )}
      </header>

      <div className={styles.content}>
        <div className={styles.orderSection}>
          <h2 className={styles.sectionTitle}>Chi tiết đơn hàng</h2>
          <table className={styles.itemTable}>
            <thead>
              <tr>
                <th></th>
                <th>Món ăn</th>
                <th style={{ textAlign: "center" }}>SL</th>
                <th style={{ textAlign: "right" }}>Đơn giá</th>
                <th style={{ textAlign: "right" }}>Thành tiền</th>
              </tr>
            </thead>
            {/* <tbody>
              {preview.items?.map((item: any, idx: number) => (
                <tr key={idx}>
                  <td className={styles.itemName}>{item.itemNameSnapshot}</td>
                  <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                  <td style={{ textAlign: 'right' }}>{item.unitPrice?.toLocaleString()}đ</td>
                  <td style={{ textAlign: 'right' }}>{(item.quantity * item.unitPrice).toLocaleString()}đ</td>
                </tr>
              ))}
            </tbody> */}
            <tbody>
              {preview.items?.map((item: any, idx: number) => {
                const checked = selectedItemIndices.includes(idx);

                return (
                  <tr key={idx} style={{ opacity: checked ? 1 : 0.5 }}>
                    <td>
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={item.status === "SERVED"}
                        onChange={() => handleToggleItem(idx)}
                      />
                    </td>

                    <td className={styles.itemName}>
                      {item.itemNameSnapshot}
                      {item.status === "SERVED" && (
                        <span
                          style={{
                            marginLeft: 6,
                            color: "green",
                            fontSize: 12,
                          }}
                        >
                          ✓
                        </span>
                      )}
                    </td>

                    <td style={{ textAlign: "center" }}>{item.quantity}</td>

                    <td style={{ textAlign: "right" }}>
                      {item.unitPrice?.toLocaleString()}đ
                    </td>

                    <td style={{ textAlign: "right" }}>
                      {checked
                        ? (item.quantity * item.unitPrice).toLocaleString() +
                          "đ"
                        : "0đ"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div style={{ marginTop: "2rem" }} className={styles.noteArea}>
            <label
              className={styles.sectionTitle}
              style={{
                border: "none",
                marginBottom: "0.5rem",
                display: "block",
              }}
            >
              Ghi chú phiếu thanh toán
            </label>
            <textarea
              className={styles.input}
              style={{ width: "100%", minHeight: "80px" }}
              placeholder="Nhập ghi chú xuất bill nếu có..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.paymentSection}>
          {customer ? (
            <div className={styles.customerCard}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "0.5rem",
                }}
              >
                <span style={{ fontSize: "0.875rem", color: "#64748b" }}>
                  Thành viên hệ thống
                </span>
                <button
                  onClick={() => {
                    setCustomer(null);
                    fetchPreview(undefined);
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#ef4444",
                    cursor: "pointer",
                    fontSize: "12px",
                  }}
                >
                  Gỡ
                </button>
              </div>
              <div className={styles.customerInfo}>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 4 }}
                >
                  <span className={styles.customerName}>
                    {customer.fullName}
                  </span>
                  {(() => {
                    const tier = getTierBadge(customer.currentTier);
                    const tierLabel = tier.label;
                    return (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          fontSize: 12,
                          fontWeight: 700,
                          color: tier.color,
                          background: tier.bg,
                          padding: "4px 10px",
                          borderRadius: 999,
                          width: "fit-content",
                          border: tier.border,
                          boxShadow: tier.shadow,
                        }}
                      >
                        {tierLabel}
                      </span>
                    );
                  })()}
                </div>
                <span
                  className={styles.customerPoints}
                  style={{
                    background: "#fef3c7",
                    color: "#92400e",
                    padding: "2px 10px",
                    borderRadius: "12px",
                    fontWeight: 600,
                  }}
                >
                  {(customer as any).TotalPoints ??
                    (customer as any).totalPoints ??
                    0}{" "}
                  điểm
                </span>
              </div>
            </div>
          ) : (
            <div className={styles.discountSection}>
              <label
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "#475569",
                }}
              >
                Tra cứu điểm thành viên
              </label>
              <div className={styles.discountInputWrapper}>
                <input
                  className={styles.input}
                  type="text"
                  placeholder="Nhập SĐT khách hàng..."
                  onChange={(e) => {
                    setPhoneNumber(e.target.value);
                    if (e.target.value.length > 0) {
                      setIsModalOpen(true);
                    }
                  }}
                  onClick={() => setIsModalOpen(true)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      setIsModalOpen(true);
                    }
                  }}
                />
                <button
                  className={styles.applyBtn}
                  onClick={() => setIsModalOpen(true)}
                >
                  Tìm khách
                </button>
              </div>
            </div>
          )}

          <div className={styles.discountSection}>
            <label
              style={{
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "#475569",
              }}
            >
              Mã giảm giá
            </label>
            <div className={styles.discountInputWrapper}>
              <input
                className={styles.input}
                type="text"
                placeholder="Nhập mã CODE..."
                value={discountCode}
                onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
              />
              <button
                className={styles.applyBtn}
                onClick={handleApplyDiscount}
                disabled={!discountCode}
              >
                Áp dụng
              </button>
            </div>
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label
              style={{
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "#475569",
                display: "block",
                marginBottom: "0.5rem",
              }}
            >
              Phương thức thanh toán
            </label>
            <div className={styles.methodGrid}>
              <div
                className={`${styles.methodItem} ${paymentMethod === "CASH" ? styles.active : ""}`}
                onClick={() => setPaymentMethod("CASH")}
              >
                Tiền mặt
              </div>
              <div
                className={`${styles.methodItem} ${paymentMethod === "BANK" ? styles.active : ""}`}
                onClick={() => setPaymentMethod("BANK")}
              >
                Chuyển khoản
              </div>
            </div>
          </div>

          <div className={styles.summary}>
            <div className={styles.summaryRow}>
              <span>Tạm tính</span>
              <span>{preview.subtotal.toLocaleString()}đ</span>
            </div>
            {preview.discountAmount > 0 && (
              <div className={styles.summaryRow} style={{ color: "#10b981" }}>
                <span>Giảm giá/Ưu đãi</span>
                <span>-{preview.discountAmount.toLocaleString()}đ</span>
              </div>
            )}
            <div className={styles.summaryRow} style={{ color: "#0ea5e9" }}>
              <span>Thuế VAT (8%)</span>
              <span>+{preview.vatAmount.toLocaleString()}đ</span>
            </div>
            <div
              className={styles.summaryRow}
              style={{
                borderTop: "1px dashed #e2e8f0",
                paddingTop: "0.5rem",
                fontWeight: 600,
              }}
            >
              <span>Tổng cộng bill</span>
              <span>{preview.totalAmount.toLocaleString()}đ</span>
            </div>
            {preview.depositDeducted > 0 && (
              <div className={styles.summaryRow} style={{ color: "#0ea5e9" }}>
                <span>Đã trừ tiền cọc</span>
                <span>-{preview.depositDeducted.toLocaleString()}đ</span>
              </div>
            )}
            {preview.refundAmount > 0 ? (
              <div
                className={`${styles.summaryRow} ${styles.total}`}
                style={{
                  background: "#ecfdf5",
                  borderColor: "#10b981",
                  color: "#059669",
                  padding: "1rem",
                  borderRadius: "12px",
                  marginTop: "1rem",
                }}
              >
                <span style={{ fontWeight: 800 }}>TIỀN HOÀN CỌC CHO KHÁCH</span>
                <span style={{ fontSize: "1.5rem", fontWeight: 900 }}>
                  {preview.refundAmount.toLocaleString()}đ
                </span>
              </div>
            ) : (
              <div className={`${styles.summaryRow} ${styles.total}`}>
                <span>Số tiền cần thu</span>
                <span>{preview.amountToPay.toLocaleString()}đ</span>
              </div>
            )}
            <div
              className={styles.summaryRow}
              style={{ fontSize: "0.85rem", color: "#64748b" }}
            >
              <span>Điểm thưởng tích lũy thêm</span>
              <span>+{preview.pointsEarned} điểm</span>
            </div>
          </div>

          <button
            className={styles.checkoutBtn}
            onClick={handleCheckout}
            disabled={isProcessing}
          >
            {isProcessing ? "Đang xử lý..." : "Xác nhận thanh toán"}
          </button>

          {paymentMethod === "BANK" && sepayConfig && (
            <button
              className={styles.viewQrBtn}
              onClick={() => setShowQrModal(true)}
              style={{
                background: "#fef3c7",
                borderColor: "#f59e0b",
                color: "#b45309",
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <rect x="7" y="7" width="3" height="3" />
                <rect x="14" y="7" width="3" height="3" />
                <rect x="7" y="14" width="3" height="3" />
                <rect x="14" y="14" width="3" height="3" />
              </svg>
              Đang chờ thanh toán (Mở QR)
            </button>
          )}
        </div>
      </div>

      <Modal
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
        title="Quét mã QR thanh toán"
        type="info"
        showFooter={true}
        size="md"
      >
        <div className={styles.qrContainer}>
          <p className={styles.qrTitle}>
            Quý khách vui lòng quét mã này bằng ứng dụng Ngân hàng hoặc Ví điện
            tử để thanh toán.
          </p>

          <div className={styles.qrCodeWrapper}>
            <div className={styles.qrScannerLine} />
            <img
              src={`https://qr.sepay.vn/img?acc=${sepayConfig?.account}&bank=${sepayConfig?.bank}&amount=${preview.amountToPay}&des=${encodeURIComponent(`Thanh toan hoa don ${preview.orderCode}`)}`}
              alt="QR Code SePay"
              className={styles.qrCode}
            />
          </div>

          <div className={styles.qrAmountWrapper}>
            <span className={styles.qrAmountLabel}>Số tiền cần thanh toán</span>
            <strong className={styles.qrAmountValue}>
              {preview.amountToPay.toLocaleString("vi-VN")} đ
            </strong>
          </div>

          <div className={styles.qrStatus}>
            <div
              className={`${styles.statusBadge} ${isSuccess ? styles.statusSuccess : isExpired ? styles.statusError : styles.statusPending}`}
            >
              <div className={styles.statusIcon}>
                {isSuccess ? (
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                ) : isExpired ? (
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                ) : (
                  <span className={styles.spinnerSmall} />
                )}
              </div>
              {isSuccess
                ? "Thanh toán thành công"
                : isExpired
                  ? "Mã QR đã hết hạn"
                  : `Đang chờ nhận tiền... (${Math.floor(qrTimer / 60)}:${(qrTimer % 60).toString().padStart(2, "0")})`}
            </div>
          </div>
        </div>
      </Modal>

      {isModalOpen && (
        <CustomerLookupModal
          initialPhone={phoneNumber}
          onSelect={setCustomer}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}
