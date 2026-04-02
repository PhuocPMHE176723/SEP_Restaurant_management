"use client";

import { useState, useEffect } from "react";
import { diningTableApi } from "../../../lib/api/dining-table";
import { orderApi } from "../../../lib/api/order";
import { showSuccess, showError } from "../../../lib/ui/alerts";
import { isValidVNPhone } from "../../../lib/validation";
import Pagination from "../../../components/Pagination";
import styles from "../../manager/manager.module.css";
import { User, Phone, Users, MessageSquare, PlusCircle } from "lucide-react";

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

  const handleAutoCheckin = async () => {
    if (!customer.name.trim()) {
      showError("Lỗi", "Vui lòng nhập tên khách hàng");
      return;
    }

    if (!isValidVNPhone(customer.phone)) {
      showError("Lỗi", "Số điện thoại không hợp lệ. Vui lòng nhập đúng định dạng Việt Nam (ví dụ: 0912345678)");
      return;
    }

    const suitableTables = tables
      .filter((t) => t.status === "AVAILABLE" && t.capacity >= customer.partySize)
      .sort((a, b) => a.capacity - b.capacity || a.tableCode.localeCompare(b.tableCode));

    if (suitableTables.length === 0) {
      showError("Lỗi", "Hiện tại không có bàn trống nào đủ cho " + customer.partySize + " người.");
      return;
    }

    const targetTable = suitableTables[0];
    await handleAssignTable(targetTable.tableId);
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
      showSuccess("Thành công", "Đã gán bàn và mở order thành công!");
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
            <div style={{ 
              background: 'white', 
              padding: '0.5rem', 
              borderRadius: '0.5rem', 
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              color: '#3b82f6'
            }}>
              <PlusCircle size={20} />
            </div>
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
              <select
                className={styles.select}
                value={customer.partySize}
                onChange={(e) => setCustomer((prev) => ({ ...prev, partySize: parseInt(e.target.value) }))}
                style={{ borderRadius: '0.75rem' }}
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((num) => (
                  <option key={num} value={num}>{num} người</option>
                ))}
              </select>
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
                  background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                  boxShadow: '0 10px 15px -3px rgba(249, 115, 22, 0.3)',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                onClick={handleAutoCheckin}
              >
                Gán bàn và Check-in
              </button>
              <p style={{ 
                fontSize: '0.7rem', 
                color: '#94a3b8', 
                textAlign: 'center', 
                marginTop: '1rem',
                fontStyle: 'italic',
                lineHeight: 1.4
              }}>
                Hệ thống sẽ tự động tìm bàn phù hợp nhất cho {customer.partySize} khách
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
                        border: isSelectable ? '2px solid #e2e8f0' : '2px solid transparent',
                        backgroundColor: isAvailable ? '#f0fdf4' : '#fff1f2',
                        transition: 'all 0.2s ease'
                      }}
                    >
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
                      ) : !canFit ? (
                        <div style={{ color: '#991b1b', fontSize: '0.75rem', fontWeight: 600 }}>⚠️ Không đủ chỗ</div>
                      ) : (
                        <div style={{ color: '#16a34a', fontSize: '0.75rem', fontWeight: 700 }}>Nhấp để gán bàn →</div>
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
