"use client";

import { useState, useEffect } from "react";
import { diningTableApi } from "../../../lib/api/dining-table";
import { orderApi } from "../../../lib/api/order";
import { showSuccess, showError } from "../../../lib/ui/alerts";
import { isValidVNPhone } from "../../../lib/validation";
import Pagination from "../../../components/Pagination";
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

export default function ReceptionistWalkinPage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [customer, setCustomer] = useState<Customer>({
    name: "",
    phone: "",
    partySize: 2,
    note: "",
  });
  const [loading, setLoading] = useState(true);
  
  // Filters and Search
  const [searchTerm, setSearchTerm] = useState("");
  const [capacityFilter, setCapacityFilter] = useState<number | "ALL">("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

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
    if (!customer.name.trim()) {
      showError("Lỗi", "Vui lòng nhập tên khách hàng");
      return;
    }

    if (!isValidVNPhone(customer.phone)) {
      showError("Lỗi", "Số điện thoại không hợp lệ. Vui lòng nhập đúng định dạng Việt Nam (ví dụ: 0912345678)");
      return;
    }

    try {
      await orderApi.createWalkinOrder({
        tableId,
        name: customer.name,
        phone: customer.phone,
        partySize: customer.partySize,
        note: customer.note
      });

      setCustomer({
        name: "",
        phone: "",
        partySize: 2,
        note: "",
      });

      await fetchTables();
      showSuccess("Thành công", "Đã gán khách vãng lai và mở order thành công!");
    } catch (error) {
      console.error("Failed to assign table:", error);
      showError("Lỗi", "Gán bàn thất bại!");
    }
  };

  // Filter logic
  const filteredTables = tables.filter(t => {
    const matchesSearch = t.tableName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         t.tableCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCapacity = capacityFilter === "ALL" || t.capacity >= (capacityFilter as number);
    const matchesStatus = statusFilter === "ALL" || t.status === statusFilter;
    
    return matchesSearch && matchesCapacity && matchesStatus;
  });

  // Pagination logic
  const totalItems = filteredTables.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentTables = filteredTables.slice(startIndex, startIndex + itemsPerPage);

  if (loading) return <div className={styles.spinner} />;

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Khách vãng lai</h1>
          <p className={styles.pageSubtitle}>Dành cho lễ tân quản lý khách đến trực tiếp không đặt trước</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: "350px 1fr", gap: "2rem" }}>
        {/* Customer form */}
        <div className={styles.card} style={{ height: 'fit-content', position: 'sticky', top: '1rem' }}>
          <h3 style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem', marginBottom: '1.5rem' }}>Tiếp nhận khách hàng</h3>
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
              <label>Số người đi cùng</label>
              <select
                className={styles.select}
                value={customer.partySize}
                onChange={(e) => setCustomer((prev) => ({ ...prev, partySize: parseInt(e.target.value) }))}
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((num) => (
                  <option key={num} value={num}>{num} khách</option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Ghi chú lễ tân</label>
              <textarea
                className={styles.textarea}
                value={customer.note}
                onChange={(e) => setCustomer((prev) => ({ ...prev, note: e.target.value }))}
                placeholder="Ghi chú thêm về yêu cầu của khách..."
                rows={4}
              />
            </div>
          </div>
        </div>

        {/* Table Selection with Search and Filters */}
        <div>
          <div className={styles.controlBar} style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div className={styles.searchBox} style={{ flex: 1, minWidth: '200px' }}>
              <input
                type="text"
                className={styles.input}
                placeholder="Tìm mã bàn hoặc tên bàn..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            
            <div className={styles.filterGroup} style={{ display: 'flex', gap: '1rem' }}>
              <select 
                className={styles.select}
                value={capacityFilter}
                onChange={(e) => {
                  setCapacityFilter(e.target.value === "ALL" ? "ALL" : parseInt(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value="ALL">Sức chứa (Tất cả)</option>
                <option value="2">&ge; 2 người</option>
                <option value="4">&ge; 4 người</option>
                <option value="6">&ge; 6 người</option>
                <option value="10">&ge; 10 người</option>
              </select>

              <select 
                className={styles.select}
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="ALL">Trạng thái (Tất cả)</option>
                <option value="AVAILABLE">Bàn đang trống</option>
                <option value="OCCUPIED">Bàn đang bận</option>
                <option value="RESERVED">Bàn đã đặt</option>
              </select>
            </div>
          </div>

          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', color: '#475569' }}>
            Sơ đồ bàn hiện tại ({filteredTables.length} kết quả)
          </h3>

          {currentTables.length === 0 ? (
            <div className={styles.emptyState}>
              <p>Không có bàn nào phù hợp với yêu cầu tìm kiếm.</p>
            </div>
          ) : (
            <>
              <div className={styles.tableGrid} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                {currentTables.map((table) => {
                  const isAvailable = table.status === "AVAILABLE";
                  const canFit = table.capacity >= customer.partySize;
                  const isSelectable = isAvailable && canFit;

                  return (
                    <div
                      key={table.tableId}
                      className={`${styles.tableCard} ${isAvailable ? styles.available : styles.occupied}`}
                      onClick={() => isSelectable && handleAssignTable(table.tableId)}
                      style={{
                        opacity: isSelectable ? 1 : 0.6,
                        cursor: isSelectable ? 'pointer' : 'not-allowed',
                        padding: '1.25rem',
                        borderRadius: '0.75rem',
                        border: isSelectable ? '2px solid #3b82f6' : '2px solid transparent',
                        backgroundColor: isAvailable ? '#f8fafc' : '#f1f5f9',
                        transition: 'all 0.2s ease',
                        boxShadow: isSelectable ? '0 4px 6px -1px rgb(0 0 0 / 0.1)' : 'none'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>{table.tableName}</h4>
                        <span style={{ 
                          fontSize: '0.65rem', 
                          padding: '0.15rem 0.5rem', 
                          borderRadius: '1rem',
                          backgroundColor: isAvailable ? '#3b82f6' : '#94a3b8',
                          color: '#fff',
                          fontWeight: 700
                        }}>
                          {table.status === "AVAILABLE" ? "TRỐNG" : table.status === "OCCUPIED" ? "BẬN" : "ĐẶT"}
                        </span>
                      </div>
                      <p style={{ margin: '0.5rem 0 0.75rem 0', color: '#64748b', fontSize: '0.9rem' }}>Sức chứa: <strong>{table.capacity}</strong> khách</p>
                      
                      {!isAvailable ? (
                        <div style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: 600 }}>🚫 Hiện không khả dụng</div>
                      ) : !canFit ? (
                        <div style={{ color: '#f59e0b', fontSize: '0.75rem', fontWeight: 600 }}>⚠️ Không đủ chỗ cho {customer.partySize} khách</div>
                      ) : (
                        <div style={{ color: '#3b82f6', fontSize: '0.75rem', fontWeight: 700 }}>Chọn bàn này →</div>
                      )}
                    </div>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <div style={{ marginTop: '2rem' }}>
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={totalItems}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
