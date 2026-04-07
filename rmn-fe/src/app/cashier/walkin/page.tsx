"use client";

import { useState, useEffect } from "react";
import { diningTableApi } from "../../../lib/api/dining-table";
import { orderApi } from "../../../lib/api/order";
import { showSuccess, showError } from "../../../lib/ui/alerts";
import { isValidVNPhone } from "../../../lib/validation";
import Pagination from "../../../components/Pagination";
import styles from "../../manager/manager.module.css";
import { User, Phone, Users, MessageSquare } from "lucide-react";

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

export default function CashierWalkinPage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [customer, setCustomer] = useState<Customer>({
    name: "",
    phone: "",
    partySize: 2,
    note: "",
  });
  const [selectedTableIds, setSelectedTableIds] = useState<number[]>([]);
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

  const findBestFitTables = (target: number, available: Table[]): number[] => {
    if (available.length === 0) return [];
    const sortedAvailable = [...available].sort((a, b) => b.capacity - a.capacity);
    const singleFits = sortedAvailable
      .filter(t => t.capacity >= target)
      .sort((a, b) => a.capacity - b.capacity);
    if (singleFits.length > 0) return [singleFits[0].tableId];

    let remaining = target;
    const result: number[] = [];
    for (const table of sortedAvailable) {
      if (remaining <= 0) break;
      result.push(table.tableId);
      remaining -= table.capacity;
    }
    return result;
  };

  const handleAutoCheckin = () => {
    const availableTables = tables.filter(t => t.status === "AVAILABLE");
    const totalAvailableCapacity = availableTables.reduce((sum, t) => sum + t.capacity, 0);

    if (customer.partySize > totalAvailableCapacity) {
      showError("Lỗi", "Không đủ bàn xếp cho khách");
      return;
    }

    const bestIds = findBestFitTables(customer.partySize, availableTables);
    if (bestIds.length === 0) {
      showError("Lỗi", "Không có đủ bàn trống.");
      return;
    }
    setSelectedTableIds(bestIds);
  };

  const handleCreateOrder = async () => {
    if (!customer.name.trim()) return showError("Lỗi", "Vui lòng nhập tên khách hàng");
    if (!isValidVNPhone(customer.phone)) return showError("Lỗi", "Số điện thoại không hợp lệ.");

    const availableTables = tables.filter(t => t.status === "AVAILABLE");
    const totalAvailableCapacity = availableTables.reduce((sum, t) => sum + t.capacity, 0);

    if (customer.partySize > totalAvailableCapacity) {
      showError("Lỗi", "Không đủ bàn xếp cho khách");
      return;
    }

    if (selectedTableIds.length === 0) return showError("Lỗi", "Vui lòng chọn ít nhất một bàn.");

    try {
      setLoading(true);
      await orderApi.createWalkinOrder({
        tableIds: selectedTableIds,
        name: customer.name,
        phone: customer.phone,
        partySize: customer.partySize,
        note: customer.note
      });
      setCustomer({ name: "", phone: "", partySize: 2, note: "" });
      setSelectedTableIds([]);
      await fetchTables();
      showSuccess("Thành công", "Đã gán bàn và mở order thành công!");
    } catch (error) {
      console.error("Failed to create order:", error);
      showError("Lỗi", "Gán bàn thất bại!");
    } finally {
      setLoading(false);
    }
  };

  const toggleTableSelection = (tableId: number) => {
    setSelectedTableIds(prev => 
      prev.includes(tableId) ? prev.filter(id => id !== tableId) : [...prev, tableId]
    );
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
          <p className={styles.pageSubtitle}>Quản lý gán bàn và mở order cho khách đến trực tiếp</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: "350px 1fr", gap: "2rem" }}>
        {/* Customer form - Beautified */}
        <div className={styles.card} style={{ height: 'fit-content', position: 'sticky', top: '1.5rem', overflow: 'hidden', padding: 0 }}>
          <div style={{ 
            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', 
            padding: '1.5rem', 
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>Thông tin khách hàng</h3>
          </div>

          <div style={{ padding: '1.5rem' }}>
            <div className={styles.formGroup} style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                <User size={14} /> Tên khách hàng *
              </label>
              <input
                type="text"
                className={styles.input}
                value={customer.name}
                onChange={(e) => setCustomer((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Nhập tên khách hàng"
                style={{ borderRadius: '0.75rem' }}
              />
            </div>

            <div className={styles.formGroup} style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                <Phone size={14} /> Số điện thoại *
              </label>
              <input
                type="tel"
                className={styles.input}
                value={customer.phone}
                onChange={(e) => setCustomer((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="Nhập số điện thoại"
                style={{ borderRadius: '0.75rem' }}
              />
            </div>

            <div className={styles.formGroup} style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                <Users size={14} /> Số khách
              </label>
              <input
                type="number"
                min="1"
                max="100"
                className={styles.input}
                value={customer.partySize}
                onChange={(e) => setCustomer((prev) => ({ ...prev, partySize: parseInt(e.target.value) || 1 }))}
                style={{ borderRadius: '0.75rem' }}
              />
            </div>

            <div className={styles.formGroup} style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                <MessageSquare size={14} /> Ghi chú
              </label>
              <textarea
                className={styles.textarea}
                value={customer.note}
                onChange={(e) => setCustomer((prev) => ({ ...prev, note: e.target.value }))}
                placeholder="Yêu cầu đặc biệt..."
                rows={3}
                style={{ borderRadius: '0.75rem' }}
              />
            </div>

            <div style={{ marginTop: '2rem' }}>
              <button
                className={styles.btnAdd}
                style={{ 
                    width: '100%', 
                    padding: '1.125rem', 
                    height: 'auto',
                    borderRadius: '0.875rem',
                    fontSize: '1rem',
                    fontWeight: 700,
                    textTransform: 'none',
                    background: selectedTableIds.length > 0 
                      ? 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)'
                      : 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)',
                    boxShadow: selectedTableIds.length > 0 
                      ? '0 10px 15px -3px rgba(249, 115, 22, 0.3)'
                      : 'none',
                    border: 'none',
                    color: 'white',
                    cursor: selectedTableIds.length > 0 ? 'pointer' : 'not-allowed',
                    transition: 'all 0.2s ease'
                }}
                disabled={selectedTableIds.length === 0}
                onClick={handleCreateOrder}
              >
                Gán {selectedTableIds.length > 0 ? selectedTableIds.length : ""} bàn và Check-in
              </button>

              <button
                onClick={handleAutoCheckin}
                style={{
                  width: '100%',
                  marginTop: '0.75rem',
                  padding: '0.75rem',
                  borderRadius: '0.75rem',
                  border: '1px solid #e2e8f0',
                  background: 'white',
                  color: '#1e293b',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                ✨ Tự động tìm bàn khít
              </button>

              <p style={{ 
                fontSize: '0.7rem', 
                color: '#94a3b8', 
                textAlign: 'center', 
                marginTop: '1rem',
                fontStyle: 'italic',
                lineHeight: 1.4
              }}>
                {selectedTableIds.length > 0 
                  ? `Đang chọn: ${tables.filter(t => selectedTableIds.includes(t.tableId)).map(t => t.tableName).join(", ")}`
                  : `Hệ thống sẽ tự động tìm bàn phù hợp nhất cho ${customer.partySize} khách`}
              </p>
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
                placeholder="Tìm tên bàn hoặc mã bàn..."
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
                <option value="ALL">Tất cả sức chứa</option>
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
                <option value="ALL">Tất cả trạng thái</option>
                <option value="AVAILABLE">Bàn trống</option>
                <option value="OCCUPIED">Bàn có người</option>
                <option value="RESERVED">Bàn đã đặt</option>
              </select>
            </div>
          </div>

          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', color: '#475569' }}>
            Danh sách bàn ({filteredTables.length} kết quả)
          </h3>

          {currentTables.length === 0 ? (
            <div className={styles.emptyState}>
              <p>Không tìm thấy bàn nào phù hợp với bộ lọc.</p>
            </div>
          ) : (
            <>
              <div className={styles.tableGrid} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                  {currentTables.map((table) => {
                    const isAvailable = table.status === "AVAILABLE";
                    const isSelected = selectedTableIds.includes(table.tableId);
                    const isSelectable = isAvailable;

                    return (
                      <div
                        key={table.tableId}
                        className={`${styles.tableCard} ${isAvailable ? styles.available : styles.occupied}`}
                        onClick={() => isSelectable && toggleTableSelection(table.tableId)}
                        style={{
                          opacity: isSelectable ? 1 : 0.6,
                          cursor: isSelectable ? 'pointer' : 'not-allowed',
                          padding: '1.25rem',
                          borderRadius: '0.75rem',
                          border: isSelected 
                            ? '3px solid #f97316' 
                            : isSelectable ? '2px solid #e2e8f0' : '2px solid transparent',
                          backgroundColor: isSelected ? '#fff7ed' : isAvailable ? '#f0fdf4' : '#fff1f2',
                          transform: isSelected ? 'scale(1.02)' : 'none',
                          boxShadow: isSelected ? '0 10px 15px -3px rgba(249, 115, 22, 0.2)' : 'none',
                          transition: 'all 0.2s ease',
                          position: 'relative'
                        }}
                      >
                        {isSelected && (
                          <div style={{
                            position: 'absolute',
                            top: '-8px',
                            right: '-8px',
                            background: '#f97316',
                            color: 'white',
                            borderRadius: '50%',
                            width: '24px',
                            height: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                            zIndex: 10
                          }}>
                            ✓
                          </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: isAvailable ? '#166534' : '#991b1b' }}>{table.tableName}</h4>
                          <span style={{ 
                            fontSize: '0.65rem', 
                            padding: '0.15rem 0.5rem', 
                            borderRadius: '1rem',
                            backgroundColor: isAvailable ? '#dcfce7' : '#fee2e2',
                            color: isAvailable ? '#166534' : '#991b1b',
                            fontWeight: 700
                          }}>
                            {table.status === "AVAILABLE" ? "TRỐNG" : table.status === "OCCUPIED" ? "BẬN" : "ĐÃ ĐẶT"}
                          </span>
                        </div>
                        <p style={{ margin: '0.5rem 0 0.75rem 0', color: '#64748b', fontSize: '0.9rem' }}>Sức chứa: <strong>{table.capacity}</strong> người</p>
                        
                        {!isAvailable ? (
                          <div style={{ color: '#991b1b', fontSize: '0.75rem', fontWeight: 600 }}>❌ Bàn đang bận</div>
                        ) : (
                          <div style={{ color: isSelected ? '#ea580c' : '#16a34a', fontSize: '0.75rem', fontWeight: 700 }}>
                            {isSelected ? "Đã chọn" : "Nhấp để chọn bàn →"}
                          </div>
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
