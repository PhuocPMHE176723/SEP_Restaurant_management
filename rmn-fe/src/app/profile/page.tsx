"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { customerApi, CustomerProfileResponse } from "@/lib/api/customer";
import styles from "./Profile.module.css";
import Header from "@/components/Header/Header";
import { auth } from "@/lib/firebase";
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth";
import { verifyOtpApi } from "@/lib/api/auth";
import { isValidVNPhone } from "@/lib/validation";
import Swal from "sweetalert2";

export default function ProfilePage() {
  const router = useRouter();
  const { isLoggedIn, user, login } = useAuth();
  
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"INFO" | "POINTS" | "DISCOUNTS">("INFO");
  const [profile, setProfile] = useState<CustomerProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [updating, setUpdating] = useState(false);

  // Verification state
  const [verifying, setVerifying] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [otp, setOtp] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!isLoggedIn) {
      router.replace("/login");
      return;
    }
    fetchProfile();
  }, [mounted, isLoggedIn, router]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await customerApi.getMyProfile();
      
      // 👉 Map PascalCase from Backend to camelCase for Frontend
      const data: CustomerProfileResponse = {
        customerId: res.customerId || (res as any).CustomerId,
        fullName: res.fullName || (res as any).FullName,
        phone: res.phone || (res as any).Phone,
        email: res.email || (res as any).Email,
        isPhoneVerified: res.isPhoneVerified ?? (res as any).IsPhoneVerified ?? false,
        totalPoints: res.totalPoints ?? (res as any).TotalPoints ?? 0,
        currentTier: res.currentTier || (res as any).CurrentTier || "Thành viên",
        pointHistory: res.pointHistory || (res as any).PointHistory || [],
        discountHistory: res.discountHistory || (res as any).DiscountHistory || [],
      };

      console.log("[Profile] Fetched Data:", data);
      setProfile(data);
      setEditName(data.fullName || "");
      setEditPhone(data.phone || "");
    } catch (err: any) {
      console.error("[Profile] Fetch Error:", err);
      setError(err.message || "Không thể tải hồ sơ");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!editName.trim()) return Swal.fire("Lỗi", "Họ tên không được để trống", "error");
    if (editPhone && !isValidVNPhone(editPhone)) return Swal.fire("Lỗi", "Số điện thoại không hợp lệ", "error");

    try {
      setUpdating(true);
      await customerApi.updateProfile({ fullName: editName, phone: editPhone });
      await fetchProfile();
      setIsEditing(false);
      Swal.fire("Thành công", "Cập nhật hồ sơ thành công", "success");
    } catch (err: any) {
      Swal.fire("Lỗi", err.message || "Không thể cập nhật hồ sơ", "error");
    } finally {
      setUpdating(false);
    }
  };

  const setupRecaptcha = () => {
    if ((window as any).recaptchaVerifier) return;
    (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
      size: "invisible",
    });
  };

  const sendOtp = async () => {
    if (!profile?.phone || !isValidVNPhone(profile.phone)) {
        return Swal.fire("Lỗi", "Vui lòng cập nhật số điện thoại hợp lệ trước", "error");
    }

    try {
      setVerifying(true);
      setupRecaptcha();
      const appVerifier = (window as any).recaptchaVerifier;
      const formattedPhone = profile.phone.startsWith("0") 
        ? "+84" + profile.phone.slice(1) 
        : profile.phone;
      
      const result = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      setConfirmationResult(result);
      Swal.fire("Đã gửi mã", "Một mã xác thực đã được gửi đến số điện thoại của bạn", "info");
    } catch (err: any) {
      console.error(err);
      Swal.fire("Lỗi", "Không thể gửi SMS. Vui lòng thử lại sau.", "error");
    } finally {
      setVerifying(false);
    }
  };

  const verifyOtp = async () => {
    if (!confirmationResult || !otp) return;
    try {
      setVerifying(true);
      await confirmationResult.confirm(otp);
      // Firebase success, now tell backend
      await verifyOtpApi({ phone: profile!.phone, otp: "FIREBASE_VERIFIED" });
      
      Swal.fire("Thành công", "Xác thực số điện thoại thành công!", "success");
      setConfirmationResult(null);
      setOtp("");
      await fetchProfile();
    } catch (err: any) {
      Swal.fire("Lỗi", "Mã xác thực không chính xác", "error");
    } finally {
      setVerifying(false);
    }
  };

  if (!mounted || loading) {
    return (
      <>
        <Header />
        <div style={{ padding: "4rem", textAlign: "center", color: "#94a3b8" }}>
          Đang tải hồ sơ...
        </div>
      </>
    );
  }

  if (error || !profile) {
    return (
      <>
        <Header />
        <div style={{ padding: "4rem", textAlign: "center", color: "#ef4444" }}>
          Lỗi: {error}
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div id="recaptcha-container"></div>
      <div className={styles.container}>
        <h1 className={styles.title}>Hồ sơ cá nhân</h1>
        
        <div className={styles.card}>
          <div className={styles.tabs}>
            <button 
              className={`${styles.tabBtn} ${activeTab === "INFO" ? styles.active : ""}`}
              onClick={() => setActiveTab("INFO")}
            >
              Thông tin chung
            </button>
            <button 
              className={`${styles.tabBtn} ${activeTab === "POINTS" ? styles.active : ""}`}
              onClick={() => setActiveTab("POINTS")}
            >
              Thành viên & Điểm thưởng
            </button>
            <button 
              className={`${styles.tabBtn} ${activeTab === "DISCOUNTS" ? styles.active : ""}`}
              onClick={() => setActiveTab("DISCOUNTS")}
            >
              Lịch sử ưu đãi
            </button>
          </div>

          <div className={styles.tabContent}>
            {activeTab === "INFO" && (
              <div style={{ color: "#e2e8f0" }}>
                {!isEditing ? (
                  <>
                    <p style={{ marginBottom: "1rem" }}><strong>Họ và tên:</strong> {profile.fullName}</p>
                    <p style={{ marginBottom: "1rem" }}>
                        <strong>Số điện thoại:</strong> {profile.phone || "Chưa cập nhật"}
                    </p>
                    <p style={{ marginBottom: "1rem" }}><strong>Email:</strong> {profile.email || "Chưa cập nhật"}</p>
                    
                    <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                        <button className="btn btn-primary" onClick={() => setIsEditing(true)}>Cập nhật thông tin</button>
                    </div>

                    {confirmationResult && (
                        <div style={{ marginTop: "1.5rem", padding: "1rem", border: "1px solid #475569", borderRadius: "8px" }}>
                            <p style={{ marginBottom: "0.5rem" }}>Nhập mã OTP đã gửi tới {profile.phone}:</p>
                            <input 
                                type="text" 
                                className={styles.input} 
                                value={otp} 
                                onChange={(e) => setOtp(e.target.value)} 
                                placeholder="123456"
                                style={{ maxWidth: "200px" }}
                            />
                            <button className="btn btn-primary" style={{ marginLeft: "1rem" }} onClick={verifyOtp} disabled={verifying}>
                                {verifying ? "Đang kiểm tra..." : "Xác thực"}
                            </button>
                        </div>
                    )}
                  </>
                ) : (
                  <div className={styles.form}>
                    <div className={styles.field} style={{ marginBottom: "1rem" }}>
                        <label>Họ và tên</label>
                        <input type="text" className={styles.input} value={editName} onChange={(e) => setEditName(e.target.value)} />
                    </div>
                    <div className={styles.field} style={{ marginBottom: "1rem" }}>
                        <label>Số điện thoại</label>
                        <input type="text" className={styles.input} value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="09xxxxxxxx" />
                    </div>
                    <div style={{ display: "flex", gap: "1rem" }}>
                        <button className="btn btn-primary" onClick={handleUpdate} disabled={updating}>
                            {updating ? "Đang lưu..." : "Lưu thay đổi"}
                        </button>
                        <button className="btn" style={{ backgroundColor: "#64748b", color: "white" }} onClick={() => setIsEditing(false)}>Hủy</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "POINTS" && (
              <div>
                <div className={styles.overviewGrid}>
                  <div className={styles.overviewBox}>
                    <span className={styles.boxLabel}>Hạng thành viên hiện tại</span>
                    <span className={`${styles.boxValue} ${styles.boxHighlight}`}>{profile.currentTier}</span>
                  </div>
                  <div className={styles.overviewBox}>
                    <span className={styles.boxLabel}>Điểm tích luỹ có sẵn</span>
                    <span className={styles.boxValue}>{profile.totalPoints.toLocaleString("vi-VN")} điểm</span>
                  </div>
                </div>

                <h3 style={{ marginBottom: "1rem", color: "#f8fafc", fontSize: "1.1rem" }}>Lịch sử biến động điểm</h3>
                
                {profile.pointHistory.length === 0 ? (
                  <div className={styles.emptyState}>Chưa có lịch sử tích luỹ hoặc trừ điểm.</div>
                ) : (
                  <div className={styles.timeline}>
                    {profile.pointHistory.map(entry => (
                      <div key={entry.ledgerId} className={styles.ledgerRow}>
                        <div className={styles.ledgerInfo}>
                          <span className={styles.ledgerNote}>{entry.note || `Giao dịch ${entry.refType}`}</span>
                          <span className={styles.ledgerDate}>{new Date(entry.createdAt).toLocaleString("vi-VN")}</span>
                        </div>
                        <div className={`${styles.ledgerPoints} ${entry.pointsChange > 0 ? styles.pointsPlus : styles.pointsMinus}`}>
                          {entry.pointsChange > 0 ? "+" : ""}{entry.pointsChange} điểm
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "DISCOUNTS" && (
              <div>
                <h3 style={{ marginBottom: "1rem", color: "#f8fafc", fontSize: "1.1rem" }}>Các hoá đơn đã hưởng ưu đãi</h3>
                {profile.discountHistory.length === 0 ? (
                  <div className={styles.emptyState}>Bạn chưa sử dụng Ưu đãi hoặc Mã giảm giá nào.</div>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table className={styles.invoiceTable}>
                      <thead>
                        <tr>
                          <th>Mã Hoá Đơn</th>
                          <th>Ngày giao dịch</th>
                          <th>Tổng tiền gốc</th>
                          <th>Được giảm giá</th>
                          <th>Thực trả</th>
                        </tr>
                      </thead>
                      <tbody>
                        {profile.discountHistory.map(inv => (
                          <tr key={inv.invoiceId}>
                            <td>{inv.invoiceCode}</td>
                            <td>{new Date(inv.issuedAt).toLocaleString("vi-VN", { dateStyle: 'short', timeStyle: 'short' })}</td>
                            <td>{inv.totalAmount.toLocaleString("vi-VN")}đ</td>
                            <td className={styles.discountValue}>-{inv.discountAmount.toLocaleString("vi-VN")}đ</td>
                            <td>{inv.paidAmount.toLocaleString("vi-VN")}đ</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
