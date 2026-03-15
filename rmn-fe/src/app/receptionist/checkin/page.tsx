"use client";

import { useState, useEffect } from "react";
import { adminReservationApi } from "../../../lib/api/admin-reservation";
import { diningTableApi } from "../../../lib/api/dining-table";
import { showSuccess, showError } from "../../../lib/ui/alerts";
import type {
  ReservationResponse,
  DiningTableResponse,
} from "../../../types/models";
import styles from "../../manager/manager.module.css";

interface Reservation {
  reservationId: number;
  customerName: string;
  customerPhone: string;
  partySize: number;
  reservedAt: string;
  status: string;
  tableId?: number;
  note?: string;
}

interface Table {
  tableId: number;
  tableCode: string;
  tableName: string;
  capacity: number;
  status: string;
}

export default function ReceptionistCheckinPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [reservationsData, tablesData] = await Promise.all([
        adminReservationApi.getAllReservations(),
        diningTableApi.getAllTables(),
      ]);

      // Filter reservations by date and status CONFIRMED
      const filteredRes = (reservationsData as any[]).filter((r) => {
        const resDate = new Date(r.reservedAt).toISOString().split("T")[0];
        return resDate === selectedDate && r.status === "CONFIRMED";
      });

      setReservations(filteredRes);
      setTables(tablesData as any);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      setLoading(false);
    }
  };

  const handleCheckin = async (reservationId: number, tableId: number) => {
    try {
      await adminReservationApi.updateReservationStatus(reservationId, {
        status: "CHECKED_IN",
        tableId: tableId,
      });

      showSuccess("Thành công", "Check-in thành công!");
      fetchData(); // Refresh data
    } catch (error) {
      console.error("Check-in failed:", error);
      showError("Lỗi", "Check-in thất bại!");
    }
  };

  if (loading) {
    return <div className={styles.spinner} />;
  }

  const confirmedReservations = reservations.filter(
    (r) => r.status === "CONFIRMED",
  );
  const availableTables = tables.filter((t) => t.status === "AVAILABLE");

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Check-in & Gán Bàn</h1>
        <p className={styles.pageSubtitle}>
          Dành cho khách đã đặt lịch trước và đến nhận bàn
        </p>
      </div>

      <div className={styles.controlBar}>
        <div className={styles.inputGroup}>
          <label>Ngày làm việc</label>
          <input
            type="date"
            className={styles.input}
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
      </div>

      <div
        className="grid"
        style={{ display: 'grid', gridTemplateColumns: "1fr 1fr", gap: "2rem" }}
      >
        {/* Reservations to check-in */}
        <div className={styles.card}>
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1.2rem' }}>Khách đến nhận bàn</h3>
          {confirmedReservations.length === 0 ? (
            <p className={styles.emptyState}>
              Không có đặt bàn nào cần check-in hôm nay
            </p>
          ) : (
            <div className={styles.itemList}>
              {confirmedReservations.map((reservation) => (
                <div
                  key={reservation.reservationId}
                  className={styles.listItem}
                  style={{ padding: '1rem', border: '1px solid #f1f5f9', borderRadius: '0.5rem', marginBottom: '1rem' }}
                >
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>{reservation.customerName}</h4>
                    <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.85rem', color: '#64748b' }}>📞 {reservation.customerPhone}</p>
                    <p style={{ margin: '0', fontSize: '0.85rem', color: '#64748b' }}>
                      👥 {reservation.partySize} khách - ⏰{" "}
                      {new Date(reservation.reservedAt).toLocaleTimeString(
                        "vi-VN",
                      )}
                    </p>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1rem', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
                    {availableTables.length === 0 ? (
                      <span style={{ fontSize: '0.75rem', color: '#dc2626' }}>Hết bàn trống</span>
                    ) : (
                      availableTables.map(
                        (table) =>
                          table.capacity >= reservation.partySize && (
                            <button
                              key={table.tableId}
                              className="btn btn-sm btn-primary"
                              style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                              onClick={() =>
                                handleCheckin(
                                  reservation.reservationId,
                                  table.tableId,
                                )
                              }
                            >
                              Gán {table.tableName}
                            </button>
                          ),
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Available tables */}
        <div className={styles.card}>
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1.2rem' }}>Sơ đồ bàn trống</h3>
          <div className={styles.tableGrid}>
            {availableTables.length === 0 ? (
                <p className={styles.emptyState}>Không còn bàn trống</p>
            ) : (
                availableTables.map((table) => (
                <div
                    key={table.tableId}
                    className={`${styles.tableCard} ${styles.available}`}
                    style={{ padding: '1rem', border: '1px solid #10b981', background: '#f0fdf4', borderRadius: '0.5rem' }}
                >
                    <h4 style={{ margin: '0 0 0.25rem 0', color: '#065f46' }}>{table.tableName}</h4>
                    <p style={{ margin: '0', fontSize: '0.8rem', color: '#059669' }}>{table.capacity} chỗ</p>
                </div>
                ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
