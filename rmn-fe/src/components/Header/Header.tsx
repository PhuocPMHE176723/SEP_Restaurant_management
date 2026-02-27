"use client";

import Link from "next/link";
import styles from "./Header.module.css";

export default function Header() {
  return (
    <header className={styles.header}>
      <div className={`container ${styles.inner}`}>
        {/* Logo */}
        <Link href="/" className={styles.logo}>
          <span className={styles.logoText}>
            Nhà Hàng <strong>Khói Quê</strong>
          </span>
        </Link>

        {/* Nav */}
        <nav className={styles.nav}>
          <Link href="/" className={styles.navLink}>Trang chủ</Link>
          <Link href="/menu" className={styles.navLink}>Thực đơn</Link>
          <Link href="/about" className={styles.navLink}>Giới thiệu</Link>
        </nav>

        {/* Actions */}
        <div className={styles.actions}>
          <Link href="/login" className={`btn btn-ghost ${styles.authBtn}`}>Đăng nhập</Link>
          <Link href="/register" className={`btn btn-ghost ${styles.authBtn}`}>Đăng ký</Link>
          <Link href="/booking" className={`btn btn-primary ${styles.bookingBtn}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            Đặt bàn
          </Link>
        </div>
      </div>
    </header>
  );
}
