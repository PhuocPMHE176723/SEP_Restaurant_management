"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "../login/page.module.css";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
    alert("Chức năng đăng ký đang phát triển!");
  }

  return (
    <div className={styles.page}>
      <div className={styles.left}>
        <Link href="/" className={styles.brandBack}>
          <span>Nhà Hàng <strong>Khói Quê</strong></span>
        </Link>
        <div className={styles.leftContent}>
          <h2 className={styles.leftTitle}>Gia nhập cùng chúng tôi!</h2>
          <p className={styles.leftSub}>Tạo tài khoản để đặt món yêu thích và nhận ưu đãi mỗi ngày.</p>
          <div className={styles.dishes}>
            <img src="https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&q=80" alt="Bò lúc lắc" className={styles.dishImg} />
            <img src="https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=300&q=80" alt="Chè" className={styles.dishImg} />
            <img src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&q=80" alt="Trà sữa" className={styles.dishImg} />
          </div>
        </div>
      </div>

      <div className={styles.right}>
        <div className={styles.card}>
          <div className={styles.cardHead}>
            <h1 className={styles.cardTitle}>Đăng ký</h1>
            <p className={styles.cardSub}>Tạo tài khoản miễn phí, đặt món ngon ngay hôm nay.</p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.field}>
              <label className={styles.label}>Họ và tên</label>
              <input
                id="name"
                type="text"
                className={styles.input}
                placeholder="Nguyễn Văn A"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Email</label>
              <input
                id="reg-email"
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
              <label className={styles.label}>Mật khẩu</label>
              <input
                id="reg-password"
                type="password"
                className={styles.input}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>

            <button
              id="register-submit"
              type="submit"
              disabled={loading}
              className={`btn btn-primary ${styles.submitBtn}`}
            >
              {loading ? <span className={styles.miniSpinner} /> : null}
              {loading ? "Đang xử lý..." : "Tạo tài khoản"}
            </button>
          </form>

          <p className={styles.switchLink}>
            Đã có tài khoản?{" "}
            <Link href="/login" className={styles.switchAnchor}>Đăng nhập</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
