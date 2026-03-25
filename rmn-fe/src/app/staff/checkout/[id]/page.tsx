"use client";

import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { useParams, useRouter } from 'next/navigation';
import styles from '../Checkout.module.css';
import { invoiceApi, InvoicePreview } from '@/lib/api/invoice';
import { CustomerLookupResponse } from '@/lib/api/customer';
import CustomerLookupModal from '@/components/CustomerLookupModal';
import { getSepayConfig } from '@/lib/api/payment';
import { showSuccess, showError } from '@/lib/ui/alerts';

export default function CheckoutPage() {
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

  useEffect(() => {
    if (orderId) {
      fetchPreview();
    }
  }, [orderId]);

  useEffect(() => {
    async function loadConfig() {
      try {
        const cfg = await getSepayConfig();
        setSepayConfig(cfg);
      } catch (e) {
        console.error("Failed to load SePay config:", e);
      }
    }
    loadConfig();
  }, []);

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
    await fetchPreview(discountCode);
    showSuccess("Đã cập nhật mã giảm giá");
  };

  const handleApplyPoints = async () => {
    if (pointsToUse < 0) return;
    await fetchPreview(undefined, pointsToUse);
    showSuccess("Đã cập nhật điểm thưởng");
  };

  const calculateFinalTotal = () => {
    if (!preview) return 0;
    const afterDiscount = preview.subtotal - discountAmount;
    const vat = Math.round(afterDiscount * 0.08);
    return afterDiscount + vat;
  };

  const calculateVAT = () => {
    if (!preview) return 0;
    return Math.round((preview.subtotal - discountAmount) * 0.08);
  };

  const handleCheckout = async () => {
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
      <header className={styles.header}>
        <button className={styles.backButton} onClick={() => router.back()}>
          ← Quay lại
        </button>
        <h1 className={styles.title}>Thanh toán đơn hàng #{preview.orderCode}</h1>
        {isSuccess && (
          <button className={styles.backButton} onClick={() => window.print()} style={{ background: '#0f172a', color: 'white' }}>
            🖨️ In hóa đơn
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
                  <td className={styles.itemName}>{item.menuItemName}</td>
                  <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                  <td style={{ textAlign: 'right' }}>{item.unitPrice?.toLocaleString()}đ</td>
                  <td style={{ textAlign: 'right' }}>{(item.quantity * item.unitPrice).toLocaleString()}đ</td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div style={{ marginTop: '2rem' }} className={styles.noteArea}>
            <label className={styles.sectionTitle} style={{ border: 'none', marginBottom: '0.5rem', display: 'block' }}>Ghi chú hóa đơn</label>
            <textarea 
              className={styles.input} 
              style={{ width: '100%', minHeight: '80px' }}
              placeholder="Nhập ghi chú xuất hóa đơn nếu có..."
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
              {['CASH', 'BANK', 'QR', 'CARD'].map(m => (
                <div 
                  key={m}
                  className={`${styles.methodItem} ${paymentMethod === m ? styles.active : ''}`}
                  onClick={() => setPaymentMethod(m)}
                >
                  {m === 'CASH' ? 'Tiền mặt' : m === 'BANK' ? 'Chuyển khoản' : m === 'QR' ? 'Quét mã QR' : 'Thẻ'}
                </div>
              ))}
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
              <span>Tổng cộng hóa đơn</span>
              <span>{preview.totalAmount.toLocaleString()}đ</span>
            </div>
            {preview.depositDeducted > 0 && (
              <div className={styles.summaryRow} style={{ color: '#0ea5e9' }}>
                <span>Đã trừ tiền cọc</span>
                <span>-{preview.depositDeducted.toLocaleString()}đ</span>
              </div>
            )}
            <div className={`${styles.summaryRow} ${styles.total}`}>
              <span>Số tiền cần thu</span>
              <span>{preview.amountToPay.toLocaleString()}đ</span>
            </div>
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

          {paymentMethod === 'QR' && sepayConfig && (
            <div style={{ marginTop: '1.5rem', textAlign: 'center', padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <p style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '1rem' }}>Mã QR Thanh Toán (Tổng tiền)</p>
              <img 
                src={`https://qr.sepay.vn/img?acc=${sepayConfig.account}&bank=${sepayConfig.bank}&amount=${calculateFinalTotal()}&des=${encodeURIComponent(`Thanh toan hoa don ${preview.orderCode}`)}`}
                alt="QR Code"
                style={{ width: '100%', maxWidth: '200px', margin: '0 auto', display: 'block' }}
              />
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '0.5rem' }}>Dành cho nhân viên quét cho khách</p>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <CustomerLookupModal 
          onSelect={setCustomer} 
          onClose={() => setIsModalOpen(false)} 
        />
      )}
    </div>
  );
}
