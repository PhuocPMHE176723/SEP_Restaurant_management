"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
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
  status: StatusState;
};

export default function PasswordSecuritySection({
  passwordForm,
  setPasswordForm,
  savingPassword,
  onSubmit,
  status,
}: PasswordSecuritySectionProps) {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  return (
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
            <div style={{ position: "relative" }}>
              <input
                type={showCurrent ? "text" : "password"}
                className={styles.underlineInput}
                value={passwordForm.currentPassword}
                onChange={(e) =>
                  setPasswordForm((prev) => ({
                    ...prev,
                    currentPassword: e.target.value,
                  }))
                }
                style={{ paddingRight: "40px" }}
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#9ca3af",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "4px"
                }}
              >
                {showCurrent ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel}>Mật khẩu mới</label>
            <div style={{ position: "relative" }}>
              <input
                type={showNew ? "text" : "password"}
                className={styles.underlineInput}
                value={passwordForm.newPassword}
                onChange={(e) =>
                  setPasswordForm((prev) => ({
                    ...prev,
                    newPassword: e.target.value,
                  }))
                }
                style={{ paddingRight: "40px" }}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#9ca3af",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "4px"
                }}
              >
                {showNew ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel}>Xác nhận mật khẩu</label>
            <div style={{ position: "relative" }}>
              <input
                type={showConfirm ? "text" : "password"}
                className={styles.underlineInput}
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm((prev) => ({
                    ...prev,
                    confirmPassword: e.target.value,
                  }))
                }
                style={{ paddingRight: "40px" }}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#9ca3af",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "4px"
                }}
              >
                {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className={styles.centerActions}>
            <button
              className={styles.primaryBlueButton}
              type="submit"
              disabled={savingPassword}
            >
              {savingPassword ? "Đang xử lý..." : "Cập nhật mật khẩu"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}