"use client";

import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { useParams, useRouter } from 'next/navigation';
import styles from '../Checkout.module.css';
import { invoiceApi, InvoicePreview } from '@/lib/api/invoice';
import { CustomerLookupResponse } from '@/lib/api/customer';
import CustomerLookupModal from '@/components/CustomerLookupModal';
import { getSepayConfig, checkInvoicePayment } from '@/lib/api/payment';
import { showSuccess, showError } from '@/lib/ui/alerts';
import Modal from '@/components/Modal/Modal';

export default function CashierCheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = Number(params.id);

  const [preview, setPreview] = useState<InvoicePreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [customer, setCustomer] = useState<CustomerLookupResponse | null>(null);
  const [discountCode, setDiscountCode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [note, setNote] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [discountInfo, setDiscountInfo] = useState<{ type: string; value: number; max?: number } | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [sepayConfig, setSepayConfig] = useState<{ account: string; bank: string } | null>(null);
  const [pointsToUse, setPointsToUse] = useState(0);
  const [showQrModal, setShowQrModal] = useState(false);
  const [isAutoChecking, setIsAutoChecking] = useState(false);
  const [qrTimer, setQrTimer] = useState(300); // 5 minutes

  useEffect(() => {
    if (orderId) {
      fetchPreview();
      getSepayConfig().then(setSepayConfig).catch(console.error);
    }
  }, [orderId]);

  // Automated polling for Bank Transfer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    const isExpired = qrTimer <= 0;
    if (showQrModal && paymentMethod === 'BANK' && sepayConfig && !isSuccess && !isAutoChecking && !isExpired) {
      interval = setInterval(async () => {
        try {
          const res = await checkInvoicePayment(Number(orderId), preview?.orderCode || "");
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
  }, [showQrModal, paymentMethod, sepayConfig, orderId, preview?.orderCode, isSuccess, isAutoChecking, qrTimer]);

  // QR Modal timer
  useEffect(() => {
    let timerId: NodeJS.Timeout;
    if (showQrModal && qrTimer > 0 && !isSuccess) {
      timerId = setInterval(() => {
        setQrTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timerId);
  }, [showQrModal, qrTimer, isSuccess]);

  const isExpired = qrTimer <= 0;

  const fetchPreview = async (code?: string, points?: number) => {
    try {
      setLoading(true);
      const data = await invoiceApi.getPreview(orderId, code || discountCode, points ?? pointsToUse);
      setPreview(data);
    } catch (err: any) {
      setError(err.message || "Không thể tải thông tin đơn hàng.");
    } finally {
      setLoading(false);
    }
  };

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

  const handleApplyPoints = async () => {
    if (pointsToUse < 0) return;
    try {
      await fetchPreview(undefined, pointsToUse);
      showSuccess("Đã cập nhật điểm thưởng");
    } catch (err: any) {
      showError(err.message || "Không thể sử dụng điểm");
      setPointsToUse(0);
    }
  };

  const handleCheckout = async () => {
    if (isProcessing || isSuccess) return;
    setIsProcessing(true);
    try {
      await invoiceApi.checkout({
        orderId,
        discountCode: discountCode || undefined,
        pointsToUse,
        paidAmount: preview?.amountToPay ?? 0
      });
      setIsSuccess(true);
      Swal.fire({
        title: "Thành công",
        text: "Thanh toán thành công! Bạn có thể in hóa đơn bây giờ.",
        icon: "success",
        confirmButtonColor: "var(--brand-primary)"
      });
    } catch (err: any) {
      Swal.fire({
        title: "Thanh toán thất bại",
        text: err.message || "Vui lòng thử lại sau.",
        icon: "error",
        confirmButtonColor: "var(--error)"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) return <div className={styles.container}>Đang tải...</div>;
  if (!preview) return <div className={styles.container}>Không tìm thấy đơn hàng.</div>;

  return (
    <div className={styles.container}>
      {/* Header chỉ hiện khi in */}
      <div className={styles.printOnlyHeader}>
        <h1>NHÀ HÀNG G26</h1>
        <p>Địa chỉ: 123 Đường ABC, Quận XYZ, TP. Hồ Chí Minh</p>
        <p>Số điện thoại: 0123 456 789</p>
        <div style={{ borderBottom: '1px dashed #000', margin: '1rem 0' }}></div>
      </div>

      <header className={styles.header}>
        <button className={styles.backButton} onClick={() => router.back()}>
          ← Quay lại
        </button>
        <h1 className={styles.title}>BILL #{preview.orderCode}</h1>
        {isSuccess && (
          <button className={styles.backButton} onClick={() => window.print()} style={{ background: '#0f172a', color: 'white' }}>
            🖨️ In Bill (PDF)
          </button>
        )}
      </header>

      <div className={styles.content}>
        <div className={styles.orderSection}>
          <h2 className={styles.sectionTitle}>Chi tiết đơn hàng</h2>
          <table className={styles.itemTable}>
            <thead>
              <tr>
                <th>Món ăn</th>
                <th style={{ textAlign: 'center' }}>SL</th>
                <th style={{ textAlign: 'right' }}>Đơn giá</th>
                <th style={{ textAlign: 'right' }}>Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              {preview.items?.map((item: any, idx: number) => (
                <tr key={idx}>
                  <td className={styles.itemName}>{item.itemNameSnapshot}</td>
                  <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                  <td style={{ textAlign: 'right' }}>{item.unitPrice?.toLocaleString()}đ</td>
                  <td style={{ textAlign: 'right' }}>{(item.quantity * item.unitPrice).toLocaleString()}đ</td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div style={{ marginTop: '2rem' }} className={styles.noteArea}>
            <label className={styles.sectionTitle} style={{ border: 'none', marginBottom: '0.5rem', display: 'block' }}>Ghi chú phiếu thanh toán</label>
            <textarea 
              className={styles.input} 
              style={{ width: '100%', minHeight: '80px' }}
              placeholder="Nhập ghi chú xuất bill nếu có..."
              value={note}
              onChange={e => setNote(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.paymentSection}>
          {customer ? (
            <div className={styles.customerCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Khách hàng thân thiết</span>
                <button onClick={() => setCustomer(null)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '12px' }}>Gỡ</button>
              </div>
              <div className={styles.customerInfo}>
                <span className={styles.customerName}>{customer.fullName}</span>
                <span className={styles.customerPoints}>{customer.totalPoints} điểm</span>
              </div>
            </div>
          ) : (
            <button className={styles.lookupBtn} onClick={() => setIsModalOpen(true)}>
              + Gắn khách hàng (Tích điểm/Giảm giá)
            </button>
          )}

          <div className={styles.discountSection}>
            <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#475569' }}>Mã giảm giá</label>
            <div className={styles.discountInputWrapper}>
              <input 
                className={styles.input} 
                type="text" 
                placeholder="Nhập mã CODE..." 
                value={discountCode}
                onChange={e => setDiscountCode(e.target.value.toUpperCase())}
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

          {customer && (
            <div className={styles.discountSection} style={{ marginTop: '1rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#475569' }}>Dùng điểm tích lũy (Có {customer.totalPoints} điểm)</label>
              <div className={styles.discountInputWrapper}>
                <input 
                  className={styles.input} 
                  type="number" 
                  placeholder="Số điểm muốn dùng..." 
                  value={pointsToUse}
                  onChange={e => setPointsToUse(Number(e.target.value))}
                />
                <button 
                  className={styles.applyBtn} 
                  onClick={handleApplyPoints}
                >
                  Dùng điểm
                </button>
              </div>
            </div>
          )}

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.5rem' }}>Phương thức thanh toán</label>
            <div className={styles.methodGrid}>
              <div 
                className={`${styles.methodItem} ${paymentMethod === 'CASH' ? styles.active : ''}`}
                onClick={() => setPaymentMethod('CASH')}
              >
                Tiền mặt
              </div>
              <div 
                className={`${styles.methodItem} ${paymentMethod === 'BANK' ? styles.active : ''}`}
                onClick={() => {
                  setPaymentMethod('BANK');
                  setShowQrModal(true);
                }}
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
              <div className={styles.summaryRow} style={{ color: '#10b981' }}>
                <span>Giảm giá/Ưu đãi</span>
                <span>-{preview.discountAmount.toLocaleString()}đ</span>
              </div>
            )}
            <div className={styles.summaryRow}>
              <span>Thuế VAT (8%)</span>
              <span>{preview.vatAmount.toLocaleString()}đ</span>
            </div>
            <div className={styles.summaryRow} style={{ borderTop: '1px dashed #e2e8f0', paddingTop: '0.5rem', fontWeight: 600 }}>
              <span>Tổng cộng bill</span>
              <span>{preview.totalAmount.toLocaleString()}đ</span>
            </div>
            {preview.depositDeducted > 0 && (
              <div className={styles.summaryRow} style={{ color: '#0ea5e9' }}>
                <span>Đã trừ tiền cọc</span>
                <span>-{preview.depositDeducted.toLocaleString()}đ</span>
              </div>
            )}
            {preview.refundAmount > 0 ? (
              <div className={`${styles.summaryRow} ${styles.total}`} style={{ background: '#ecfdf5', borderColor: '#10b981', color: '#059669', padding: '1rem', borderRadius: '12px', marginTop: '1rem' }}>
                <span style={{ fontWeight: 800 }}>TIỀN HOÀN CỌC CHO KHÁCH</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 900 }}>{preview.refundAmount.toLocaleString()}đ</span>
              </div>
            ) : (
              <div className={`${styles.summaryRow} ${styles.total}`}>
                <span>Số tiền cần thu</span>
                <span>{preview.amountToPay.toLocaleString()}đ</span>
              </div>
            )}
            <div className={styles.summaryRow} style={{ fontSize: '0.85rem', color: '#64748b' }}>
              <span>Điểm thưởng tích lũy thêm</span>
              <span>+{preview.pointsEarned} điểm</span>
            </div>
          </div>

          <button 
            className={styles.checkoutBtn} 
            onClick={handleCheckout}
            disabled={isProcessing}
          >
            {isProcessing ? 'Đang xử lý...' : 'Xác nhận thanh toán'}
          </button>

          {paymentMethod === 'BANK' && sepayConfig && (
            <button 
              className={styles.viewQrBtn} 
              onClick={() => setShowQrModal(true)}
              style={{ background: '#fef3c7', borderColor: '#f59e0b', color: '#b45309' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <rect x="7" y="7" width="3" height="3"/>
                <rect x="14" y="7" width="3" height="3"/>
                <rect x="7" y="14" width="3" height="3"/>
                <rect x="14" y="14" width="3" height="3"/>
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
      >
        <div className={styles.qrContainer}>
          <p className={styles.qrTitle}>
            Quý khách vui lòng quét mã này bằng ứng dụng Ngân hàng hoặc Ví điện tử để thanh toán.
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
            <strong className={styles.qrAmountValue}>{preview.amountToPay.toLocaleString("vi-VN")} đ</strong>
          </div>
          
          <div className={styles.qrStatus}>
            <div className={`${styles.statusBadge} ${isSuccess ? styles.statusSuccess : isExpired ? styles.statusError : styles.statusPending}`}>
              <div className={styles.statusIcon}>
                {isSuccess ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                ) : isExpired ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                ) : (
                  <span className={styles.spinnerSmall} />
                )}
              </div>
              {isSuccess ? "Thanh toán thành công" : isExpired ? "Mã QR đã hết hạn" : `Đang chờ nhận tiền... (${Math.floor(qrTimer / 60)}:${(qrTimer % 60).toString().padStart(2, '0')})`}
            </div>
          </div>
        </div>
      </Modal>

      {isModalOpen && (
        <CustomerLookupModal 
          onSelect={setCustomer} 
          onClose={() => setIsModalOpen(false)} 
        />
      )}
    </div>
  );
}
