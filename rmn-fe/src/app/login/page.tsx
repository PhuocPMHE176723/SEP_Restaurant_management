"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
    alert("Chức năng đăng nhập đang phát triển!");
  }

  return (
    <div className={styles.page}>
      <div className={styles.left}>
        <Link href="/" className={styles.brandBack}>
         
          <span>Nhà Hàng <strong>Khói Quê</strong></span>
        </Link>
        <div className={styles.leftContent}>
          <h2 className={styles.leftTitle}>Bữa ngon mỗi ngày</h2>
          <p className={styles.leftSub}>Đặt hàng nhanh chóng, tươi sạch, đúng vị.</p>
          <div className={styles.dishes}>
            <img src="https://images.unsplash.com/photo-1512058564366-18510be2db19?w=300&q=80" alt="Cơm gà" className={styles.dishImg} />
            <img src="https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=300&q=80" alt="Phở bò" className={styles.dishImg} />
            <img src="https://images.unsplash.com/photo-1509722747041-616f39b57569?w=300&q=80" alt="Bánh mì" className={styles.dishImg} />
          </div>
        </div>
      </div>

      <div className={styles.right}>
        <div className={styles.card}>
          <div className={styles.cardHead}>
            <h1 className={styles.cardTitle}>Đăng nhập</h1>
            <p className={styles.cardSub}>Chào mừng trở lại! Hãy đăng nhập để tiếp tục.</p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.field}>
              <label className={styles.label}>Email</label>
              <input
                id="email"
                type="email"
                className={styles.input}
                placeholder="ban@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className={styles.field}>
              <div className={styles.labelRow}>
                <label className={styles.label}>Mật khẩu</label>
                <Link href="/forgot-password" className={styles.forgotLink}>Quên mật khẩu?</Link>
              </div>
              <input
                id="password"
                type="password"
                className={styles.input}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className={`btn btn-primary ${styles.submitBtn}`}
            >
              {loading ? <span className={styles.miniSpinner} /> : null}
              {loading ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>
          </form>

          <p className={styles.switchLink}>
            Chưa có tài khoản?{" "}
            <Link href="/register" className={styles.switchAnchor}>Đăng ký ngay</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
