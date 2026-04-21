"use client";

import { useEffect, useMemo, useState } from "react";
import { cookingApi, type CookingListItem } from "../../../lib/api/kitchen";
import styles from "../Kitchen.module.css";
import { Search, RotateCcw, Plus, Clock, ChefHat, Check } from "lucide-react";
import { showError, showSuccess } from "../../../lib/ui/alerts";

export default function KitchenPage() {
  const [cooking_list, setCookingList] = useState<CookingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchCookingList();
    const interval = setInterval(fetchCookingList, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchCookingList = async () => {
    try {
      const data = await cookingApi.getCookingList();
      setCookingList(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch cooking list:", error);
      setLoading(false);
      showError("Không thể tải danh sách chế biến");
    }
  };

  const handleStartCooking = async (itemId: number) => {
    try {
      await cookingApi.startCookingByItem(itemId);
      showSuccess("Đã chuyển 1 món sang trạng thái đang nấu");
      await fetchCookingList();
    } catch (error) {
      console.error(error);
      showError("Không thể chuyển món sang đang nấu");
    }
  };

  const handleMarkReady = async (itemId: number) => {
    try {
      await cookingApi.markReadyByItem(itemId);
      showSuccess("Đã chuyển 1 món sang trạng thái sẵn sàng phục vụ");
      await fetchCookingList();
    } catch (error) {
      console.error(error);
      showError("Không thể chuyển món sang sẵn sàng phục vụ");
    }
  };

  const filteredCookingList = useMemo(() => {
    return cooking_list.filter((item) => {
      const keyword = searchTerm.trim().toLowerCase();
      if (!keyword) return true;

      return (
        item.itemName.toLowerCase().includes(keyword) ||
        (item.unit || "").toLowerCase().includes(keyword)
      );
    });
  }, [cooking_list, searchTerm]);

  const formatLastUpdated = (value?: string | null) => {
    if (!value) return "Chưa có cập nhật";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Chưa có cập nhật";

    const diffMs = Date.now() - date.getTime();
    const diffMin = Math.max(1, Math.floor(diffMs / 60000));

    if (diffMin < 60) return `Cập nhật ${diffMin} phút trước`;

    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `Cập nhật ${diffHour} giờ trước`;

    const diffDay = Math.floor(diffHour / 24);
    return `Cập nhật ${diffDay} ngày trước`;
  };

  if (loading) return <div className={styles.spinner} />;

  return (
    <div className={styles.pageContainer}>
      <div
        style={{
          padding: "0 1.5rem",
          marginTop: "1rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "14px",
                background: "#ff7a30",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 10px 20px rgba(255,122,48,0.18)",
              }}
            >
              <ChefHat size={22} />
            </div>
            <div>
              <h1 className={styles.pageTitle} style={{ fontSize: "2rem", marginBottom: 0 }}>
                Danh sách chế biến
              </h1>
              <p className={styles.pageSubtitle}>
                Theo dõi tổng đặt trước, món cần nấu, đang nấu và sẵn sàng phục vụ
              </p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: "0 1.5rem", marginTop: "1.5rem" }}>
        <div className={styles.card}>
          <div className={styles.controlBar}>
            <div style={{ flex: 1, minWidth: "260px" }}>
              <label className={styles.label}>Tìm kiếm món ăn</label>
              <div style={{ position: "relative" }}>
                <Search
                  size={18}
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#94a3b8",
                  }}
                />
                <input
                  type="text"
                  className={styles.input}
                  style={{ paddingLeft: "40px" }}
                  placeholder="Nhập tên món hoặc đơn vị..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <button
              className={styles.btnPrimary}
              onClick={() => setSearchTerm("")}
              style={{ background: "#f1f5f9", color: "#475569", boxShadow: "none" }}
            >
              <RotateCcw size={16} /> Đặt lại
            </button>
          </div>
        </div>
      </div>

      <div className={styles.historyContainer} style={{ marginTop: "2rem" }}>
        <div className={styles.historyList}>
          {/* Header */}
          <div
            className={`${styles.historyItem} ${styles.historyHeader}`}
            style={{
              background: "#f8fafc",
              borderBottom: "2px solid #e2e8f0",
              fontWeight: 700,
              // Tùy chỉnh lại lưới Grid: 5 cột (giảm từ 7 cột)
              gridTemplateColumns: "minmax(250px, 2.5fr) 100px minmax(210px, 2fr) minmax(210px, 2fr) minmax(120px, 1fr)",
              gap: "1rem",
            }}
          >
            <div>Thông tin món</div>
            <div style={{ textAlign: "center" }}>Số lượng đặt trước</div>
            <div style={{ textAlign: "center" }}>Số lượng cần nấu</div>
            <div style={{ textAlign: "center" }}>Số lượng đang nấu</div>
            <div style={{ textAlign: "center" }}>Số lượng sẵn sàng</div>
          </div>

          {filteredCookingList.length === 0 ? (
            <div style={{ padding: "4rem", textAlign: "center", color: "#94a3b8" }}>
              <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>👨‍🍳</div>
              Không tìm thấy món nào phù hợp
            </div>
          ) : (
            filteredCookingList.map((item) => {
              const imageUrl =
                item.thumbnail && item.thumbnail.trim() !== ""
                  ? item.thumbnail
                  : "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=600&auto=format&fit=crop";

              return (
                <div
                  key={item.itemId}
                  className={styles.historyItem}
                  style={{
                    // Áp dụng chung Grid với Header
                    gridTemplateColumns: "minmax(250px, 2.5fr) 100px minmax(210px, 2fr) minmax(210px, 2fr) minmax(120px, 1fr)",
                    gap: "1rem",
                    alignItems: "center",
                  }}
                >
                  {/* Thông tin món */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "1rem",
                      minWidth: 0,
                    }}
                  >
                    <img
                      src={imageUrl}
                      alt={item.itemName}
                      style={{
                        width: "72px",
                        height: "72px",
                        borderRadius: "18px",
                        objectFit: "cover",
                        border: "1px solid #e2e8f0",
                        boxShadow: "0 4px 12px rgba(15,23,42,0.06)",
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ minWidth: 0 }}>
                      <div
                        className={styles.historyName}
                        style={{
                          textTransform: "uppercase",
                          fontSize: "1rem",
                          lineHeight: 1.3,
                          whiteSpace: "normal",
                        }}
                      >
                        {item.itemName}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.4rem",
                          marginTop: "0.35rem",
                          color: "#94a3b8",
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                        }}
                      >
                        <Clock size={12} />
                        <span>{formatLastUpdated(item.lastUpdatedAt)}</span>
                        {item.unit ? <span>• {item.unit}</span> : null}
                      </div>
                    </div>
                  </div>

                  {/* Tổng đặt */}
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <div
                      style={{
                        fontSize: "2.25rem",
                        fontWeight: 900,
                        color: "#0f172a",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {item.totalPreOrderQuantity}
                    </div>
                  </div>

                  {/* Cột Cần Nấu */}
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <div
                      style={{
                        fontSize: "2.25rem", // Tăng size một chút cho nổi bật
                        fontWeight: 900,
                        color: "#059669",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {item.mustCookQuantity}
                    </div>
                  </div>
                  {/* Cột Đang Nấu */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1rem" }}>
                    <div
                      style={{
                        fontSize: "2.25rem",
                        fontWeight: 900,
                        color: "#f97316",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {item.cookingQuantity}
                    </div>
                    <button
                      className={styles.btnPrimary}
                      onClick={() => handleStartCooking(item.itemId)}
                      disabled={item.mustCookQuantity <= 0}
                      style={{
                        width: "40px",
                        height: "40px",
                        padding: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        opacity: item.mustCookQuantity <= 0 ? 0.5 : 1,
                        cursor: item.mustCookQuantity <= 0 ? "not-allowed" : "pointer",
                        background: item.mustCookQuantity <= 0 ? "#f1f5f9" : "#3b82f6",
                        color: item.mustCookQuantity <= 0 ? "#cbd5e1" : "#fff",
                        boxShadow: item.mustCookQuantity <= 0
                          ? "none"
                          : "0 4px 12px rgba(59,130,246,0.3)",
                        border: "none",
                        borderRadius: "8px",
                      }}
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                  
                  {/* Sẵn sàng */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1rem" }}>
                    <div
                      style={{
                        fontSize: "2.25rem",
                        fontWeight: 900,
                        color: "#3b82f6",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {item.readyServeQuantity}
                    </div>
                    <button
                      className={styles.btnPrimary}
                      onClick={() => handleMarkReady(item.itemId)}
                      disabled={item.cookingQuantity <= 0}
                      style={{
                        width: "40px",
                        height: "40px",
                        padding: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        opacity: item.cookingQuantity <= 0 ? 0.5 : 1,
                        cursor: item.cookingQuantity <= 0 ? "not-allowed" : "pointer",
                        background: item.cookingQuantity <= 0 ? "#f8fafc" : "#f8fafc",
                        color: item.cookingQuantity <= 0 ? "#cbd5e1" : "#94a3b8",
                        border: "1px solid #e2e8f0",
                        boxShadow: "none",
                        borderRadius: "8px",
                      }}
                    >
                      <Check size={20} />
                    </button>
                  </div>
                  
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}