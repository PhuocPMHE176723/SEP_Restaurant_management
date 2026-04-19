"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { resendOtpApi, verifyOtpApi } from "../../../lib/api/auth";
import OtpInput from "../OtpInput";
import styles from "../login/page.module.css";

function VerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(60);

  const otpValue = useMemo(() => otp.join(""), [otp]);

  useEffect(() => {
    if (!email) {
      router.replace("/register");
      return;
    }
  }, [email, router]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email) {
      setError("Không tìm thấy email xác thực");
      return;
    }

    if (otpValue.length !== 6) {
      setError("Vui lòng nhập đủ 6 số OTP");
      return;
    }

    setLoading(true);
    try {
      await verifyOtpApi({
        email,
        otp: otpValue,
      });

      setSuccess(true);
    } catch (err: unknown) {
      const apiErr = err as { message?: string; errors?: string[] };
      setError(apiErr.errors?.[0] ?? apiErr.message ?? "Xác thực OTP thất bại");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!email || countdown > 0) return;

    setError(null);
    setResending(true);

    try {
      await resendOtpApi({ email });
      setCountdown(60);
      setOtp(["", "", "", "", "", ""]);
    } catch (err: unknown) {
      const apiErr = err as { message?: string; errors?: string[] };
      setError(apiErr.errors?.[0] ?? apiErr.message ?? "Gửi lại OTP thất bại");
    } finally {
      setResending(false);
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
          <h2 className={styles.leftTitle}>
            {success ? "Xác thực thành công!" : "Kiểm tra hộp thư của bạn"}
          </h2>
          <p className={styles.leftSub}>
            {success
              ? "Tài khoản của bạn đã được xác thực. Bây giờ bạn có thể đăng nhập và bắt đầu sử dụng hệ thống."
              : "Chúng tôi đã gửi mã OTP 6 chữ số đến email của bạn. Hãy nhập mã để hoàn tất đăng ký tài khoản."}
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
          {!success ? (
            <>
              <div className={styles.cardHead}>
                <h1 className={styles.cardTitle}>Xác thực OTP</h1>
                <p className={styles.cardSub}>
                  Mã OTP đã được gửi đến <strong>{email}</strong>
                </p>
              </div>

              {error && <div className={styles.errorBanner}>{error}</div>}

              <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.field}>
                  <label className={styles.label}>Nhập mã OTP *</label>

                  <div style={{ width: "100%", display: "block" }}>
                    <OtpInput value={otp} onChange={setOtp} />
                </div>

                  <small
                    style={{
                      fontSize: "0.75rem",
                      color: "#64748b",
                      marginTop: "0.5rem",
                      display: "block",
                    }}
                  >
                    Mã OTP gồm 6 chữ số và có hiệu lực trong 5 phút
                  </small>
                </div>

                <button
                  type="submit"
                  disabled={loading || otpValue.length !== 6}
                  className={`btn btn-primary ${styles.submitBtn}`}
                >
                  {loading ? <span className={styles.miniSpinner} /> : null}
                  {loading ? "Đang xác thực..." : "Xác nhận mã OTP"}
                </button>
              </form>

              <p
                className={styles.switchLink}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                }}
              >
                <span>Bạn chưa nhận được mã?</span>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={countdown > 0 || resending}
                  className={styles.switchAnchor}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: countdown > 0 ? "not-allowed" : "pointer",
                    opacity: countdown > 0 ? 0.6 : 1,
                  }}
                >
                  {resending
                    ? "Đang gửi lại..."
                    : countdown > 0
                    ? `Gửi lại mã (${countdown}s)`
                    : "Gửi lại mã"}
                </button>
              </p>
            </>
          ) : (
            <>
              <div className={styles.cardHead}>
                <h1 className={styles.cardTitle}>Thành công!</h1>
                <p className={styles.cardSub}>
                  Email của bạn đã được xác thực thành công.
                </p>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  margin: "1rem 0 2rem",
                }}
              >
                <div
                  style={{
                    width: "88px",
                    height: "88px",
                    borderRadius: "999px",
                    background: "#ebf1ff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#ff7a21",
                    fontSize: "2rem",
                    fontWeight: 700,
                  }}
                >
                  ✓
                </div>
              </div>

              <button
                type="button"
                onClick={() => router.push("/login")}
                className={`btn btn-primary ${styles.submitBtn}`}
              >
                Đi đến đăng nhập
              </button>

              <p className={styles.switchLink}>
                Hoặc{" "}
                <Link href="/" className={styles.switchAnchor}>
                  quay về trang chủ
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<div style={{ padding: '5rem', textAlign: 'center' }}>Đang tải...</div>}>
      <VerifyOtpContent />
    </Suspense>
  );
}