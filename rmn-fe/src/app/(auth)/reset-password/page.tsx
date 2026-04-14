"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { resetPasswordApi } from "../../../lib/api/auth";
import styles from "../login/page.module.css";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const email = searchParams.get("email") ?? "";
  const token = searchParams.get("token") ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error" | "";
    message: string;
  }>({
    type: "",
    message: "",
  });

  const isInvalidLink = !email || !token;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus({ type: "", message: "" });

    if (isInvalidLink) {
      setStatus({
        type: "error",
        message: "Liên kết đặt lại mật khẩu không hợp lệ.",
      });
      return;
    }

    if (!newPassword || !confirmPassword) {
      setStatus({
        type: "error",
        message: "Vui lòng nhập đầy đủ thông tin.",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setStatus({
        type: "error",
        message: "Mật khẩu xác nhận không khớp.",
      });
      return;
    }

    setLoading(true);

    try {
      const message = await resetPasswordApi({
        email,
        token,
        newPassword,
        confirmPassword,
      });

      setStatus({
        type: "success",
        message:
          typeof message === "string"
            ? message
            : "Đặt lại mật khẩu thành công.",
      });

      setNewPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (err: unknown) {
      const apiErr = err as { message?: string; errors?: string[] };
      setStatus({
        type: "error",
        message:
          apiErr.errors?.[0] ??
          apiErr.message ??
          "Không thể đặt lại mật khẩu",
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
          <h2 className={styles.leftTitle}>Tạo mật khẩu mới</h2>
          <p className={styles.leftSub}>
            Hãy nhập mật khẩu mới để hoàn tất quá trình khôi phục tài khoản và tiếp tục sử dụng hệ thống.
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
            <h1 className={styles.cardTitle}>Đặt lại mật khẩu</h1>
            <p className={styles.cardSub}>
              Nhập mật khẩu mới của bạn bên dưới để hoàn tất việc khôi phục tài khoản.
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

          {isInvalidLink && (
            <div className={styles.errorBanner}>
              Liên kết không hợp lệ hoặc đã thiếu thông tin cần thiết. Vui lòng gửi lại yêu cầu quên mật khẩu.
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
                value={email}
                readOnly
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="newPassword" className={styles.label}>
                Mật khẩu mới
              </label>
              <input
                id="newPassword"
                type="password"
                className={styles.input}
                placeholder="Nhập mật khẩu mới"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                autoComplete="new-password"
                disabled={isInvalidLink}
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="confirmPassword" className={styles.label}>
                Xác nhận mật khẩu
              </label>
              <input
                id="confirmPassword"
                type="password"
                className={styles.input}
                placeholder="Nhập lại mật khẩu mới"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                disabled={isInvalidLink}
              />
            </div>

            <button
              type="submit"
              disabled={loading || isInvalidLink}
              className={`btn btn-primary ${styles.submitBtn}`}
            >
              {loading ? <span className={styles.miniSpinner} /> : null}
              {loading ? "Đang xử lý..." : "Đặt lại mật khẩu"}
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}