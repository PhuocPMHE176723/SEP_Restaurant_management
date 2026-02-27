"use client";

import Link from "next/link";
import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.brand}>
          <div className={styles.logo}>
            <span>Nhà Hàng <strong>Khói Quê</strong></span>
          </div>
          <p className={styles.tagline}>
            Bữa ngon mỗi ngày – tươi sạch từ bếp đến bàn
          </p>
          <div className={styles.socials}>
            <a href="#" className={styles.social} aria-label="Facebook">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>
              </svg>
            </a>
            <a href="#" className={styles.social} aria-label="Instagram">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                <circle cx="12" cy="12" r="3"/>
                <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none"/>
              </svg>
            </a>
          </div>
        </div>

        <div className={styles.linkGroup}>
          <h4 className={styles.groupTitle}>Khám phá</h4>
          <Link href="/menu" className={styles.link}>Thực đơn</Link>
          <Link href="/menu?category=com" className={styles.link}>Cơm phần</Link>
          <Link href="/menu?category=pho" className={styles.link}>Phở & Bún</Link>
          <Link href="/menu?category=do-uong" className={styles.link}>Đồ uống</Link>
        </div>

        <div className={styles.linkGroup}>
          <h4 className={styles.groupTitle}>Hỗ trợ</h4>
          <Link href="/about" className={styles.link}>Giới thiệu</Link>
          <Link href="/contact" className={styles.link}>Liên hệ</Link>
          <Link href="/faq" className={styles.link}>Câu hỏi thường gặp</Link>
        </div>

        <div className={styles.contact}>
          <h4 className={styles.groupTitle}>Liên hệ</h4>
          <p className={styles.contactItem}>123 Đường Lê Lợi, Quận 1, TP.HCM</p>
          <p className={styles.contactItem}>0900 123 456</p>
          <p className={styles.contactItem}>06:00 – 21:00, Thứ 2 – Chủ nhật</p>
        </div>
      </div>

      <div className={styles.bottom}>
        <div className="container">
          <p>© 2025 Nhà Hàng Khói Quê. Bản quyền thuộc về nhóm phát triển.</p>
        </div>
      </div>
    </footer>
  );
}
