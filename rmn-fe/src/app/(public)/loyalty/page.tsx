"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "../../../components/Header/Header";
import Footer from "../../../components/Footer/Footer";
import { useAuth } from "../../../contexts/AuthContext";
import { customerApi, type CustomerProfileResponse } from "../../../lib/api/customer";
import { getLoyaltyTiers } from "../../../lib/api/promotion";
import { type LoyaltyTier } from "../../../types/models/promotion";
import Modal from "../../../components/Modal/Modal";
import Pagination from "../../../components/Pagination";
import styles from "./page.module.css";

export default function LoyaltyPage() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Loyalty Data
  const [loyaltyProfile, setLoyaltyProfile] = useState<CustomerProfileResponse | null>(null);
  const [tiers, setTiers] = useState<LoyaltyTier[]>([]);
  const [activeTab, setActiveTab] = useState<'points' | 'discounts'>('points');

  // History Pagination
  const [pointsPage, setPointsPage] = useState(1);
  const [discountsPage, setDiscountsPage] = useState(1);
  const historyItemsPerPage = 5;

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"success" | "error">("success");
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isLoggedIn) {
      router.push("/login");
      return;
    }

    if (mounted && isLoggedIn) {
      loadData();
    }
  }, [mounted, isLoggedIn, router]);

  async function loadData() {
    try {
      setLoading(true);
      const [profileData, tiersData] = await Promise.all([
        customerApi.getMyProfile(),
        getLoyaltyTiers()
      ]);
      setLoyaltyProfile(profileData);
      setTiers(tiersData.filter(t => t.isActive));
    } catch (error: any) {
      console.error("Failed to load loyalty data:", error);
      setModalType("error");
      setModalTitle("Lỗi");
      setModalMessage(error.message || "Không thể tải thông tin tài khoản");
      setModalOpen(true);
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  function formatTime(dateStr: string) {
    const date = new Date(dateStr);
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  }

  const getCurrentTierId = () => {
    if (!loyaltyProfile || tiers.length === 0) return null;
    const achievedTiers = tiers
      .filter(t => loyaltyProfile.totalPoints >= t.minPoints)
      .sort((a, b) => b.minPoints - a.minPoints);
    return achievedTiers.length > 0 ? achievedTiers[0].tierId : null;
  };

  const currentTierId = getCurrentTierId();

  if (!mounted || loading) {
    return (
      <>
        <Header />
        <main className={styles.main}>
          <div className="container">
            <div className={styles.loading}>Đang tải...</div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className={styles.main}>
        <div className="container">
          <div className={styles.header}>
            <h1 className={styles.title}>Điểm tích lũy & Ưu đãi</h1>
            <p className={styles.subtitle}>Quản lý cấp độ thành viên và ưu đãi của bạn</p>
          </div>

          {loyaltyProfile && (
            <div className={styles.loyaltySection}>
              <div className={styles.loyaltyCard}>
                <div className={styles.loyaltyMain}>
                  <div className={styles.currentTier}>{loyaltyProfile.currentTier}</div>
                  <div className={styles.totalPoints}>
                    {loyaltyProfile.totalPoints.toLocaleString()}
                    <span className={styles.pointsLabel}>điểm</span>
                  </div>
                </div>

                <div className={styles.loyaltyDetails}>
                  <div className={styles.milestones}>
                    <div className={styles.milestoneHeader}>
                      <span className={styles.milestoneTitle}>Mốc đổi & Ưu đãi</span>
                    </div>
                    <div className={styles.milestoneList}>
                      {tiers.map(tier => (
                        <div 
                          key={tier.tierId} 
                          className={`${styles.milestoneItem} ${loyaltyProfile.totalPoints >= tier.minPoints ? styles.milestoneReached : ""}`}
                        >
                          <div className={styles.milestoneInfoContainer}>
                            <span className={styles.milestoneName}>{tier.tierName} (Giảm {tier.discountRate}%)</span>
                            {tier.tierId === currentTierId && (
                              <span className={styles.currentTierLabel}>Cấp độ hiện tại</span>
                            )}
                          </div>
                          <span className={styles.milestonePoints}>{tier.minPoints.toLocaleString()} điểm</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.historyCard}>
                <div className={styles.tabs}>
                  <button 
                    className={`${styles.tabBtn} ${activeTab === 'points' ? styles.tabActive : ""}`}
                    onClick={() => setActiveTab('points')}
                  >
                    Lịch sử điểm
                  </button>
                  <button 
                    className={`${styles.tabBtn} ${activeTab === 'discounts' ? styles.tabActive : ""}`}
                    onClick={() => setActiveTab('discounts')}
                  >
                    Lịch sử ưu đãi
                  </button>
                </div>

                {activeTab === 'points' ? (
                  <>
                    <div className={styles.historyList}>
                      {loyaltyProfile.pointHistory.length === 0 ? (
                        <div style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '1rem' }}>Chưa có lịch sử tích điểm</div>
                      ) : (
                        loyaltyProfile.pointHistory
                          .slice((pointsPage - 1) * historyItemsPerPage, pointsPage * historyItemsPerPage)
                          .map(entry => (
                          <div key={entry.ledgerId} className={styles.historyItem}>
                            <div className={styles.historyInfo}>
                              <span className={styles.historyNote}>{entry.note || "Tích điểm đơn hàng"}</span>
                              <span className={styles.historyDate}>{formatDate(entry.createdAt)} {formatTime(entry.createdAt)}</span>
                            </div>
                            <div className={`${styles.historyChange} ${entry.pointsChange > 0 ? styles.changePositive : styles.changeNegative}`}>
                              {entry.pointsChange > 0 ? "+" : ""}{entry.pointsChange}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    {loyaltyProfile.pointHistory.length > historyItemsPerPage && (
                      <div style={{ marginTop: '1rem' }}>
                        <Pagination 
                          currentPage={pointsPage}
                          totalPages={Math.ceil(loyaltyProfile.pointHistory.length / historyItemsPerPage)}
                          totalItems={loyaltyProfile.pointHistory.length}
                          itemsPerPage={historyItemsPerPage}
                          onPageChange={setPointsPage}
                        />
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className={styles.historyList}>
                      {loyaltyProfile.discountHistory.length === 0 ? (
                        <div style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '1rem' }}>Chưa có lịch sử sử dụng ưu đãi</div>
                      ) : (
                        loyaltyProfile.discountHistory
                          .slice((discountsPage - 1) * historyItemsPerPage, discountsPage * historyItemsPerPage)
                          .map(history => (
                          <div key={history.invoiceId} className={styles.discountItem}>
                            <div className={styles.discountHeader}>
                              <span>Đơn hàng {history.invoiceCode}</span>
                              <span className={styles.discountAmount}>-{history.discountAmount.toLocaleString()}đ</span>
                            </div>
                            <div className={styles.discountMeta}>
                              <span>Ngày: {formatDate(history.issuedAt)}</span>
                              <span>Tổng đơn: {history.totalAmount.toLocaleString()}đ</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    {loyaltyProfile.discountHistory.length > historyItemsPerPage && (
                      <div style={{ marginTop: '1rem' }}>
                        <Pagination 
                          currentPage={discountsPage}
                          totalPages={Math.ceil(loyaltyProfile.discountHistory.length / historyItemsPerPage)}
                          totalItems={loyaltyProfile.discountHistory.length}
                          itemsPerPage={historyItemsPerPage}
                          onPageChange={setDiscountsPage}
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalTitle}
        type={modalType}
      >
        <p>{modalMessage}</p>
      </Modal>
    </>
  );
}
