"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import styles from '../Checkout.module.css';
import { invoiceApi, InvoicePreview } from '@/lib/api/invoice';
import { CustomerLookupResponse } from '@/lib/api/customer';
import CustomerLookupModal from '@/components/CustomerLookupModal';

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

  useEffect(() => {
    if (orderId) {
      fetchPreview();
    }
  }, [orderId]);

  const fetchPreview = async () => {
    try {
      const data = await invoiceApi.previewInvoice(orderId);
      setPreview(data);
      if (data.customerId) {
        setCustomer({
          customerId: data.customerId,
          fullName: data.customerName || "Khách hàng",
          phone: "",
          totalPoints: 0
        });
      }
    } catch (err: any) {
      setError(err.message || "Không thể tải thông tin đơn hàng.");
    } finally {
      setLoading(false);
    }
  };

  const handleValidateDiscount = async () => {
    if (!discountCode || !preview) return;
    try {
      const { promotionApi } = await import('@/lib/api/promotion-helper');
      const data = await promotionApi.validateDiscount(discountCode, preview.subtotal);
      setDiscountInfo({ type: data.discountType, value: data.discountValue, max: data.maxDiscountAmount });
      
      let amount = 0;
      if (data.discountType === 'PERCENTAGE' || data.discountType === 'PERCENT') {
        amount = preview.subtotal * (data.discountValue / 100);
        if (data.maxDiscountAmount && amount > data.maxDiscountAmount) {
          amount = data.maxDiscountAmount;
        }
      } else {
        amount = data.discountValue;
      }
      setDiscountAmount(amount);
      alert(`Áp dụng mã thành công! Giảm ${amount.toLocaleString()}đ`);
    } catch (err: any) {
      alert(err.message || "Mã giảm giá không hợp lệ.");
      setDiscountInfo(null);
      setDiscountAmount(0);
    }
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
        customerId: customer?.customerId,
        discountCode: discountCode || undefined,
        paymentMethod,
        note
      });
      setIsSuccess(true);
      alert("Thanh toán thành công! Bạn có thể in hóa đơn bây giờ.");
    } catch (err: any) {
      alert(err.message || "Thanh toán thất bại.");
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
              {preview.items.map((item, idx) => (
                <tr key={idx}>
                  <td className={styles.itemName}>{item.menuItemName}</td>
                  <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                  <td style={{ textAlign: 'right' }}>{item.unitPrice.toLocaleString()}đ</td>
                  <td style={{ textAlign: 'right' }}>{item.total.toLocaleString()}đ</td>
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
                onClick={handleValidateDiscount}
                disabled={!discountCode}
              >
                Áp dụng
              </button>
            </div>
          </div>

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
            <div className={styles.summaryRow}>
              <span>Thuế VAT (8%)</span>
              <span>{calculateVAT().toLocaleString()}đ</span>
            </div>
            {discountAmount > 0 && (
              <div className={styles.summaryRow} style={{ color: '#10b981' }}>
                <span>Giảm giá</span>
                <span>-{discountAmount.toLocaleString()}đ</span>
              </div>
            )}
            <div className={`${styles.summaryRow} ${styles.total}`}>
              <span>Tổng cộng</span>
              <span>{calculateFinalTotal().toLocaleString()}đ</span>
            </div>
          </div>

          <button 
            className={styles.checkoutBtn} 
            onClick={handleCheckout}
            disabled={isProcessing}
          >
            {isProcessing ? 'Đang xử lý...' : 'Xác nhận thanh toán'}
          </button>
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
