"use client";

import styles from "../../app/profile/staff/newprofile.module.css";

type PasswordForm = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

type StatusState = {
  type: "success" | "error" | "";
  message: string;
};

type PasswordSecuritySectionProps = {
  passwordForm: PasswordForm;
  setPasswordForm: React.Dispatch<React.SetStateAction<PasswordForm>>;
  savingPassword: boolean;
  onSubmit: (e: React.FormEvent) => void;

  isForgotPassword: boolean;
  setIsForgotPassword: React.Dispatch<React.SetStateAction<boolean>>;
  forgotEmail: string;
  setForgotEmail: React.Dispatch<React.SetStateAction<string>>;
  onForgotPasswordSubmit: (e: React.FormEvent) => void;

  status: StatusState;
};

export default function PasswordSecuritySection({
  passwordForm,
  setPasswordForm,
  savingPassword,
  onSubmit,
  isForgotPassword,
  setIsForgotPassword,
  forgotEmail,
  setForgotEmail,
  onForgotPasswordSubmit,
  status,
}: PasswordSecuritySectionProps) {
  return (
    <>
      <div className={styles.card}>
        <div className={styles.securityWrapper}>
          <div className={styles.securityHeader}>
            <div className={styles.securityIcon}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={styles.securityIconSvg}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>

            <h3 className={styles.securityTitle}>Đổi mật khẩu</h3>
            <p className={styles.securityDesc}>
              Sử dụng mật khẩu mạnh để bảo vệ tài khoản
            </p>
          </div>

          {status.message && (
            <div
              className={
                status.type === "success" ? styles.successBox : styles.errorBox
              }
            >
              {status.message}
            </div>
          )}

          <form className={styles.securityForm} onSubmit={onSubmit}>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Mật khẩu hiện tại</label>
              <input
                type="password"
                className={styles.underlineInput}
                value={passwordForm.currentPassword}
                onChange={(e) =>
                  setPasswordForm((prev) => ({
                    ...prev,
                    currentPassword: e.target.value,
                  }))
                }
              />
            </div>

            <div className={styles.field}>
              <label className={styles.fieldLabel}>Mật khẩu mới</label>
              <input
                type="password"
                className={styles.underlineInput}
                value={passwordForm.newPassword}
                onChange={(e) =>
                  setPasswordForm((prev) => ({
                    ...prev,
                    newPassword: e.target.value,
                  }))
                }
              />
            </div>

            <div className={styles.field}>
              <label className={styles.fieldLabel}>Xác nhận mật khẩu</label>
              <input
                type="password"
                className={styles.underlineInput}
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm((prev) => ({
                    ...prev,
                    confirmPassword: e.target.value,
                  }))
                }
              />
            </div>

            <div className={styles.centerActions}>
              <button
                className={styles.primaryBlueButton}
                type="submit"
                disabled={savingPassword}
              >
                {savingPassword ? "Đang xử lý..." : "Cập nhật mật khẩu"}
              </button>

              <button
                type="button"
                className={styles.textButton}
                onClick={() => setIsForgotPassword(true)}
              >
                Quên mật khẩu hiện tại?
              </button>
            </div>
          </form>
        </div>
      </div>

      {isForgotPassword && (
        <div className={styles.modalOverlay} onClick={() => setIsForgotPassword(false)}>
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className={styles.modalClose}
              onClick={() => setIsForgotPassword(false)}
              aria-label="Đóng"
            >
              ×
            </button>

            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Khôi phục mật khẩu</h3>
              <p className={styles.modalDesc}>
                Chúng tôi sẽ gửi liên kết khôi phục đến email của bạn để thiết lập lại mật khẩu.
              </p>
            </div>

            <form className={styles.securityForm} onSubmit={onForgotPasswordSubmit}>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Email đăng ký</label>
                <input
                  type="email"
                  className={styles.underlineInput}
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className={styles.primaryOrangeButton}>
                Gửi liên kết khôi phục
              </button>

              <button
                type="button"
                className={styles.modalBackButton}
                onClick={() => setIsForgotPassword(false)}
              >
                Quay lại trang bảo mật
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}