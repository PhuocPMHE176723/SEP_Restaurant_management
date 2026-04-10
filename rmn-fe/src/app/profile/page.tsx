"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { customerApi, CustomerProfileResponse } from "@/lib/api/customer";
import styles from "./Profile.module.css";
import Header from "@/components/Header/Header";

export default function ProfilePage() {
  const router = useRouter();
  const { isLoggedIn, user } = useAuth();
  
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"INFO" | "POINTS" | "DISCOUNTS">("POINTS");
  const [profile, setProfile] = useState<CustomerProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
      const data = await customerApi.getMyProfile();
      setProfile(data);
    } catch (err: any) {
      setError(err.message || "Không thể tải hồ sơ");
    } finally {
      setLoading(false);
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
                <p style={{ marginBottom: "1rem" }}><strong>Họ và tên:</strong> {profile.fullName}</p>
                <p style={{ marginBottom: "1rem" }}><strong>Số điện thoại:</strong> {profile.phone}</p>
                <p style={{ marginBottom: "1rem" }}><strong>Email:</strong> {profile.email || "Chưa cập nhật"}</p>
                <button className="btn btn-primary" style={{ marginTop: "1rem" }} disabled>Cập nhật thông tin</button>
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
