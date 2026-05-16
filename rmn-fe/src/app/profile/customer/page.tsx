"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../contexts/AuthContext";
import { profileApi } from "../../../lib/api/profile";
import { forgotPasswordApi } from "../../../lib/api/auth";
import type { CustomerProfileDTO } from "../../../types/models/profile";
import { auth } from "@/lib/firebase";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
} from "firebase/auth";
import { verifyOtpApi } from "@/lib/api/auth";
import { isValidVNPhone } from "@/lib/validation";
import Swal from "sweetalert2";
import Header from "@/components/Header/Header";
import PasswordSecuritySection from "../PasswordSecuritySection";
import styles from "../staff/newprofile.module.css";

type TabKey = "profile" | "security";

type CustomerProfileWithUsername = CustomerProfileDTO & {
  username?: string;
  isPhoneVerified?: boolean;
};

type StatusState = {
  type: "success" | "error" | "";
  message: string;
};

export default function CustomerProfilePage() {
  const router = useRouter();
  const { user, isLoggedIn } = useAuth();

  const [activeTab, setActiveTab] = useState<TabKey>("profile");
  const [profile, setProfile] = useState<CustomerProfileWithUsername | null>(
    null,
  );
  const [showOtpVerification, setShowOtpVerification] = useState(false);
  const [pendingPhoneNumber, setPendingPhoneNumber] = useState("");
  const [recaptchaVerifier, setRecaptchaVerifier] =
    useState<RecaptchaVerifier | null>(null);
  const [confirmationResult, setConfirmationResult] =
    useState<ConfirmationResult | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [profileStatus, setProfileStatus] = useState<StatusState>({
    type: "",
    message: "",
  });

  const [securityStatus, setSecurityStatus] = useState<StatusState>({
    type: "",
    message: "",
  });

  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    email: "",
    phone: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        setProfileStatus({ type: "", message: "" });

        const data = await profileApi.getMyCustomerProfile();

        setProfile({
          ...data,
          username: data.username ?? "",
        });
        setFormData({
          fullName: data.fullName || "",
          username: data.username || "",
          email: data.email || "",
          phone: data.phone || "",
        });
      } catch (err: any) {
        setProfile(null);
        setProfileStatus({
          type: "error",
          message: err?.message || "Không tải được hồ sơ khách hàng",
        });
      } finally {
        setLoading(false);
      }
    };

    if (isLoggedIn && user) {
      loadProfile();
    }
  }, [isLoggedIn, user]);

  const getInitial = (name?: string | null) => {
    return name?.trim()?.charAt(0)?.toUpperCase() || "C";
  };

  const resetForm = () => {
    if (!profile) return;

    setFormData({
      fullName: profile.fullName || "",
      username: profile.username || "",
      email: profile.email || "",
      phone: profile.phone || "",
    });

    setIsEditing(false);
    setProfileStatus({ type: "", message: "" });
  };

  const handleRequestPhoneVerification = async () => {
    if (!profile) return;

    const phoneToVerify = formData.phone || profile.phone || "";
    if (!phoneToVerify || !isValidVNPhone(phoneToVerify)) {
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: "Số điện thoại không hợp lệ.",
        confirmButtonText: "Đóng",
      });
      return;
    }

    setPendingPhoneNumber(phoneToVerify);
    setShowOtpVerification(true);

    Swal.fire({
      icon: "info",
      title: "Xác minh số điện thoại",
      text: "Vui lòng xác minh số điện thoại bằng OTP",
      confirmButtonText: "OK",
    });

    try {
      if (recaptchaVerifier) recaptchaVerifier.clear();
      const verifier = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
        callback: () => {
          console.log("Recaptcha verified");
        },
      });
      setRecaptchaVerifier(verifier);

      const formattedPhone = phoneToVerify.startsWith("+")
        ? phoneToVerify
        : "+84" + phoneToVerify.slice(1);
      const result = await signInWithPhoneNumber(
        auth,
        formattedPhone,
        verifier,
      );
      setConfirmationResult(result);
    } catch (err) {
      console.error("Recaptcha error:", err);
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: "Không thể gửi mã OTP. Vui lòng thử lại!",
        confirmButtonText: "Đóng",
      });
      setShowOtpVerification(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    if (!isEditing) {
      setIsEditing(true);
      return;
    }

    try {
      setSavingProfile(true);

      const result = await profileApi.updateCustomerProfile(
        profile.customerId,
        {
          fullName: formData.fullName,
          username: formData.username,
          email: formData.email,
          phone: formData.phone,
        },
      );

      setIsEditing(false);

      // Check backend response instead of current profile verification state
      if (result.phoneRequiresVerification) {
        // Revert displayed phone back to the previously stored (verified) value
        setFormData((p) => ({ ...p, phone: profile.phone || "" }));
        setPendingPhoneNumber(formData.phone);
        setShowOtpVerification(true);

        Swal.fire({
          icon: "info",
          title: "Xác minh số điện thoại",
          text: "Vui lòng xác minh số điện thoại mới bằng OTP",
          confirmButtonText: "OK",
        });

        // Initialize recaptcha for phone verification
        try {
          const verifier = new RecaptchaVerifier(auth, "recaptcha-container", {
            size: "invisible",
            callback: () => {
              console.log("Recaptcha verified");
            },
          });
          setRecaptchaVerifier(verifier);

          // Auto-send OTP
          const formattedPhone = formData.phone.startsWith("+")
            ? formData.phone
            : "+84" + formData.phone.slice(1);
          const result = await signInWithPhoneNumber(
            auth,
            formattedPhone,
            verifier,
          );
          setConfirmationResult(result);
        } catch (err) {
          console.error("Recaptcha error:", err);
          Swal.fire({
            icon: "error",
            title: "Lỗi",
            text: "Không thể gửi mã OTP. Vui lòng thử lại!",
            confirmButtonText: "Đóng",
          });
          setShowOtpVerification(false);
        }
      } else {
        Swal.fire({
          icon: "success",
          title: "Thành công",
          text: result.message || "Cập nhật thông tin cá nhân thành công!",
          timer: 2000,
          showConfirmButton: false,
        });
      }
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: err?.message || "Cập nhật thông tin thất bại. Vui lòng thử lại!",
        confirmButtonText: "Đóng",
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSavingPassword(true);

      const message = await profileApi.changePassword(passwordForm);

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      Swal.fire({
        icon: "success",
        title: "Đã đổi mật khẩu",
        text: message || "Mật khẩu của bạn đã được cập nhật thành công!",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Thất bại",
        text:
          err?.message ||
          "Đổi mật khẩu không thành công. Vui lòng kiểm tra lại!",
        confirmButtonText: "Đóng",
      });
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return <div className={styles.state}>Đang tải...</div>;
  }

  if (!profile) {
    return (
      <div className={styles.error}>
        {profileStatus.message || "Không có dữ liệu hồ sơ"}
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.contentWrapper}>
        <Header />
        <div className={styles.headerSpacer} />
        <div className={styles.pageHeading}>
          <h1 className={styles.pageTitle}>Tài khoản của tôi</h1>
          <p className={styles.pageDesc}>Quản lý thông tin cá nhân</p>
        </div>

        <div className={styles.tabBar}>
          <button
            className={`${styles.tabButton} ${
              activeTab === "profile" ? styles.tabButtonActive : ""
            }`}
            onClick={() => setActiveTab("profile")}
          >
            Thông tin cá nhân
          </button>

          <button
            className={`${styles.tabButton} ${
              activeTab === "security" ? styles.tabButtonActive : ""
            }`}
            onClick={() => setActiveTab("security")}
          >
            Bảo mật
          </button>
        </div>

        {activeTab === "profile" && (
          <div className={styles.card}>
            {profileStatus.message && (
              <div
                className={
                  profileStatus.type === "success"
                    ? styles.successBox
                    : styles.errorBox
                }
              >
                {profileStatus.message}
              </div>
            )}

            <div className={styles.profileHero}>
              <div className={styles.avatarLarge}>
                {getInitial(formData.fullName)}
              </div>
              <h2 className={styles.profileName}>{formData.fullName}</h2>
              <p className={styles.profileRole}>Khách hàng</p>
            </div>

            <form className={styles.profileForm} onSubmit={handleUpdateProfile}>
              <div className={styles.formGrid}>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Họ và tên</label>
                  <input
                    className={`${styles.underlineInput} ${
                      !isEditing ? styles.readOnlyInput : ""
                    }`}
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, fullName: e.target.value }))
                    }
                    readOnly={!isEditing}
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Username</label>
                  <input
                    className={`${styles.underlineInput} ${
                      !isEditing ? styles.readOnlyInput : ""
                    }`}
                    value={formData.username}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, username: e.target.value }))
                    }
                    readOnly={!isEditing}
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Email</label>
                  <input
                    className={`${styles.underlineInput} ${
                      !isEditing ? styles.readOnlyInput : ""
                    }`}
                    value={formData.email}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, email: e.target.value }))
                    }
                    readOnly={!isEditing}
                  />
                </div>

                <div className={styles.field}>
                  <div className={styles.fieldLabelRow}>
                    <label className={styles.fieldLabel}>Số điện thoại</label>
                    <span
                      className={`${styles.verificationBadge} ${
                        profile?.isPhoneVerified
                          ? styles.verifiedBadge
                          : styles.unverifiedBadge
                      }`}
                    >
                      {profile?.isPhoneVerified
                        ? "Đã xác thực"
                        : "Chưa xác thực"}
                    </span>
                    {!profile?.isPhoneVerified &&
                      (formData.phone || profile?.phone) && (
                        <button
                          type="button"
                          className={styles.verifyButton}
                          onClick={handleRequestPhoneVerification}
                        >
                          Xác thực ngay
                        </button>
                      )}
                  </div>
                  <input
                    className={`${styles.underlineInput} ${
                      !isEditing ? styles.readOnlyInput : ""
                    }`}
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, phone: e.target.value }))
                    }
                    readOnly={!isEditing}
                    placeholder="Chưa cập nhật"
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Điểm tích lũy</label>
                  <input
                    className={`${styles.underlineInput} ${styles.readOnlyInput}`}
                    value={String(profile.totalPoints ?? 0)}
                    readOnly
                    disabled
                  />
                </div>
              </div>

              <div className={styles.centerActions}>
                <button className={styles.primaryBlueButton}>
                  {!isEditing ? "Chỉnh sửa" : "Lưu"}
                </button>

                {isEditing && (
                  <button
                    type="button"
                    className={styles.textButton}
                    onClick={resetForm}
                  >
                    Hủy
                  </button>
                )}
              </div>
            </form>

            {/* OTP Verification Modal */}
            {showOtpVerification && (
              <div
                style={{
                  position: "fixed",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: "rgba(0, 0, 0, 0.5)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 1000,
                }}
              >
                <div
                  style={{
                    backgroundColor: "white",
                    borderRadius: "8px",
                    padding: "2rem",
                    maxWidth: "400px",
                    width: "90%",
                    textAlign: "center",
                  }}
                >
                  <h3 style={{ marginBottom: "1rem", color: "#0f172a" }}>
                    Xác minh số điện thoại
                  </h3>
                  <p style={{ color: "#64748b", marginBottom: "1.5rem" }}>
                    Nhập mã OTP được gửi đến {pendingPhoneNumber}
                  </p>

                  <input
                    type="text"
                    placeholder="Nhập 6 chữ số OTP"
                    value={otpCode}
                    onChange={(e) =>
                      setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      borderRadius: "6px",
                      border: "1px solid #e2e8f0",
                      fontSize: "1.5rem",
                      letterSpacing: "0.5rem",
                      textAlign: "center",
                      marginBottom: "1rem",
                    }}
                    maxLength={6}
                  />

                  <button
                    onClick={async () => {
                      if (otpCode.length !== 6 || !confirmationResult) {
                        Swal.fire({
                          icon: "error",
                          title: "Lỗi",
                          text: "Vui lòng nhập đúng 6 chữ số",
                          confirmButtonText: "OK",
                        });
                        return;
                      }

                      try {
                        setVerifyingOtp(true);
                        await confirmationResult.confirm(otpCode);

                        // Call backend to mark phone as verified
                        await verifyOtpApi({
                          phone: pendingPhoneNumber
                            .replace(/\D/g, "")
                            .slice(-10),
                          otp: "FIREBASE_VERIFIED",
                        });

                        setShowOtpVerification(false);
                        setOtpCode("");
                        setPendingPhoneNumber("");

                        // Reload profile
                        const customerProfile =
                          await profileApi.getMyCustomerProfile();
                        setProfile({
                          ...customerProfile,
                          username: customerProfile.username ?? "",
                          isPhoneVerified: true,
                        });

                        Swal.fire({
                          icon: "success",
                          title: "Thành công",
                          text: "Số điện thoại đã được xác minh thành công!",
                          timer: 2000,
                          showConfirmButton: false,
                        });
                      } catch (err: any) {
                        Swal.fire({
                          icon: "error",
                          title: "Lỗi",
                          text:
                            err?.message ||
                            "Xác minh OTP thất bại. Vui lòng thử lại!",
                          confirmButtonText: "OK",
                        });
                      } finally {
                        setVerifyingOtp(false);
                      }
                    }}
                    disabled={verifyingOtp || otpCode.length !== 6}
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      backgroundColor:
                        otpCode.length === 6 ? "#f97316" : "#cbd5e1",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      fontSize: "1rem",
                      fontWeight: "600",
                      cursor: otpCode.length === 6 ? "pointer" : "not-allowed",
                      marginBottom: "0.5rem",
                    }}
                  >
                    {verifyingOtp ? "Đang xác minh..." : "Xác minh"}
                  </button>

                  <button
                    onClick={() => {
                      setShowOtpVerification(false);
                      setOtpCode("");
                      setPendingPhoneNumber("");
                      if (recaptchaVerifier) recaptchaVerifier.clear();
                    }}
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      backgroundColor: "transparent",
                      color: "#64748b",
                      border: "1px solid #e2e8f0",
                      borderRadius: "6px",
                      fontSize: "1rem",
                      cursor: "pointer",
                    }}
                  >
                    Hủy
                  </button>
                </div>
              </div>
            )}

            <div id="recaptcha-container" />
          </div>
        )}

        {activeTab === "security" && (
          <PasswordSecuritySection
            passwordForm={passwordForm}
            setPasswordForm={setPasswordForm}
            savingPassword={savingPassword}
            onSubmit={handleChangePassword}
            status={securityStatus}
          />
        )}
      </div>
    </div>
  );
}
