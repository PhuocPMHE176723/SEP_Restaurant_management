"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "../../kitchen/Kitchen.module.css";
import { servingApi, type ServingItem, type ServingTable } from "../../../lib/api/serving";
import { showError, showSuccess } from "../../../lib/ui/alerts";
import { Search, ChefHat, CheckCircle2, ArrowRightLeft } from "lucide-react";

export default function ServingListPage() {
  const [servingList, setServingList] = useState<ServingItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<ServingItem | null>(null);
  const [tables, setTables] = useState<ServingTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [reassignTargetOrderId, setReassignTargetOrderId] = useState<number | null>(null);

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

  const filteredServingList = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return servingList;

    return servingList.filter(item =>
      item.itemName.toLowerCase().includes(keyword) ||
      (item.unit || "").toLowerCase().includes(keyword)
    );
  }, [servingList, searchTerm]);

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

              <div style={{ padding: "1.5rem", overflowY: "auto", flex: 1, background: "#f8fafc" }}>
                {tables.length === 0 ? (
                  <div style={{ textAlign: "center", color: "#94a3b8", padding: "4rem 1rem" }}>
                    Không có bàn nào liên quan
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {tables.map((table) => (
                      <div
                        key={table.orderId}
                        style={{
                          background: "#fff",
                          borderRadius: "1.8rem",
                          padding: "1.5rem",
                          border: table.priority ? "2px solid #10b981" : "1px solid #e5e7eb",
                          display: "grid",
                          gridTemplateColumns: "120px 1fr 200px",
                          gap: "1rem",
                          alignItems: "center",
                        }}
                      >
                        <div>
                          <div style={{ color: "#94a3b8", fontWeight: 800, fontSize: "0.78rem", textTransform: "uppercase" }}>
                            Bàn
                          </div>
                          <div style={{ fontSize: "1.65rem", fontWeight: 900, lineHeight: 1, color: "#0f172a" }}>
                            {table.tableNames}
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "#0f172a" }}>
                            x{table.orderedQuantity}
                          </div>
                          <div style={{ marginTop: "0.35rem", color: "#94a3b8", fontSize: "0.85rem" }}>
                            Đã phục vụ: {table.servedQuantity}
                          </div>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                          <button
                            className={styles.btnPrimary}
                            onClick={() => handleServe(table.orderId)}
                            style={{
                              justifyContent: "center",
                              background: "#10b981",
                              opacity: 1,
                              cursor: "pointer",
                            }}
                          >
                            <CheckCircle2 size={16} />
                            Xác nhận bế
                          </button>


                        </div>
                      </div>
                    ))}
                  </div>
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