"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../contexts/AuthContext";
import { profileApi } from "../../../lib/api/profile";
import { forgotPasswordApi } from "../../../lib/api/auth";
import Swal from "sweetalert2";
import type { StaffProfileDTO } from "../../../types/models/profile";
import PasswordSecuritySection from "../PasswordSecuritySection";
import Header from "@/components/Header/Header";
import styles from "./newprofile.module.css";

type TabKey = "profile" | "security";

type StaffProfileWithUsername = StaffProfileDTO & {
  username?: string;
};

type StatusState = {
  type: "success" | "error" | "";
  message: string;
};

export default function StaffProfilePage() {
  const router = useRouter();
  const { user, isLoggedIn } = useAuth();

  const [activeTab, setActiveTab] = useState<TabKey>("profile");
  const [profile, setProfile] = useState<StaffProfileWithUsername | null>(null);

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
    position: "",
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
        setSecurityStatus({ type: "", message: "" });

        const data = (await profileApi.getMyStaffProfile()) as StaffProfileWithUsername;

        setProfile(data);
        setFormData({
          fullName: data.fullName || "",
          username: data.username || "",
          email: data.email || "",
          phone: data.phone || "",
          position: data.position || "",
        });
      } catch (err: any) {
        setProfileStatus({
          type: "error",
          message: err?.message || "Không tải được hồ sơ nhân viên",
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
    return name?.trim()?.charAt(0)?.toUpperCase() || "S";
  };

  const resetForm = () => {
    if (!profile) return;

    setFormData({
      fullName: profile.fullName || "",
      username: profile.username || "",
      email: profile.email || "",
      phone: profile.phone || "",
      position: profile.position || "",
    });

    setIsEditing(false);
    setProfileStatus({ type: "", message: "" });
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    if (!isEditing) {
      setIsEditing(true);
      setProfileStatus({ type: "", message: "" });
      return;
    }

    try {
      setSavingProfile(true);

      const message = await profileApi.updateStaffProfile(profile.staffId, {
        fullName: formData.fullName,
        username: formData.username,
        email: formData.email,
        phone: formData.phone,
      });

      setProfile((prev) =>
        prev
          ? {
              ...prev,
              fullName: formData.fullName,
              username: formData.username,
              email: formData.email,
              phone: formData.phone,
              position: formData.position,
            }
          : prev
      );

      setIsEditing(false);
      
      Swal.fire({
        icon: 'success',
        title: 'Thành công',
        text: typeof message === "string" ? message : "Cập nhật hồ sơ nhân viên thành công!",
        timer: 2000,
        showConfirmButton: false
      });

    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: err?.message || 'Cập nhật hồ sơ thất bại. Vui lòng thử lại!',
        confirmButtonText: 'Đóng'
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !passwordForm.currentPassword ||
      !passwordForm.newPassword ||
      !passwordForm.confirmPassword
    ) {
      Swal.fire({
        icon: 'warning',
        title: 'Chú ý',
        text: 'Vui lòng nhập đầy đủ thông tin đổi mật khẩu',
        confirmButtonText: 'Đóng'
      });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      Swal.fire({
        icon: 'warning',
        title: 'Lỗi khớp mật khẩu',
        text: 'Mật khẩu mới và xác nhận mật khẩu không khớp',
        confirmButtonText: 'Đóng'
      });
      return;
    }

    try {
      setSavingPassword(true);

      const message = await profileApi.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword,
      });

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      Swal.fire({
        icon: 'success',
        title: 'Đã đổi mật khẩu',
        text: typeof message === "string" ? message : "Đổi mật khẩu nhân viên thành công!",
        timer: 2000,
        showConfirmButton: false
      });

    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Thất bại',
        text: err?.message || 'Đổi mật khẩu không thành công. Vui lòng kiểm tra lại!',
        confirmButtonText: 'Đóng'
      });
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.contentWrapper}>
          <Header />
          <div className={styles.headerSpacer} />
          <div className={styles.state}>Đang tải hồ sơ...</div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className={styles.page}>
        <div className={styles.contentWrapper}>
          <Header />
          <div className={styles.headerSpacer} />
          <div className={styles.error}>
            {profileStatus.message || "Không có dữ liệu hồ sơ"}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.contentWrapper}>
        <Header />
        <div className={styles.headerSpacer} />
        <div className={styles.pageHeading}>
          <h1 className={styles.pageTitle}>Quản lý tài khoản</h1>
          <p className={styles.pageDesc}>
            Chỉnh sửa thông tin cá nhân và cài đặt bảo mật của bạn
          </p>
        </div>

        <div className={styles.tabBar}>
          <button
            type="button"
            className={`${styles.tabButton} ${
              activeTab === "profile" ? styles.tabButtonActive : ""
            }`}
            onClick={() => {
              setActiveTab("profile");
              setProfileStatus({ type: "", message: "" });
            }}
          >
            Thông tin cá nhân
          </button>

          <button
            type="button"
            className={`${styles.tabButton} ${
              activeTab === "security" ? styles.tabButtonActive : ""
            }`}
            onClick={() => {
              setActiveTab("security");
              setSecurityStatus({ type: "", message: "" });
            }}
          >
            Mật khẩu & Bảo mật
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
                {getInitial(formData.fullName || profile.fullName)}
              </div>
              <h2 className={styles.profileName}>
                {formData.fullName || profile.fullName || "Nhân viên"}
              </h2>
              <p className={styles.profileRole}>
                {formData.position || profile.position || "Nhân viên"}
              </p>
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
                      setFormData((prev) => ({ ...prev, fullName: e.target.value }))
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
                      setFormData((prev) => ({ ...prev, username: e.target.value }))
                    }
                    readOnly={!isEditing}
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Email</label>
                  <input
                    type="email"
                    className={`${styles.underlineInput} ${
                      !isEditing ? styles.readOnlyInput : ""
                    }`}
                    value={formData.email}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, email: e.target.value }))
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
                      setFormData((prev) => ({ ...prev, phone: e.target.value }))
                    }
                    readOnly={!isEditing}
                  />
                </div>

                <div className={styles.field}>
                <label className={styles.fieldLabel}>Chức vụ</label>
                <input
                    className={`${styles.underlineInput} ${styles.readOnlyInput}`}
                    value={formData.position}
                    readOnly
                    disabled
                />
                </div>

                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Mã nhân viên</label>
                  <input
                    className={`${styles.underlineInput} ${styles.readOnlyInput}`}
                    value={profile.staffCode || ""}
                    readOnly
                    disabled
                  />
                </div>

                
              </div>

              <div className={styles.centerActions}>
                <button
                  className={styles.primaryBlueButton}
                  type="submit"
                  disabled={savingProfile}
                >
                  {!isEditing
                    ? "Cập nhật hồ sơ"
                    : savingProfile
                    ? "Đang lưu..."
                    : "Lưu thông tin"}
                </button>

                {isEditing && (
                  <button
                    type="button"
                    className={styles.textButton}
                    onClick={resetForm}
                    disabled={savingProfile}
                  >
                    Hủy thay đổi
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
            status={securityStatus}
          />
        )}
      </div>
    </div>
  );
}