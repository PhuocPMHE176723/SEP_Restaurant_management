"use client";

import type { Booking } from "../../types/generated";
import styles from "./BookingSuccess.module.css";
import Link from "next/link";

interface Props {
  booking: Booking;
}

const DAYS = ["Chủ nhật", "Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy"];

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return `${DAYS[d.getDay()]}, ${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getFullYear()}`;
}

export default function BookingSuccess({ booking }: Props) {
  return (
    <div className={styles.wrap}>
      <div className={styles.iconWrap}>
        <div className={styles.circle}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
      </div>

      <h2 className={styles.title}>Đặt bàn thành công! 🎉</h2>
      <p className={styles.subtitle}>
        Cảm ơn bạn đã đặt bàn tại <strong>Nhà Hàng G26</strong>. Chúng tôi sẽ liên hệ xác nhận qua điện thoại.
      </p>

      {/* Booking ID */}
      <div className={styles.bookingId}>
        <span className={styles.idLabel}>Mã đặt bàn</span>
        <span className={styles.idValue}>{booking.id}</span>
      </div>

      {/* Details */}
      <div className={styles.details}>
        <div className={styles.detailRow}>
          <div className={styles.detailIcon}>👤</div>
          <div><p className={styles.detailLabel}>Khách hàng</p><p className={styles.detailValue}>{booking.guestName}</p></div>
        </div>
        <div className={styles.detailRow}>
          <div className={styles.detailIcon}>📞</div>
          <div><p className={styles.detailLabel}>Điện thoại</p><p className={styles.detailValue}>{booking.phone}</p></div>
        </div>
        <div className={styles.detailRow}>
          <div className={styles.detailIcon}>📅</div>
          <div><p className={styles.detailLabel}>Ngày</p><p className={styles.detailValue}>{formatDate(booking.date)}</p></div>
        </div>
        <div className={styles.detailRow}>
          <div className={styles.detailIcon}>🕖</div>
          <div><p className={styles.detailLabel}>Giờ</p><p className={styles.detailValue}>{booking.timeSlot}</p></div>
        </div>
        <div className={styles.detailRow}>
          <div className={styles.detailIcon}>👥</div>
          <div><p className={styles.detailLabel}>Số khách</p><p className={styles.detailValue}>{booking.partySize} người</p></div>
        </div>
        {booking.specialRequests && (
          <div className={styles.detailRow}>
            <div className={styles.detailIcon}>📝</div>
            <div><p className={styles.detailLabel}>Ghi chú</p><p className={styles.detailValue}>{booking.specialRequests}</p></div>
          </div>
        )}
      </div>

      <div className={styles.notice}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        Vui lòng đến trước <strong>15 phút</strong>. Bàn sẽ được giữ tối đa <strong>15 phút</strong> sau giờ đặt.
      </div>

      <div className={styles.actions}>
        <Link href="/" className={`btn btn-primary ${styles.homeBtn}`}>Về trang chủ</Link>
        <Link href="/menu" className={`btn btn-outline`}>Xem thực đơn</Link>
      </div>
    </div>
  );
}
