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

export default function CheckinPage() {
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
    return <div className="spinner" />;
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
          Check-in khách đặt bàn và gán bàn phù hợp
        </p>
      </div>

      <div className={styles.controlBar}>
        <div className={styles.inputGroup}>
          <label>Ngày</label>
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
        style={{ gridTemplateColumns: "1fr 1fr", gap: "2rem" }}
      >
        {/* Reservations to check-in */}
        <div className={styles.card}>
          <h3>Đặt bàn cần Check-in</h3>
          {confirmedReservations.length === 0 ? (
            <p className={styles.emptyState}>
              Không có đặt bàn nào cần check-in
            </p>
          ) : (
            <div className={styles.itemList}>
              {confirmedReservations.map((reservation) => (
                <div
                  key={reservation.reservationId}
                  className={styles.listItem}
                >
                  <div>
                    <h4>{reservation.customerName}</h4>
                    <p>{reservation.customerPhone}</p>
                    <p>
                      {reservation.partySize} khách -{" "}
                      {new Date(reservation.reservedAt).toLocaleTimeString(
                        "vi-VN",
                      )}
                    </p>
                    {reservation.note && (
                      <p className={styles.note}>{reservation.note}</p>
                    )}
                  </div>
                  <div className={styles.itemActions}>
                    {availableTables.map(
                      (table) =>
                        table.capacity >= reservation.partySize && (
                          <button
                            key={table.tableId}
                            className={`btn btn-sm btn-outline ${styles.checkInBtn}`}
                            onClick={() =>
                              handleCheckin(
                                reservation.reservationId,
                                table.tableId,
                              )
                            }
                          >
                            → {table.tableName}
                          </button>
                        ),
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Available tables */}
        <div className={styles.card}>
          <h3>Bàn có thể sử dụng</h3>
          <div className={styles.tableGrid}>
            {availableTables.map((table) => (
              <div
                key={table.tableId}
                className={`${styles.tableCard} ${styles.available}`}
              >
                <h4>{table.tableName}</h4>
                <p>{table.capacity} chỗ</p>
                <span className={styles.status}>Trống</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
