"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { newRegisterApi } from "../../../lib/api/auth";
import { isValidVNPhone } from "../../../lib/validation";
import styles from "../login/page.module.css";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validation functions
  const validateEmail = (email: string): string | null => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return "Email không được để trống";
    if (!emailRegex.test(email)) return "Email không đúng định dạng";
    return null;
  };

  const validatePassword = (password: string): string | null => {
    if (!password) return "Mật khẩu không được để trống";
    if (password.length < 6) return "Mật khẩu phải có ít nhất 6 ký tự";
    return null;
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Validate all fields
    const nameError = !name.trim() ? "Họ và tên không được để trống" : null;
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    const confirmPasswordError =
      password !== confirmPassword ? "Mật khẩu nhập lại không khớp" : null;

    if (nameError || emailError || passwordError || confirmPasswordError) {
      setError(
        nameError || emailError || passwordError || confirmPasswordError,
      );
      return;
    }

    setLoading(true);
    try {
      await newRegisterApi({
        email,
        password,
        fullName: name,
      });

      // Chuyển hướng đến trang xác thực OTP bằng email
      router.push(`/verify-otp?email=${encodeURIComponent(email)}`);
    } catch (err: unknown) {
      const apiErr = err as { message?: string; errors?: string[] };
      setError(apiErr.errors?.[0] ?? apiErr.message ?? "Đăng ký thất bại");
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
          <h2 className={styles.leftTitle}>Gia nhập cùng chúng tôi!</h2>
          <p className={styles.leftSub}>
            Tạo tài khoản để đặt món yêu thích và nhận ưu đãi mỗi ngày.
          </p>
          <div className={styles.dishes}>
            <img
              src="https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&q=80"
              alt="Bò lúc lắc"
              className={styles.dishImg}
            />
            <img
              src="https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=300&q=80"
              alt="Chè"
              className={styles.dishImg}
            />
            <img
              src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&q=80"
              alt="Trà sữa"
              className={styles.dishImg}
            />
          </div>
        </div>
      </div>

      <div className={styles.right}>
        <div className={styles.card}>
          <div className={styles.cardHead}>
            <h1 className={styles.cardTitle}>Đăng ký</h1>
            <p className={styles.cardSub}>
              Tạo tài khoản miễn phí, đặt món ngon ngay hôm nay.
            </p>
          </div>

          {error && <div className={styles.errorBanner}>{error}</div>}

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.field}>
              <label htmlFor="name" className={styles.label}>
                Họ và tên *
              </label>
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
              <label htmlFor="reg-email" className={styles.label}>
                Email *
              </label>
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
              <label htmlFor="reg-password" className={styles.label}>
                Mật khẩu *
              </label>
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
              <small
                style={{
                  fontSize: "0.75rem",
                  color: "#64748b",
                  marginTop: "0.25rem",
                }}
              >
                Ít nhất 6 ký tự
              </small>
            </div>

            <div className={styles.field}>
              <label htmlFor="confirm-password" className={styles.label}>
                Nhập lại mật khẩu *
              </label>
              <input
                id="confirm-password"
                type="password"
                className={styles.input}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
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
            <Link href="/login" className={styles.switchAnchor}>
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
