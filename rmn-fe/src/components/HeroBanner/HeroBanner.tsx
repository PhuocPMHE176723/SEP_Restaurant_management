"use client";

import Link from "next/link";
import styles from "./HeroBanner.module.css";

export default function HeroBanner() {
  return (
    <section className={styles.hero}>
      <div className={styles.bg}>
        {/* Decorative blobs */}
        <div className={`${styles.blob} ${styles.blob1}`} />
        <div className={`${styles.blob} ${styles.blob2}`} />
        <div className={`${styles.blob} ${styles.blob3}`} />
      </div>

      <div className={`container ${styles.content}`}>
        <div className={styles.text}>
          <span className={styles.eyebrow}>🍽️ Nhà Hàng Khói Quê — Ngon mỗi ngày</span>
          <h1 className={styles.headline}>
            Bữa ăn ngon,<br />
            <span className={styles.highlight}>tươi sạch</span> mỗi ngày
          </h1>
          <p className={styles.subhead}>
            Thực đơn đa dạng từ cơm, phở đến bánh mì và đồ uống.
            Đặt ngay để nhận ưu đãi hôm nay!
          </p>
          <div className={styles.actions}>
            <Link href="/menu" className={`btn btn-primary ${styles.ctaPrimary}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
              </svg>
              Xem thực đơn
            </Link>
            <Link href="/about" className={`btn btn-outline ${styles.ctaSecondary}`}>
              Tìm hiểu thêm
            </Link>
          </div>

          {/* Stats row */}
          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={styles.statNum}>50+</span>
              <span className={styles.statLabel}>Món ăn</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.stat}>
              <span className={styles.statNum}>4.9★</span>
              <span className={styles.statLabel}>Đánh giá</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.stat}>
              <span className={styles.statNum}>10k+</span>
              <span className={styles.statLabel}>Bữa phục vụ</span>
            </div>
          </div>
        </div>

        {/* Right visual */}
        <div className={styles.visual}>
          <div className={styles.dishGrid}>
            <img
              src="https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&q=80"
              alt="Cơm gà"
              className={`${styles.dish} ${styles.dish1}`}
            />
            <img
              src="https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=400&q=80"
              alt="Phở bò"
              className={`${styles.dish} ${styles.dish2}`}
            />
            <img
              src="https://images.unsplash.com/photo-1509722747041-616f39b57569?w=400&q=80"
              alt="Bánh mì"
              className={`${styles.dish} ${styles.dish3}`}
            />
            <img
              src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80"
              alt="Trà sữa"
              className={`${styles.dish} ${styles.dish4}`}
            />
          </div>
          {/* Floating label */}
          <div className={styles.floatingCard}>
            <span className={styles.fcIcon}>⚡</span>
            <div>
              <p className={styles.fcTitle}>Phục vụ nhanh</p>
              <p className={styles.fcSub}>Chỉ 5–15 phút</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
