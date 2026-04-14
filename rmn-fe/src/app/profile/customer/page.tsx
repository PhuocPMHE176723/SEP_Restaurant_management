"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../contexts/AuthContext";
import { profileApi } from "../../../lib/api/profile";
import { forgotPasswordApi } from "../../../lib/api/auth";
import type { CustomerProfileDTO } from "../../../types/models/profile";
import PasswordSecuritySection from "../PasswordSecuritySection";
import styles from "../staff/newprofile.module.css";
import Header from "@/components/Header/Header";

type TabKey = "profile" | "security";

type CustomerProfileWithUsername = CustomerProfileDTO & {
  username?: string;
};

type StatusState = {
  type: "success" | "error" | "";
  message: string;
};

export default function CustomerProfilePage() {
  const router = useRouter();
  const { user, isLoggedIn } = useAuth();

  const [activeTab, setActiveTab] = useState<TabKey>("profile");
  const [profile, setProfile] = useState<CustomerProfileWithUsername | null>(null);

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
  const [isForgotPassword, setIsForgotPassword] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    email: "",
    phone: "",
  });

  const [forgotEmail, setForgotEmail] = useState("");

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

        setForgotEmail(data.email || user?.email || "");
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

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    if (!isEditing) {
      setIsEditing(true);
      return;
    }

    try {
      setSavingProfile(true);
      setProfileStatus({ type: "", message: "" });

      const message = await profileApi.updateCustomerProfile(profile.customerId, {
        fullName: formData.fullName,
        username: formData.username,
        email: formData.email,
        phone: formData.phone,
      });

      setIsEditing(false);
      setProfileStatus({
        type: "success",
        message: message || "Cập nhật thành công",
      });
    } catch (err: any) {
      setProfileStatus({
        type: "error",
        message: err?.message || "Cập nhật thất bại",
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSavingPassword(true);
      setSecurityStatus({ type: "", message: "" });

      const message = await profileApi.changePassword(passwordForm);

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setSecurityStatus({
        type: "success",
        message: message,
      });
    } catch (err: any) {
      setSecurityStatus({
        type: "error",
        message: err?.message || "Đổi mật khẩu thất bại",
      });
    } finally {
      setSavingPassword(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSecurityStatus({ type: "", message: "" });

      const message = await forgotPasswordApi({ email: forgotEmail });

      setSecurityStatus({
        type: "success",
        message: message,
      });

      setIsForgotPassword(false);
    } catch (err: any) {
      setSecurityStatus({
        type: "error",
        message: err?.message || "Gửi email thất bại",
      });
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
                  <label className={styles.fieldLabel}>Số điện thoại</label>
                  <input
                    className={`${styles.underlineInput} ${
                      !isEditing ? styles.readOnlyInput : ""
                    }`}
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, phone: e.target.value }))
                    }
                    readOnly={!isEditing}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Điểm tích lũy</label>
                  <input
                    className={`${styles.underlineInput} ${styles.readOnly}`}
                    value={String(profile.totalPoints ?? 0)}
                    readOnly
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
          </div>
        )}

        {activeTab === "security" && (
          <PasswordSecuritySection
            passwordForm={passwordForm}
            setPasswordForm={setPasswordForm}
            savingPassword={savingPassword}
            onSubmit={handleChangePassword}
            isForgotPassword={isForgotPassword}
            setIsForgotPassword={setIsForgotPassword}
            forgotEmail={forgotEmail}
            setForgotEmail={setForgotEmail}
            onForgotPasswordSubmit={handleForgotPassword}
            status={securityStatus}
          />
        )}
      </div>
    </div>
  );
}