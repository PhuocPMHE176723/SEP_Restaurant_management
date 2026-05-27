"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "../../kitchen/Kitchen.module.css";
import { servingApi, type ServingItem, type ServingTable } from "../../../lib/api/serving";
import { showError, showSuccess } from "../../../lib/ui/alerts";
import {
  Search,
  ChefHat,
  CheckCircle2,
  ArrowRightLeft,
  Clock,
  Hourglass,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Volume2,
  VolumeX,
  Undo2,
  Package
} from "lucide-react";

export default function ServingListPage() {
  const [servingList, setServingList] = useState<ServingItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<ServingItem | null>(null);
  const [tables, setTables] = useState<ServingTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [reassignTargetOrderId, setReassignTargetOrderId] = useState<number | null>(null);
  const [expandedCards, setExpandedCards] = useState<Record<number, boolean>>({});
  const [activeTab, setActiveTab] = useState<"READY" | "PROCESSED">("PROCESSED");

  useEffect(() => {
    fetchServingList();

    const interval = setInterval(() => {
      fetchServingList();
      if (selectedItem) {
        fetchTables(selectedItem.itemId);
      }
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedItem) {
      fetchTables(selectedItem.itemId);
    }
  }, [selectedItem?.itemId]);

  const fetchServingList = async () => {
    try {
      const data = await servingApi.getServingList();
      setServingList(data);

      if (!selectedItem && data.length > 0) {
        setSelectedItem(data[0]);
        await fetchTables(data[0].itemId);
      } else if (selectedItem) {
        const updatedSelected = data.find(x => x.itemId === selectedItem.itemId) || null;
        setSelectedItem(updatedSelected);
      }
    } catch (error) {
      console.error(error);
      showError("Không thể tải danh sách phục vụ");
    } finally {
      setLoading(false);
    }
  };

  const fetchTables = async (itemId: number) => {
    try {
      const data = await servingApi.getServingTables(itemId);
      setTables(data);
    } catch (error) {
      console.error(error);
      showError("Không thể tải danh sách bàn");
    }
  };

  const handleSelectItem = async (item: ServingItem) => {
    setSelectedItem(item);
    setReassignTargetOrderId(null);
    await fetchTables(item.itemId);
  };

  const handleServe = async (orderId: number) => {
    if (!selectedItem) return;

    try {
      await servingApi.serveReadyItem(selectedItem.itemId, orderId, 1);
      showSuccess("Đã xác nhận bế món");
      await fetchServingList();
      await fetchTables(selectedItem.itemId);
    } catch (error) {
      console.error(error);
      showError("Không thể xác nhận bế món");
    }
  };

  const handleReassign = async (fromOrderId: number) => {
    if (!selectedItem || !reassignTargetOrderId) {
      showError("Vui lòng chọn bàn đích");
      return;
    }

    try {
      await servingApi.reassignReadyItem(
        selectedItem.itemId,
        fromOrderId,
        reassignTargetOrderId,
        1
      );
      showSuccess("Đã chuyển món sang bàn khác");
      setReassignTargetOrderId(null);
      await fetchServingList();
      await fetchTables(selectedItem.itemId);
    } catch (error) {
      console.error(error);
      showError("Không thể chuyển món");
    }
  };

  // Tính toán số lượng của từng nhóm phục vụ cho hiển thị Badge trên Tab
  const tabCounts = useMemo(() => {
    const ready = servingList.filter(item => item.itemType === "READY").length;
    const cook = servingList.filter(item => item.itemType !== "READY").length;
    return { ready, cook };
  }, [servingList]);

  // Bộ lọc danh sách dựa theo Tab đang chọn và từ khóa tìm kiếm
  const filteredServingList = useMemo(() => {
    let list = servingList.filter(item => {
      if (activeTab === "READY") {
        return item.itemType === "READY";
      } else {
        return item.itemType !== "READY";
      }
    });

    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return list;

    return list.filter(item =>
      item.itemName.toLowerCase().includes(keyword) ||
      (item.unit || "").toLowerCase().includes(keyword)
    );
  }, [servingList, activeTab, searchTerm]);

  // Khi thay đổi Tab, tự động chọn món ăn đầu tiên của tab đó để tránh trống màn hình điều phối
  const handleTabChange = (tab: "READY" | "PROCESSED") => {
    setActiveTab(tab);
    const firstItemInTab = servingList.find(item => 
      tab === "READY" ? item.itemType === "READY" : item.itemType !== "READY"
    );
    if (firstItemInTab) {
      setSelectedItem(firstItemInTab);
      setTables(firstItemInTab.itemId === selectedItem?.itemId ? tables : []);
    } else {
      setSelectedItem(null);
      setTables([]);
    }
  };
  

  const formatLastUpdated = (value?: string | null) => {
    if (!value) return "Chưa cập nhật";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Chưa cập nhật";

    const diffMs = Date.now() - date.getTime();
    const diffMin = Math.max(1, Math.floor(diffMs / 60000));

    if (diffMin < 60) return `${diffMin} phút trước`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour} giờ trước`;
    return `${Math.floor(diffHour / 24)} ngày trước`;
  };
  const toggleCardExpand = (orderId: number) => {
    setExpandedCards(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };
  const getElapsedMinutes = (openedAt?: string | null) => {
    if (!openedAt) return 0;
    const date = new Date(openedAt);
    if (Number.isNaN(date.getTime())) return 0;
    return Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
  };
  const getChipStyles = (name: string) => {
    const upper = name.toUpperCase().trim();
    if (upper.includes("VIP")) {
      return {
        bg: "#fffbeb",
        color: "#b45309",
        border: "1px solid #fde68a",
        label: "VIP",
        iconColor: "#f59e0b"
      };
    } else if (upper.includes("T2") || upper.startsWith("2")) {
      return {
        bg: "#faf5ff",
        color: "#6d28d9",
        border: "1px solid #e9d5ff",
        label: "Tầng 2",
        iconColor: "#8b5cf6"
      };
    } else {
      return {
        bg: "#f0f9ff",
        color: "#0369a1",
        border: "1px solid #bae6fd",
        label: "Tầng 1",
        iconColor: "#0ea5e9"
      };
    }
  };

  if (loading) return <div className={styles.spinner} />;


  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        padding: "1rem",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "420px 1fr",
          gap: "1rem",
          minHeight: "calc(100vh - 2rem)",
        }}
      >
        <div className={styles.card} style={{ padding: "1rem", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
            <h1 className={styles.pageTitle} style={{ marginBottom: 0, fontSize: "1.9rem" }}>
              Danh sách chờ bế
            </h1>
            <div
              style={{
                background: "#d1fae5",
                color: "#059669",
                padding: "0.35rem 0.8rem",
                borderRadius: "999px",
                fontWeight: 800,
                fontSize: "0.85rem",
              }}
            >
              {servingList.length} món mới
            </div>
          </div>

          <div style={{ position: "relative", marginBottom: "1rem" }}>
            <Search
              size={18}
              style={{
                position: "absolute",
                top: "50%",
                left: "12px",
                transform: "translateY(-50%)",
                color: "#94a3b8",
              }}
            />
            <input
              className={styles.input}
              style={{ paddingLeft: "40px" }}
              placeholder="Tìm món..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {/* THANH ĐIỀU HƯỚNG TABS: ĐỒ SẴN VS ĐỒ PHẢI NẤU */}
          <div 
            style={{ 
              display: "flex", 
              background: "#f1f5f9", 
              padding: "0.25rem", 
              borderRadius: "1rem", 
              gap: "0.25rem",
              marginBottom: "1rem"
            }}
          >
            {/* TAB: ĐỒ SẴN */}
            <button
              onClick={() => handleTabChange("READY")}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                padding: "0.75rem 1rem",
                borderRadius: "0.85rem",
                border: "none",
                fontWeight: 800,
                fontSize: "0.95rem",
                cursor: "pointer",
                transition: "all 0.2s",
                background: activeTab === "READY" ? "#fff" : "transparent",
                color: activeTab === "READY" ? "#fb7a2a" : "#64748b",
                boxShadow: activeTab === "READY" ? "0 4px 12px rgba(0, 0, 0, 0.05)" : "none"
              }}
            >
              <Package size={18} />
              <span>Đồ sẵn</span>
              <span 
                style={{ 
                  fontSize: "0.75rem", 
                  background: activeTab === "READY" ? "#ffedd5" : "#e2e8f0", 
                  color: activeTab === "READY" ? "#ea580c" : "#475569", 
                  padding: "0.15rem 0.45rem", 
                  borderRadius: "999px",
                  fontWeight: 900
                }}
              >
                {tabCounts.ready}
              </span>
            </button>

            {/* TAB: ĐỒ PHẢI NẤU */}
            <button
              onClick={() => handleTabChange("PROCESSED")}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                padding: "0.75rem 1rem",
                borderRadius: "0.85rem",
                border: "none",
                fontWeight: 800,
                fontSize: "0.95rem",
                cursor: "pointer",
                transition: "all 0.2s",
                background: activeTab === "PROCESSED" ? "#fff" : "transparent",
                color: activeTab === "PROCESSED" ? "#fb7a2a" : "#64748b",
                boxShadow: activeTab === "PROCESSED" ? "0 4px 12px rgba(0, 0, 0, 0.05)" : "none"
              }}
            >
              <ChefHat size={18} />
              <span>Đồ phải nấu</span>
              <span 
                style={{ 
                  fontSize: "0.75rem", 
                  background: activeTab === "PROCESSED" ? "#ffedd5" : "#e2e8f0", 
                  color: activeTab === "PROCESSED" ? "#ea580c" : "#475569", 
                  padding: "0.15rem 0.45rem", 
                  borderRadius: "999px",
                  fontWeight: 900
                }}
              >
                {tabCounts.cook}
              </span>
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem", overflowY: "auto", paddingRight: "0.25rem" }}>
            {filteredServingList.length === 0 ? (
              <div style={{ textAlign: "center", color: "#94a3b8", padding: "3rem 1rem" }}>
                Không có món nào đang chờ phục vụ
              </div>
            ) : (
              filteredServingList.map((item) => {
                const active = selectedItem?.itemId === item.itemId;
                const imageUrl =
                  item.thumbnail && item.thumbnail.trim() !== ""
                    ? item.thumbnail
                    : "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=600&auto=format&fit=crop";
                if (item.itemType === "READY") {
                  return (
                    <button
                      key={item.itemId}
                      onClick={() => handleSelectItem(item)}
                      style={{
                        width: "100%",
                        border: active ? "2px solid #fb923c" : "1px solid #e5e7eb",
                        background: "#f8f8f8",
                        borderRadius: "2rem",
                        padding: "1rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "1rem",
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "all 0.2s ease",
                      }}
                    >
                      {/* LEFT */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "1rem",
                          flex: 1,
                          minWidth: 0,
                        }}
                      >
                        <img
                          src={imageUrl}
                          alt={item.itemName}
                          style={{
                            width: "72px",
                            height: "72px",
                            borderRadius: "1.2rem",
                            objectFit: "cover",
                            flexShrink: 0,
                          }}
                        />

                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.35rem",
                            minWidth: 0,
                          }}
                        >
                          {/* NAME */}
                          <div
                            style={{
                              fontSize: "1.45rem",
                              fontWeight: 900,
                              color: "#111827",
                              textTransform: "uppercase",
                              lineHeight: 1.1,
                            }}
                          >
                            {item.itemName}
                          </div>

                          {/* BADGE */}
                          <div
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.4rem",
                              background: "#dbeafe",
                              color: "#2563eb",
                              borderRadius: "999px",
                              padding: "0.3rem 0.7rem",
                              fontSize: "0.8rem",
                              fontWeight: 700,
                              width: "fit-content",
                            }}
                          >
                            Đồ sẵn
                          </div>

                          {/* STOCK */}
                          <div
                            style={{
                              fontSize: "1rem",
                              fontWeight: 700,
                              color: "#374151",
                            }}
                          >
                            📦 Tồn: {item.stock} {item.unit || ""}
                          </div>
                        </div>
                      </div>

                      {/* RIGHT */}
                      <div
                        style={{
                          width: "90px",
                          minWidth: "90px",
                          height: "90px",
                          borderRadius: "1.7rem",
                          background: "#f1f5f9",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "0.72rem",
                            fontWeight: 800,
                            color: "#94a3b8",
                            textTransform: "uppercase",
                            marginBottom: "0.25rem",
                          }}
                        >
                          Chờ xuất
                        </div>

                        <div
                          style={{
                            fontSize: "2rem",
                            fontWeight: 900,
                            color: "#0f172a",
                            lineHeight: 1,
                          }}
                        >
                          {item.readyQuantity}
                        </div>
                      </div>
                    </button>
                  );
                }
                return (
                  <button
                    key={item.itemId}
                    onClick={() => handleSelectItem(item)}
                    style={{
                      border: active ? "2px solid #f97316" : "1px solid #e5e7eb",
                      background: "#fff",
                      borderRadius: "2rem",
                      padding: "1rem",
                      display: "grid",
                      gridTemplateColumns: "72px 1fr 84px",
                      gap: "1rem",
                      alignItems: "center",
                      textAlign: "left",
                      cursor: "pointer",
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
                      }}
                    />

                    <div>
                      <div
                        style={{
                          fontSize: "1rem",
                          fontWeight: 900,
                          color: "#0f172a",
                          textTransform: "uppercase",
                          lineHeight: 1.2,
                        }}
                      >
                        {item.itemName}
                      </div>
                      {/* BADGE */}
                          <div
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.4rem",
                              background: "#fef4db",
                              color: "#eb5325",
                              borderRadius: "999px",
                              padding: "0.3rem 0.7rem",
                              fontSize: "0.8rem",
                              fontWeight: 700,
                              width: "fit-content",
                            }}
                          >
                            Đồ nóng
                          </div>
                      <div
                        style={{
                          marginTop: "0.4rem",
                          fontSize: "0.8rem",
                          color: "#94a3b8",
                          display: "flex",
                          gap: "0.8rem",
                          flexWrap: "wrap",
                        }}
                      >
                        <span>📍 {item.waitingTableCount} bàn chờ</span>
                      </div>
                    </div>

                    <div
                      style={{
                        width: "84px",
                        height: "84px",
                        borderRadius: "24px",
                        background: "#f3f4f6",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#1e3a8a",
                      }}
                    >
                      <div style={{ fontSize: "0.7rem", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase" }}>
                        Sẵn sàng
                      </div>
                      <div style={{ fontSize: "2rem", fontWeight: 900, lineHeight: 1 }}>
                        {item.readyQuantity}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className={styles.card} style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          {selectedItem ? (
            <>
              <div
                style={{
                  background: "#fb7a2a",
                  color: "#fff",
                  padding: "2rem",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    display: "inline-block",
                    background: "rgba(255,255,255,0.18)",
                    padding: "0.35rem 0.8rem",
                    borderRadius: "999px",
                    fontWeight: 800,
                    fontSize: "0.82rem",
                    marginBottom: "1rem",
                  }}
                >
                  Đang xử lý điều phối
                </div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: "2.3rem",
                    lineHeight: 1,
                    fontWeight: 900,
                    textTransform: "uppercase",
                    maxWidth: "70%",
                  }}
                >
                  {selectedItem.itemName}
                </h2>
                <p style={{ marginTop: "1rem", maxWidth: "70%", fontSize: "1.05rem", opacity: 0.95 }}>
                  Giao món nhanh để đảm bảo hương vị tốt nhất cho khách hàng
                </p>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4.5 pr-1">
                {tables.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-100 rounded-[2rem] text-slate-400 p-8 shadow-sm">
                    <span className="text-5xl mb-4">🏆</span>
                    <h3 className="text-lg font-bold text-slate-700">Đã hoàn tất xuất sắc!</h3>
                    <p className="text-xs mt-1 text-slate-400">Không còn bàn nào đang chờ bế món ăn này.</p>
                  </div>
                ) : (
                  tables.map((table) => {
                    const elapsedMins = getElapsedMinutes(table.openedAt);

                    // Phân cấp mức độ khẩn cấp theo thời gian trôi qua
                    let borderStyle = "1px solid #e2e8f0";
                    let verticalBarColor = "#10b981"; // bg-emerald-500
                    let timeBadgeBg = "#e6f7f0";
                    let timeBadgeColor = "#00b074";
                    let timeBadgeBorder = "1px solid #bbf7d0";
                    let statusLabel = "Vừa gọi";

                    if (elapsedMins >= 40) {
                      borderStyle = "2px solid #fca5a5"; // Đỏ khẩn cấp
                      verticalBarColor = "#ef4444"; // bg-rose-500
                      timeBadgeBg = "#fef2f2";
                      timeBadgeColor = "#ef4444";
                      timeBadgeBorder = "1px solid #fecaca";
                      statusLabel = "QUÁ TRỄ";
                    } else if (elapsedMins >= 20) {
                      borderStyle = "1px solid #fde68a"; // Cam cảnh báo chờ lâu
                      verticalBarColor = "#ff7a22"; // bg-[#ff7a22]
                      timeBadgeBg = "#fffbeb";
                      timeBadgeColor = "#d97706";
                      timeBadgeBorder = "1px solid #fde68a";
                      statusLabel = "Chờ lâu";
                    }

                    // Tách chuỗi bàn
                    const allTableNames = table.tableNames ? table.tableNames.split(/,\s*/) : [];
                    const isMultiTable = allTableNames.length > 4;
                    const isExpanded = !!expandedCards[table.orderId];

                    // Cơ chế xử lý danh sách bàn hiển thị (Chống tràn card khi quá nhiều bàn)
                    const visibleTables = isMultiTable && !isExpanded
                      ? allTableNames.slice(0, 3)
                      : allTableNames;
                    const remainingCount = allTableNames.length - visibleTables.length;

                    // Tính tỷ lệ tiến trình phục vụ bàn
                    const progressPercent = table.orderedQuantity > 0
                      ? Math.min(100, Math.round((table.servedQuantity / table.orderedQuantity) * 100))
                      : 0;

                    return (
                      <div
                        key={table.orderId}
                        style={{
                          background: "#fff",
                          borderRadius: "2.25rem",
                          padding: "1.5rem 1.75rem 1.5rem 2.5rem",
                          border: borderStyle,
                          display: "flex",
                          flexDirection: "row",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: "1.5rem",
                          flexWrap: "wrap",
                          position: "relative",
                          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
                          overflow: "hidden",
                        }}
                      >
                        {/* 1. Dải màu đứng bên sườn trái chỉ thị khẩn cấp */}
                        <div
                          style={{
                            position: "absolute",
                            left: 0,
                            top: 0,
                            bottom: 0,
                            width: "10px",
                            background: verticalBarColor,
                          }}
                        />

                        {/* 2. CỘT TRÁI: Tên bàn (Phục vụ dạng Chip 3D độc lập bằng inline style) */}
                        <div style={{ flex: 1, minWidth: "250px", display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                            <span style={{ fontSize: "0.65rem", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                              Vị trí bế món
                            </span>
                            <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: "#cbd5e1" }} />
                            <span
                              style={{
                                fontSize: "0.75rem",
                                fontWeight: 800,
                                padding: "0.25rem 0.65rem",
                                borderRadius: "999px",
                                background: timeBadgeBg,
                                color: timeBadgeColor,
                                border: timeBadgeBorder,
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.25rem",
                              }}
                            >
                              🕒 {elapsedMins} phút trước ({statusLabel})
                            </span>
                          </div>

                          {/* Bộ Chip Bàn Vật Lý Cực Đẹp */}
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center" }}>
                            {visibleTables.map((tableName, idx) => {
                              const cleanName = tableName.replace(/^bàn\s+/i, "").trim();
                              const chip = getChipStyles(cleanName);
                              return (
                                <div
                                  key={idx}
                                  style={{
                                    background: chip.bg,
                                    color: chip.color,
                                    border: chip.border,
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "0.35rem",
                                    padding: "0.45rem 0.85rem",
                                    borderRadius: "1.1rem",
                                    fontSize: "0.85rem",
                                    fontWeight: 900,
                                    boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
                                  }}
                                >
                                  {/* Vẽ icon ghế ngồi chuẩn POS */}
                                  <svg
                                    style={{ fill: chip.iconColor, width: "14px", height: "14px", minWidth: "14px" }}
                                    viewBox="0 0 448 512"
                                  >
                                    <path d="M112 0c-17.7 0-32 14.3-32 32V256h288V32c0-17.7-14.3-32-32-32H112zM0 384c0 35.3 28.7 64 64 64H384c35.3 0 64-28.7 64-64V320H0v64zm112 96h224c8.8 0 16-7.2 16-16s-7.2-16-16-16H112c-8.8 0-16 7.2-16 16s7.2 16 16 16z" />
                                  </svg>
                                  <span>Bàn {cleanName}</span>

                                </div>
                              );
                            })}

                            {/* Nút bấm bung/gập các bàn ẩn của đoàn đông */}
                            {isMultiTable && (
                              <button
                                onClick={() => toggleCardExpand(table.orderId)}
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "0.25rem",
                                  padding: "0.45rem 0.85rem",
                                  borderRadius: "1.1rem",
                                  background: "#f0f0f8",
                                  color: "#4f46e5",
                                  fontSize: "0.75rem",
                                  fontWeight: 800,
                                  border: "1px solid #e2e8f0",
                                  cursor: "pointer",
                                }}
                              >
                                {isExpanded ? (
                                  <>
                                    <span>Thu gọn</span>
                                    <ChevronUp size={14} />
                                  </>
                                ) : (
                                  <>
                                    <span>+ {remainingCount} bàn khác</span>
                                    <ChevronDown size={14} />
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* 3. CỘT GIỮA: Chỉ số Suất chờ bế & Thanh tiến trình */}
                        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", minWidth: "220px" }}>
                          <div
                            style={{
                              background: "#f8fafc",
                              border: "1px solid #f1f5f9",
                              borderRadius: "1.5rem",
                              padding: "0.75rem 1.25rem",
                              display: "flex",
                              alignItems: "center",
                              gap: "1.25rem",
                              width: "100%",
                            }}
                          >
                            {/* Số suất cần bế */}
                            <div style={{ display: "flex", flexDirection: "column" }}>
                              <span style={{ fontSize: "0.65rem", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase" }}>Yêu cầu</span>
                              <span style={{ fontSize: "2rem", fontWeight: 950, color: "#0f172a", lineHeight: 1, marginTop: "0.15rem" }}>
                                x{table.orderedQuantity}
                              </span>
                            </div>

                            {/* Tiến độ mini bar */}
                            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", fontWeight: 850 }}>
                                <span style={{ color: "#94a3b8" }}>Đã bế:</span>
                                <span style={{ color: "#00b074", marginLeft: "auto" }}>{table.servedQuantity}/{table.orderedQuantity}</span>
                              </div>
                              <div
                                style={{
                                  width: "100%",
                                  height: "6px",
                                  borderRadius: "999px",
                                  background: "#e2e8f0",
                                  overflow: "hidden",
                                  position: "relative",
                                }}
                              >
                                <div
                                  style={{
                                    height: "100%",
                                    borderRadius: "999px",
                                    background: "#00b074",
                                    width: `${progressPercent}%`,
                                    transition: "width 0.3s ease",
                                  }}
                                />
                              </div>
                            </div>

                          </div>
                        </div>

                        {/* 4. CỘT PHẢI: Nút Xác Nhận Bế */}
                        <div style={{ display: "flex", justifyContent: "flex-end", minWidth: "150px" }}>
                          <button
                            onClick={() => handleServe(table.orderId)}
                            style={{
                              background: "#00b074",
                              border: "none",
                              borderRadius: "1.25rem",
                              padding: "0.9rem 1.5rem",
                              color: "#fff",
                              fontWeight: 800,
                              fontSize: "0.85rem",
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem",
                              cursor: "pointer",
                              boxShadow: "0 4px 6px rgba(0, 176, 116, 0.15)",
                              transition: "all 0.2s ease-in-out",
                            }}
                          >
                            <span style={{ background: "rgba(255,255,255,0.2)", borderRadius: "50%", width: "22px", height: "22px", display: "flex", alignItems: "center", justifyContent: "center", marginRight: "6px" }}>
                              <CheckCircle2 size={13} strokeWidth={3} />
                            </span>
                            <span style={{ letterSpacing: "0.02em" }}>Xác nhận bế</span>
                          </button>
                        </div>

                      </div>
                    );
                  })
                )}
              </div>
            </>
          ) : (
            <div style={{ textAlign: "center", color: "#94a3b8", padding: "5rem 1rem" }}>
              Chọn một món ở bên trái để xem chi tiết bàn
            </div>
          )}
        </div>
      </div>
    </div>
  );
}