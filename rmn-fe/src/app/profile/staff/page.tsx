"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../contexts/AuthContext";
import { profileApi } from "../../../lib/api/profile";
import type { StaffProfileDTO } from "../../../types/models/profile";
import styles from "../profile.module.css";

type TabKey = "profile" | "security";

type StaffProfileWithUsername = StaffProfileDTO & {
  username?: string;
};

export default function StaffProfilePage() {
  const router = useRouter();
  const { user, isLoggedIn } = useAuth();

  const [activeTab, setActiveTab] = useState<TabKey>("profile");
  const [profile, setProfile] = useState<StaffProfileWithUsername | null>(null);

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [status, setStatus] = useState<{
    type: "success" | "error" | "";
    message: string;
  }>({
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
    position: "",
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
        setStatus({ type: "", message: "" });

        const data = (await profileApi.getMyStaffProfile()) as StaffProfileWithUsername;

        setProfile(data);
        setFormData({
          fullName: data.fullName || "",
          username: data.username || "",
          email: data.email || "",
          phone: data.phone || "",
          position: data.position || "",
        });
        setForgotEmail(data.email || user?.email || "");
      } catch (err: any) {
        setStatus({
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
    setStatus({ type: "", message: "" });
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    if (!isEditing) {
      setIsEditing(true);
      setStatus({ type: "", message: "" });
      return;
    }

    try {
      setSavingProfile(true);
      setStatus({ type: "", message: "" });

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
      setStatus({
        type: "success",
        message: typeof message === "string" ? message : "Cập nhật hồ sơ thành công",
      });
    } catch (err: any) {
      setStatus({
        type: "error",
        message: err?.message || "Cập nhật hồ sơ thất bại",
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setStatus({
        type: "error",
        message: "Vui lòng nhập đầy đủ thông tin đổi mật khẩu",
      });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setStatus({
        type: "error",
        message: "Mật khẩu mới và xác nhận mật khẩu không khớp",
      });
      return;
    }

    try {
      setSavingPassword(true);
      setStatus({ type: "", message: "" });

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

      setStatus({
        type: "success",
        message: typeof message === "string" ? message : "Đổi mật khẩu thành công",
      });
    } catch (err: any) {
      setStatus({
        type: "error",
        message: err?.message || "Đổi mật khẩu thất bại",
      });
    } finally {
      setSavingPassword(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!forgotEmail) {
      setStatus({
        type: "error",
        message: "Vui lòng nhập email để khôi phục mật khẩu",
      });
      return;
    }

    try {
      setStatus({ type: "", message: "" });

      const message = await profileApi.forgotPassword(forgotEmail);

      setStatus({
        type: "success",
        message:
          typeof message === "string"
            ? message
            : `Đã gửi liên kết khôi phục tới ${forgotEmail}`,
      });

      setIsForgotPassword(false);
    } catch (err: any) {
      setStatus({
        type: "error",
        message: err?.message || "Gửi email quên mật khẩu thất bại",
      });
    }
  };

  if (loading) {
    return <div className={styles.state}>Đang tải hồ sơ...</div>;
  }

  if (!profile) {
    return <div className={styles.error}>Không có dữ liệu hồ sơ</div>;
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() => router.push("/")}
          >
            Trở về trang chủ
          </button>
        </div>

        <div className={styles.tabBar}>
          <button
            type="button"
            className={`${styles.tab} ${activeTab === "profile" ? styles.tabActive : ""}`}
            onClick={() => {
              setActiveTab("profile");
              setIsForgotPassword(false);
            }}
          >
            Thông tin cá nhân
          </button>

          <button
            type="button"
            className={`${styles.tab} ${activeTab === "security" ? styles.tabActive : ""}`}
            onClick={() => {
              setActiveTab("security");
              setIsForgotPassword(false);
            }}
          >
            Mật khẩu & Bảo mật
          </button>
        </div>

        {status.message && (
          <div className={status.type === "success" ? styles.successBox : styles.errorBox}>
            {status.message}
          </div>
        )}

        {activeTab === "profile" && (
          <div className={styles.card}>
            <div className={styles.avatarSection}>
              <div className={styles.avatar}>{getInitial(formData.fullName || profile.fullName)}</div>
              <h2 className={styles.name}>{formData.fullName || profile.fullName}</h2>
              <div className={styles.subText}>{formData.position || profile.position || "Nhân viên"}</div>
            </div>

            <form className={styles.form} onSubmit={handleUpdateProfile}>
              <div className={styles.gridTwo}>
                <div className={styles.field}>
                  <label className={styles.label}>Họ và tên</label>
                  <input
                    className={`${styles.input} ${!isEditing ? styles.readOnly : ""}`}
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, fullName: e.target.value }))
                    }
                    readOnly={!isEditing}
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Username</label>
                  <input
                    className={`${styles.input} ${!isEditing ? styles.readOnly : ""}`}
                    value={formData.username}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, username: e.target.value }))
                    }
                    readOnly={!isEditing}
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Email</label>
                  <input
                    className={`${styles.input} ${!isEditing ? styles.readOnly : ""}`}
                    value={formData.email}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, email: e.target.value }))
                    }
                    readOnly={!isEditing}
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Số điện thoại</label>
                  <input
                    className={`${styles.input} ${!isEditing ? styles.readOnly : ""}`}
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, phone: e.target.value }))
                    }
                    readOnly={!isEditing}
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Chức vụ</label>
                  <input
                    className={`${styles.input} ${!isEditing ? styles.readOnly : ""}`}
                    value={formData.position}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, position: e.target.value }))
                    }
                    readOnly={!isEditing}
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Mã nhân viên</label>
                  <input
                    className={`${styles.input} ${styles.readOnly}`}
                    value={profile.staffCode}
                    readOnly
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Trạng thái làm việc</label>
                  <input
                    className={`${styles.input} ${styles.readOnly}`}
                    value={profile.workingStatus}
                    readOnly
                  />
                </div>
              </div>

              <div className={styles.actionRow}>
                <button className={styles.button} type="submit" disabled={savingProfile}>
                  {!isEditing
                    ? "Cập nhật hồ sơ"
                    : savingProfile
                    ? "Đang lưu..."
                    : "Lưu thay đổi"}
                </button>

                {isEditing && (
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={resetForm}
                    disabled={savingProfile}
                  >
                    Hủy
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        {activeTab === "security" && (
          <div className={styles.card}>
            {!isForgotPassword ? (
              <>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Thay đổi mật khẩu</h2>
                  <p className={styles.sectionDesc}>
                    Cập nhật mật khẩu để bảo vệ tài khoản của bạn.
                  </p>
                </div>

                <form className={styles.securityForm} onSubmit={handleChangePassword}>
                  <div className={styles.field}>
                    <div className={styles.inlineLabel}>
                      <label className={styles.label}>Mật khẩu hiện tại</label>
                      <button
                        type="button"
                        className={styles.linkButton}
                        onClick={() => setIsForgotPassword(true)}
                      >
                        Quên mật khẩu?
                      </button>
                    </div>
                    <input
                      type="password"
                      className={styles.input}
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
                    <label className={styles.label}>Mật khẩu mới</label>
                    <input
                      type="password"
                      className={styles.input}
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
                    <label className={styles.label}>Xác nhận mật khẩu mới</label>
                    <input
                      type="password"
                      className={styles.input}
                      value={passwordForm.confirmPassword}
                      onChange={(e) =>
                        setPasswordForm((prev) => ({
                          ...prev,
                          confirmPassword: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <button className={styles.button} type="submit" disabled={savingPassword}>
                    {savingPassword ? "Đang xử lý..." : "Xác nhận đổi mật khẩu"}
                  </button>
                </form>
              </>
            ) : (
              <>
                <div className={styles.sectionHeader}>
                  <button
                    type="button"
                    className={styles.linkButton}
                    onClick={() => setIsForgotPassword(false)}
                  >
                    Quay lại đổi mật khẩu
                  </button>
                  <h2 className={styles.sectionTitle}>Quên mật khẩu?</h2>
                  <p className={styles.sectionDesc}>
                    Nhập email đã đăng ký, hệ thống sẽ gửi liên kết đặt lại mật khẩu.
                  </p>
                </div>

                <form className={styles.securityForm} onSubmit={handleForgotPassword}>
                  <div className={styles.field}>
                    <label className={styles.label}>Email khôi phục</label>
                    <input
                      type="email"
                      className={styles.input}
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      required
                    />
                  </div>

                  <button className={styles.button} type="submit">
                    Gửi liên kết khôi phục
                  </button>
                </form>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}