"use client";

import { useState, useEffect } from "react";
import { adminReservationApi } from "../../../lib/api/admin-reservation";
import { diningTableApi } from "../../../lib/api/dining-table";
import { showSuccess, showError } from "../../../lib/ui/alerts";
import Pagination from "../../../components/Pagination";
import styles from "../../manager/manager.module.css";

interface Reservation {
  reservationId: number;
  customerName: string;
  customerPhone: string;
  partySize: number;
  reservedAt: string;
  status: string;
  tableIds?: number[];
  note?: string;
}

interface Table {
  tableId: number;
  tableCode: string;
  tableName: string;
  capacity: number;
  status: string;
}

export default function CheckinPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedReservationId, setSelectedReservationId] = useState<number | null>(null);
  
  // Pagination for reservations
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const isCheckinTimeValid = (reservedAt: string) => {
    const reservedTime = new Date(reservedAt).getTime();
    const now = new Date().getTime();
    const diffMinutes = Math.abs(now - reservedTime) / (1000 * 60);
    return diffMinutes <= 30; // Within 30 minutes (before or after)
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [reservationsData, tablesData] = await Promise.all([
        adminReservationApi.getAllReservations(selectedDate, selectedDate),
        diningTableApi.getAllTables(),
      ]);

      setReservations(reservationsData as any);
      setTables(tablesData as any);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      setLoading(false);
    }
  };

  const handleCheckin = async (reservationId: number, tableId: number) => {
    // Validate time
    const res = reservations.find(r => r.reservationId === reservationId);
    if (res && !isCheckinTimeValid(res.reservedAt)) {
      showError("Lỗi", "Chỉ có thể check-in trong khoảng 30 phút so với giờ đặt bàn.");
      return;
    }
    
    try {
      await adminReservationApi.updateReservationStatus(reservationId, {
        status: "CHECKED_IN",
        tableIds: [tableId],
      });

      showSuccess("Thành công", "Check-in thành công!");
      setSelectedReservationId(null);
      fetchData();
    } catch (error) {
      console.error("Check-in failed:", error);
      showError("Lỗi", "Check-in thất bại!");
    }
  };

  const handleAutoCheckin = async (reservation: Reservation) => {
    // Validate time
    if (!isCheckinTimeValid(reservation.reservedAt)) {
      showError("Lỗi", "Chỉ có thể check-in trong khoảng 30 phút so với giờ đặt bàn.");
      return;
    }

    const suitable = tables
      .filter((t) => t.status === "AVAILABLE" && t.capacity >= reservation.partySize)
      .sort((a, b) => a.capacity - b.capacity || a.tableCode.localeCompare(b.tableCode));

    if (suitable.length === 0) {
      showError("Lỗi", "Hiện tại không có bàn trống nào phù hợp với " + reservation.partySize + " người.");
      return;
    }

    const targetTable = suitable[0];
    await handleCheckin(reservation.reservationId, targetTable.tableId);
  };

  const filteredReservations = reservations.filter((r) => {
    const resDate = new Date(r.reservedAt).toISOString().split("T")[0];
    const matchDate = resDate === selectedDate;
    const matchStatus = r.status === "CONFIRMED";
    const matchSearch = r.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                       r.customerPhone.includes(searchTerm);
    return matchDate && matchStatus && matchSearch;
  });

  // Pagination logic
  const totalItems = filteredReservations.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const currentReservations = filteredReservations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const selectedReservation = filteredReservations.find(r => r.reservationId === selectedReservationId);
  const availableTables = tables.filter((t) => t.status === "AVAILABLE");

  const suitableTables = selectedReservation 
    ? availableTables.filter(t => t.capacity >= selectedReservation.partySize)
    : [];

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Check-in & Gán Bàn</h1>
          <p className={styles.pageSubtitle}>
            Quản lý khách đến theo lịch hẹn và gán vị trí chỗ ngồi
          </p>
        </div>
      </div>

      <div
        className={styles.filterBar}
        style={{
          display: "flex",
          gap: "1rem",
          marginBottom: "1.5rem",
          padding: "1rem",
          background: "#fff",
          borderRadius: "16px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>Ngày:</span>
          <input
            type="date"
            className={styles.input}
            style={{ width: "160px", padding: '0.5rem' }}
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>

        <div style={{ flex: 1, minWidth: '300px', position: 'relative' }}>
          <input
            type="text"
            className={styles.input}
            placeholder="Tìm theo tên khách hoặc số điện thoại..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: "100%", paddingLeft: '2.5rem', paddingRight: '1rem' }}
          />
          <svg 
            style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
          </svg>
        </div>
      </div>

      {loading ? (
        <div className={styles.spinner} />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: "1.5rem", alignItems: "start" }}>
          {/* Reservation List */}
          <div className={styles.card}>
            <div style={{ padding: '1.25rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0 }}>Lịch hẹn hôm nay ({totalItems})</h3>
            </div>
            
            <div style={{ minHeight: '400px' }}>
              {currentReservations.length === 0 ? (
                <div style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8' }}>
                  Không có khách đặt bàn nào phù hợp
                </div>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Giờ</th>
                      <th>Khách hàng</th>
                      <th>Số người</th>
                      <th className={styles.colCompact}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentReservations.map((r) => (
                      <tr 
                        key={r.reservationId} 
                        onClick={() => setSelectedReservationId(r.reservationId)}
                        style={{ 
                          cursor: 'pointer',
                          backgroundColor: selectedReservationId === r.reservationId ? '#eff6ff' : 'transparent'
                        }}
                      >
                        <td style={{ fontWeight: 700 }}>
                          {new Date(r.reservedAt).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{r.customerName}</div>
                          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{r.customerPhone}</div>
                        </td>
                        <td>{r.partySize} người</td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <button 
                              className={styles.btnPrimary} 
                              style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedReservationId(r.reservationId);
                              }}
                            >
                              Chọn bàn
                            </button>
                            <button 
                              className={styles.btnSuccess} 
                              style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAutoCheckin(r);
                              }}
                            >
                              Check-in nhanh
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {totalPages > 1 && (
              <div style={{ padding: '1rem', borderTop: '1px solid #f1f5f9' }}>
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </div>

          {/* Table Assignment Side */}
          <div style={{ position: 'sticky', top: '1.5rem' }}>
            <div className={styles.card} style={{ padding: '1.5rem' }}>
              <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>Gán bàn phục vụ</h3>
              
              {selectedReservation ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.25rem' }}>ĐANG CHỌN</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{selectedReservation.customerName}</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f97316' }}>{selectedReservation.partySize} khách</div>
                    {selectedReservation.note && (
                      <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic' }}>
                        "{selectedReservation.note}"
                      </div>
                    )}
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <label style={{ fontWeight: 700, fontSize: '0.85rem' }}>Bàn phù hợp ({suitableTables.length})</label>
                    </div>
                    
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(2, 1fr)', 
                      gap: '0.75rem',
                      maxHeight: '400px',
                      overflowY: 'auto',
                      padding: '2px'
                    }}>
                      {suitableTables.length === 0 ? (
                        <div style={{ gridColumn: 'span 2', textAlign: 'center', padding: '1.5rem', background: '#fff5f5', borderRadius: '8px', color: '#dc2626', fontSize: '0.85rem' }}>
                          Không có bàn trống đủ sức chứa ({selectedReservation.partySize} người)
                        </div>
                      ) : (
                        suitableTables.map(t => (
                          <button
                            key={t.tableId}
                            onClick={() => handleCheckin(selectedReservation.reservationId, t.tableId)}
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '0.75rem',
                              border: '1px solid #e2e8f0',
                              borderRadius: '8px',
                              background: 'white',
                              cursor: 'pointer',
                              transition: 'all 0.15s'
                            }}
                            onMouseOver={(e) => { e.currentTarget.style.borderColor = '#10b981'; e.currentTarget.style.background = '#f0fdf4'; }}
                            onMouseOut={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = 'white'; }}
                          >
                            <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>{t.tableName}</span>
                            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{t.capacity} chỗ</span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <button 
                      className={styles.btnSuccess} 
                      style={{ padding: '0.75rem', width: '100%', height: 'auto' }}
                      onClick={() => handleAutoCheckin(selectedReservation)}
                    >
                      💡 Tự động gán bàn & Check-in
                    </button>
                    <button className={styles.btnSecondary} onClick={() => setSelectedReservationId(null)}>
                      Đóng lại
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#94a3b8' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
                  Chọn một lịch đặt bàn bên trái để gán bàn
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
