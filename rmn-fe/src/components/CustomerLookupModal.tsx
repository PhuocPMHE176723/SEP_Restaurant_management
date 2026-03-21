"use client";

import React, { useState } from 'react';
import styles from '../app/staff/checkout/Checkout.module.css';
import { customerApi, CustomerLookupResponse } from '@/lib/api/customer';

interface CustomerLookupModalProps {
  onSelect: (customer: CustomerLookupResponse) => void;
  onClose: () => void;
}

export default function CustomerLookupModal({ onSelect, onClose }: CustomerLookupModalProps) {
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleLookup = async () => {
    if (!phone) return;
    setIsSearching(true);
    setError('');
    try {
      const customer = await customerApi.lookupByPhone(phone);
      onSelect(customer);
      onClose();
    } catch (err: any) {
      setError("Không tìm thấy khách hàng. Bạn có muốn tạo mới?");
      setIsSearching(false);
    }
  };

  const handleCreate = async () => {
    if (!phone || !fullName) {
      setError("Vui lòng nhập đầy đủ tên và số điện thoại.");
      return;
    }
    setIsCreating(true);
    setError('');
    try {
      const customer = await customerApi.createCustomer({ fullName, phone });
      onSelect(customer);
      onClose();
    } catch (err: any) {
      setError(err.message || "Không thể tạo khách hàng.");
      setIsCreating(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <h2 className={styles.modalTitle}>Tra cứu khách hàng</h2>
        
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Số điện thoại</label>
          <div className={styles.discountInputWrapper}>
            <input 
              className={styles.input} 
              type="text" 
              placeholder="09xx..." 
              value={phone}
              onChange={e => setPhone(e.target.value)}
            />
            <button className={styles.applyBtn} onClick={handleLookup} disabled={isSearching}>
              {isSearching ? '...' : 'Tìm'}
            </button>
          </div>
          {error && <p className={styles.errorMsg}>{error}</p>}
        </div>

        {error.includes("tạo mới") && (
          <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #f1f5f9' }}>
            <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem' }}>Thêm khách hàng mới</h3>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Họ và tên</label>
              <input 
                className={styles.input} 
                type="text" 
                placeholder="Nhập tên khách hàng" 
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>
            <button 
              className={styles.checkoutBtn} 
              onClick={handleCreate} 
              disabled={isCreating}
              style={{ background: '#3b82f6', boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.4)' }}
            >
              {isCreating ? 'Đang tạo...' : 'Tạo khách hàng mới'}
            </button>
          </div>
        )}

        <button 
          onClick={onClose} 
          style={{ 
            marginTop: '1.5rem', 
            width: '100%', 
            padding: '0.75rem', 
            background: 'none', 
            border: 'none', 
            color: '#64748b', 
            cursor: 'pointer' 
          }}
        >
          Đóng
        </button>
      </div>
    </div>
  );
}
