"use client";

import { useState } from "react";
import Link from "next/link";
import { forgotPasswordApi } from "../../../lib/api/auth";
import styles from "../login/page.module.css";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error" | "";
    message: string;
  }>({
    type: "",
    message: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus({ type: "", message: "" });
    setLoading(true);

    try {
      const message = await forgotPasswordApi({ email });

      setStatus({
        type: "success",
        message:
          typeof message === "string"
            ? message
            : "Yêu cầu khôi phục mật khẩu đã được gửi.",
      });
    } catch (err: unknown) {
      const apiErr = err as { message?: string; errors?: string[] };
      setStatus({
        type: "error",
        message:
          apiErr.errors?.[0] ??
          apiErr.message ??
          "Không gửi được yêu cầu khôi phục mật khẩu",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.left}>
        <Link href="/" className={styles.brandBack}>
          <span>
            Nhà Hàng <strong>Khói Quê</strong>
          </span>
        </Link>

        <div className={styles.leftContent}>
          <h2 className={styles.leftTitle}>Khôi phục tài khoản</h2>
          <p className={styles.leftSub}>
            Nhập email để nhận hướng dẫn lấy lại mật khẩu và tiếp tục đặt món nhanh chóng.
          </p>

          <div className={styles.dishes}>
            <img
              src="https://images.unsplash.com/photo-1512058564366-18510be2db19?w=300&q=80"
              alt="Cơm gà"
              className={styles.dishImg}
            />
            <img
              src="https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=300&q=80"
              alt="Phở bò"
              className={styles.dishImg}
            />
            <img
              src="https://images.unsplash.com/photo-1509722747041-616f39b57569?w=300&q=80"
              alt="Bánh mì"
              className={styles.dishImg}
            />
          </div>
        </div>
      </div>

      <div className={styles.right}>
        <div className={styles.card}>
          <div className={styles.cardHead}>
            <h1 className={styles.cardTitle}>Quên mật khẩu</h1>
            <p className={styles.cardSub}>
              Đừng lo lắng! Hãy nhập email của bạn bên dưới để nhận hướng dẫn khôi phục mật khẩu.
            </p>
          </div>

          {status.message && (
            <div
              className={
                status.type === "success"
                  ? styles.successBanner
                  : styles.errorBanner
              }
            >
              {status.message}
            </div>
          )}

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.field}>
              <label htmlFor="email" className={styles.label}>
                Email
              </label>
              <input
                id="email"
                type="email"
                className={styles.input}
                placeholder="Nhập email của bạn"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`btn btn-primary ${styles.submitBtn}`}
            >
              {loading ? <span className={styles.miniSpinner} /> : null}
              {loading ? "Đang gửi..." : "Gửi yêu cầu"}
            </button>
          </form>

          <p className={styles.switchLink}>
            Nhớ ra mật khẩu?{" "}
            <Link href="/login" className={styles.switchAnchor}>
              Quay lại Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}