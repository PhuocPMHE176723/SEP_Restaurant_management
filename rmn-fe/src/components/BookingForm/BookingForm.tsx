"use client";

import { useState } from "react";
import { createBooking, TIME_SLOTS } from "../../lib/api/client";
import type { Booking } from "../../types/generated";
import styles from "./BookingForm.module.css";

interface Props {
  onSuccess: (booking: Booking) => void;
}

export default function BookingForm({ onSuccess }: Props) {
  const today = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    guestName: "",
    phone: "",
    email: "",
    date: "",
    timeSlot: "",
    partySize: 2,
    specialRequests: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<typeof form>>({});

  function set(field: keyof typeof form, value: string | number) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: "" }));
  }

  function validate() {
    const e: Partial<typeof form> = {};
    if (!form.guestName.trim()) e.guestName = "Vui lòng nhập họ tên";
    if (!/^[0-9]{9,11}$/.test(form.phone.replace(/\s/g, "")))
      e.phone = "Số điện thoại không hợp lệ";
    if (form.email && !/\S+@\S+\.\S+/.test(form.email))
      e.email = "Email không hợp lệ";
    if (!form.date) e.date = "Vui lòng chọn ngày";
    if (!form.timeSlot) e.timeSlot = "Vui lòng chọn giờ";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const result = await createBooking({
        ...form,
        partySize: Number(form.partySize),
      });
      onSuccess(result);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form} noValidate>
      {/* Guest info */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>
          <span className={styles.step}>1</span>Thông tin khách
        </h3>
        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label}>Họ và tên *</label>
            <input
              id="guestName"
              type="text"
              className={`${styles.input} ${errors.guestName ? styles.inputError : ""}`}
              placeholder="Nguyễn Văn A"
              value={form.guestName}
              onChange={(e) => set("guestName", e.target.value)}
              required
            />
            {errors.guestName && <p className={styles.error}>{errors.guestName}</p>}
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Số điện thoại *</label>
            <input
              id="phone"
              type="tel"
              className={`${styles.input} ${errors.phone ? styles.inputError : ""}`}
              placeholder="0912 345 678"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              required
            />
            {errors.phone && <p className={styles.error}>{errors.phone}</p>}
          </div>
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Email (tuỳ chọn)</label>
          <input
            id="email"
            type="email"
            className={`${styles.input} ${errors.email ? styles.inputError : ""}`}
            placeholder="email@example.com"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
          />
          {errors.email && <p className={styles.error}>{errors.email}</p>}
        </div>
      </div>

      {/* Reservation details */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>
          <span className={styles.step}>2</span>Chi tiết đặt bàn
        </h3>
        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label}>Ngày đến *</label>
            <input
              id="date"
              type="date"
              className={`${styles.input} ${errors.date ? styles.inputError : ""}`}
              min={today}
              value={form.date}
              onChange={(e) => set("date", e.target.value)}
              required
            />
            {errors.date && <p className={styles.error}>{errors.date}</p>}
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Giờ đến *</label>
            <select
              id="timeSlot"
              className={`${styles.input} ${styles.select} ${errors.timeSlot ? styles.inputError : ""}`}
              value={form.timeSlot}
              onChange={(e) => set("timeSlot", e.target.value)}
              required
            >
              <option value="">-- Chọn giờ --</option>
              <optgroup label="Buổi trưa (11:00 – 13:00)">
                {TIME_SLOTS.filter(t => t < "14:00").map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </optgroup>
              <optgroup label="Buổi tối (17:00 – 21:00)">
                {TIME_SLOTS.filter(t => t >= "17:00").map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </optgroup>
            </select>
            {errors.timeSlot && <p className={styles.error}>{errors.timeSlot}</p>}
          </div>
        </div>

        {/* Party size */}
        <div className={styles.field}>
          <label className={styles.label}>Số khách: <strong>{form.partySize} người</strong></label>
          <div className={styles.partySizeRow}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 15, 20].map((n) => (
              <button
                key={n}
                type="button"
                className={`${styles.sizeBtn} ${form.partySize === n ? styles.sizeBtnActive : ""}`}
                onClick={() => set("partySize", n)}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Special requests */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>
          <span className={styles.step}>3</span>Yêu cầu đặc biệt
        </h3>
        <div className={styles.field}>
          <label className={styles.label}>Ghi chú cho nhà hàng</label>
          <textarea
            id="specialRequests"
            className={`${styles.input} ${styles.textarea}`}
            placeholder="Ví dụ: bàn gần cửa sổ, dị ứng hải sản, tổ chức sinh nhật..."
            value={form.specialRequests}
            onChange={(e) => set("specialRequests", e.target.value)}
            rows={3}
          />
        </div>
      </div>

      {/* Submit */}
      <button
        id="booking-submit"
        type="submit"
        disabled={loading}
        className={`btn btn-primary ${styles.submitBtn}`}
      >
        {loading ? (
          <>
            <span className={styles.spinner} />
            Đang xử lý...
          </>
        ) : (
          <>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            Xác nhận đặt bàn
          </>
        )}
      </button>
    </form>
  );
}
