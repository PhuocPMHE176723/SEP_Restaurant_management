"use client";

import { useState, useEffect } from "react";
import { diningTableApi } from "../../../lib/api/dining-table";
import styles from "../../manager/manager.module.css";

interface Table {
  tableId: number;
  tableCode: string;
  tableName: string;
  capacity: number;
  status: string;
}

interface Customer {
  name: string;
  phone: string;
  partySize: number;
  note?: string;
}

export default function WalkinPage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [customer, setCustomer] = useState<Customer>({
    name: "",
    phone: "",
    partySize: 2,
    note: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      const data = await diningTableApi.getAllTables();
      setTables(
        data.map((table) => ({
          tableId: table.tableId,
          tableCode: table.tableCode,
          tableName: table.tableName || table.tableCode,
          capacity: table.capacity,
          status: table.status,
        })),
      );
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch tables:", error);
      setLoading(false);
    }
  };

  const handleAssignTable = async (tableId: number) => {
    if (!customer.name.trim() || !customer.phone.trim()) {
      alert("Vui lòng nhập tên và số điện thoại khách hàng");
      return;
    }

    try {
      await diningTableApi.updateTable(tableId, {
        status: "OCCUPIED",
      });

      setCustomer({
        name: "",
        phone: "",
        partySize: 2,
        note: "",
      });

      await fetchTables();
      alert("Đã gán bàn thành công!");
    } catch (error) {
      console.error("Failed to assign table:", error);
      alert("Gán bàn thất bại!");
    }
  };

  const availableTables = tables.filter((t) => t.status === "AVAILABLE");

  if (loading) return <div className={styles.spinner} />;

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Khách vãng lai</h1>
          <p className={styles.pageSubtitle}>Gán bàn cho khách đến trực tiếp (không đặt trước)</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: "350px 1fr", gap: "2rem" }}>
        {/* Customer form */}
        <div className={styles.card} style={{ height: 'fit-content' }}>
          <h3 style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem', marginBottom: '1.5rem' }}>Thông tin khách hàng</h3>
          <div className={styles.modalBody} style={{ padding: 0 }}>
            <div className={styles.formGroup}>
              <label>Tên khách hàng *</label>
              <input
                type="text"
                className={styles.input}
                value={customer.name}
                onChange={(e) => setCustomer((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Nhập tên khách hàng"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Số điện thoại *</label>
              <input
                type="tel"
                className={styles.input}
                value={customer.phone}
                onChange={(e) => setCustomer((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="Nhập số điện thoại"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Số khách</label>
              <select
                className={styles.select}
                value={customer.partySize}
                onChange={(e) => setCustomer((prev) => ({ ...prev, partySize: parseInt(e.target.value) }))}
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((num) => (
                  <option key={num} value={num}>{num} người</option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Ghi chú</label>
              <textarea
                className={styles.textarea}
                value={customer.note}
                onChange={(e) => setCustomer((prev) => ({ ...prev, note: e.target.value }))}
                placeholder="Ghi chú đặc biệt"
                rows={4}
              />
            </div>
          </div>
        </div>

        {/* Available tables */}
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>
            Bàn trống hiện có ({availableTables.length})
          </h3>
          {availableTables.length === 0 ? (
            <div className={styles.emptyState}>
              <h3>Hết bàn</h3>
              <p>Tất cả bàn hiện đang được sử dụng hoặc đã đặt trước.</p>
            </div>
          ) : (
            <div className={styles.tableGrid}>
              {availableTables.map((table) => (
                <div
                  key={table.tableId}
                  className={`${styles.tableCard} ${styles.available}`}
                  onClick={() => table.capacity >= customer.partySize && handleAssignTable(table.tableId)}
                  style={{
                    opacity: table.capacity >= customer.partySize ? 1 : 0.6,
                    cursor: table.capacity >= customer.partySize ? 'pointer' : 'not-allowed'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h4 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>{table.tableName}</h4>
                    <span className={styles.badgeActive} style={{ fontSize: '0.65rem' }}>Trống</span>
                  </div>
                  <p style={{ margin: '0.5rem 0', color: '#64748b', fontWeight: 600 }}>{table.capacity} chỗ ngồi</p>
                  {table.capacity < customer.partySize ? (
                    <div style={{ color: '#dc2626', fontSize: '0.75rem', fontWeight: 700 }}>⚠️ Không đủ chỗ</div>
                  ) : (
                    <div style={{ color: '#f97316', fontSize: '0.85rem', fontWeight: 700, marginTop: '0.5rem' }}>Nhấp để gán bàn →</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
