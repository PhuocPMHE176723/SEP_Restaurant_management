"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { registerApi } from "../../../lib/api/auth";
import styles from "../login/page.module.css";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validation functions
  const validateEmail = (email: string): string | null => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return "Email không được để trống";
    if (!emailRegex.test(email)) return "Email không đúng định dạng";
    return null;
  };

  const validatePhone = (phone: string): string | null => {
    const phoneRegex = /^\d{10}$/;
    if (!phone) return "Số điện thoại không được để trống";
    if (!phoneRegex.test(phone)) return "Số điện thoại phải là 10 chữ số";
    return null;
  };

  const validatePassword = (password: string): string | null => {
    if (!password) return "Mật khẩu không được để trống";
    if (password.length < 8) return "Mật khẩu phải có ít nhất 8 ký tự";
    if (!/[a-z]/.test(password)) return "Mật khẩu phải có ít nhất 1 chữ thường";
    if (!/[A-Z]/.test(password)) return "Mật khẩu phải có ít nhất 1 chữ hoa";
    if (!/\d/.test(password)) return "Mật khẩu phải có ít nhất 1 chữ số";
    if (!/[@$!%*?&#]/.test(password)) return "Mật khẩu phải có ít nhất 1 ký tự đặc biệt (@$!%*?&#)";
    return null;
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Validate all fields
    const nameError = !name.trim() ? "Họ và tên không được để trống" : null;
    const emailError = validateEmail(email);
    const phoneError = validatePhone(phone);
    const passwordError = validatePassword(password);

    if (nameError || emailError || phoneError || passwordError) {
      setError(nameError || emailError || phoneError || passwordError);
      return;
    }

    setLoading(true);
    try {
      await registerApi({
        email,
        password,
        fullName: name,
        phone,
      });

      // Chuyển hướng trực tiếp đến trang login
      router.push("/login");
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

          {error && <div className={styles.errorBanner}>{error}</div>}

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.field}>
              <label htmlFor="name" className={styles.label}>Họ và tên *</label>
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
              <label htmlFor="reg-email" className={styles.label}>Email *</label>
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
              <label htmlFor="reg-phone" className={styles.label}>Số điện thoại *</label>
              <input
                id="reg-phone"
                type="tel"
                className={styles.input}
                placeholder="0912345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                pattern="\d{10}"
                maxLength={10}
              />
              <small style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.25rem" }}>
                Số điện thoại phải là 10 chữ số
              </small>
            </div>

            <div className={styles.field}>
              <label htmlFor="reg-password" className={styles.label}>Mật khẩu *</label>
              <input
                id="reg-password"
                type="password"
                className={styles.input}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
              <small style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.25rem" }}>
                Ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt
              </small>
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
