"use client";

import { useEffect, useState, useMemo } from "react";
import { toast } from "react-hot-toast";
import { format } from "date-fns";
import { 
  Calendar, 
  Search, 
  Save, 
  History, 
  AlertTriangle, 
  CheckCircle2,
  Edit2,
  TrendingUp,
  Package
} from "lucide-react";
import styles from "../../manager/manager.module.css";
import localStyles from "./daily-estimation.module.css";
import warehouseStyles from "../warehouse.module.css";
import { 
  getIngredients, 
  getDailyAllocations, 
  upsertDailyAllocation 
} from "@/lib/api/warehouse";

interface Ingredient {
  ingredientId: number;
  ingredientName: string;
  unit: string;
}

interface DailyAllocation {
  id: number;
  ingredientId: number;
  ingredientName: string;
  unit: string;
  allocatedQuantity: number;
  actuallyUsedQuantity: number;
  adjustedQuantity: number;
  note: string;
  status: string;
}

export default function DailyEstimationPage() {
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [allocations, setAllocations] = useState<DailyAllocation[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [unallocatedPage, setUnallocatedPage] = useState(1);
  const itemsPerPage = 8;
  const [isEditing, setIsEditing] = useState<number | null>(null); // ingredientId
  const [editValue, setEditValue] = useState<string>("");
  const [editNote, setEditNote] = useState<string>("");

  useEffect(() => {
    fetchData();
  }, [date]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch data using standardized API client
      const [allocationsData, ingredientsData] = await Promise.all([
        getDailyAllocations(date),
        getIngredients()
      ]);
      
      setAllocations(allocationsData || []);
      setIngredients((ingredientsData || []).filter((i: any) => i.isActive));
    } catch (error: any) {
      toast.error(error.message || "Không thể tải dữ liệu định lượng");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (ingredientId: number) => {
    try {
      await upsertDailyAllocation({
        date: date,
        ingredientId: ingredientId,
        allocatedQuantity: parseFloat(editValue) || 0,
        note: editNote
      });
      
      toast.success("Đã cập nhật định lượng");
      setIsEditing(null);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Lỗi khi lưu dữ liệu");
    }
  };

  const filteredAllocations = useMemo(() => {
    return allocations.filter(a => 
      a.ingredientName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allocations, searchTerm]);

  const totalPages = Math.ceil(filteredAllocations.length / itemsPerPage);
  const paginatedAllocations = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAllocations.slice(start, start + itemsPerPage);
  }, [filteredAllocations, currentPage]);

  const unallocatedIngredients = useMemo(() => {
    const allocatedIds = new Set(allocations.map(a => a.ingredientId));
    return ingredients.filter(i => 
      !allocatedIds.has(i.ingredientId) && 
      i.ingredientName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [ingredients, allocations, searchTerm]);

  const totalUnallocatedPages = Math.ceil(unallocatedIngredients.length / itemsPerPage);
  const paginatedUnallocated = useMemo(() => {
    const start = (unallocatedPage - 1) * itemsPerPage;
    return unallocatedIngredients.slice(start, start + itemsPerPage);
  }, [unallocatedIngredients, unallocatedPage]);

  return (
    <div className={styles.pageContainer}>
      <header className={warehouseStyles.pageHeader}>
        <div className={warehouseStyles.titleGroup}>
          <h1 className={warehouseStyles.pageTitle}>Định lượng theo ngày</h1>
          <p className={warehouseStyles.pageSubtitle}>Quản lý lượng cốt liệu chuẩn bị sẵn cho bếp và theo dõi tiêu thụ thực tế.</p>
        </div>
        <div className={localStyles.headerActions}>
           <div className={warehouseStyles.searchGroup}>
              <Calendar size={18} />
              <input 
                type="date" 
                value={date} 
                onChange={(e) => setDate(e.target.value)}
              />
           </div>
        </div>
      </header>

      <section className={warehouseStyles.premiumStatGrid}>
        <div className={warehouseStyles.premiumStatCard}>
          <Package className={warehouseStyles.premiumStatIcon} />
          <div className={warehouseStyles.statInfo}>
             <span className={warehouseStyles.statLabel}>Nguyên liệu định lượng</span>
             <span className={warehouseStyles.statValue}>{allocations.length}</span>
          </div>
        </div>
        <div className={warehouseStyles.premiumStatCard}>
          <TrendingUp className={warehouseStyles.premiumStatIcon} style={{ color: '#059669', background: '#ecfdf5' }} />
          <div className={warehouseStyles.statInfo}>
             <span className={warehouseStyles.statLabel}>Tổng tiêu thụ thực tế</span>
             <span className={warehouseStyles.statValue}>
                {allocations.reduce((sum, a) => sum + a.actuallyUsedQuantity, 0).toFixed(1)} <small style={{ fontSize: '0.6em', opacity: 0.7 }}>đơn vị</small>
             </span>
          </div>
        </div>
        <div className={warehouseStyles.premiumStatCard}>
          <AlertTriangle className={warehouseStyles.premiumStatIcon} style={{ color: '#dc2626', background: '#fef2f2' }} />
          <div className={warehouseStyles.statInfo}>
             <span className={warehouseStyles.statLabel}>Vượt định mức</span>
             <span className={warehouseStyles.statValue}>
                {allocations.filter(a => a.actuallyUsedQuantity > a.allocatedQuantity).length}
             </span>
          </div>
        </div>
      </section>

      <div className={warehouseStyles.premiumTableCard} style={{ padding: '1.5rem' }}>
        <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className={warehouseStyles.searchGroup}>
            <Search size={20} />
            <input 
              type="text" 
              placeholder="Tìm kiếm nguyên liệu..." 
              value={searchTerm}
              onChange={(e) => { 
                setSearchTerm(e.target.value); 
                setCurrentPage(1); 
                setUnallocatedPage(1); 
              }}
            />
          </div>
        </div>

        <div className={styles.tableResponsive}>
          <table className={warehouseStyles.premiumTable}>
            <thead>
              <tr>
                <th>Nguyên liệu</th>
                <th>Đơn vị</th>
                <th>Lượng chuẩn bị (Dự tính)</th>
                <th>Thực tế sử dụng (Recipe)</th>
                <th>Chênh lệch</th>
                <th>Ghi chú</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {paginatedAllocations.map((a) => (
                <tr key={a.id} className={a.status === "OVER_LIMIT" ? localStyles.rowOverLimit : ""}>
                  <td><strong>{a.ingredientName}</strong></td>
                  <td><span className={warehouseStyles.badgeInfo}>{a.unit}</span></td>
                  <td>
                    {isEditing === a.ingredientId ? (
                      <input 
                        type="number" 
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className={localStyles.editInput}
                      />
                    ) : (
                      <span className={warehouseStyles.stockValue}>{a.allocatedQuantity}</span>
                    )}
                  </td>
                  <td>
                    <div className={localStyles.usedValueWrapper}>
                       <span>{a.actuallyUsedQuantity.toFixed(2)}</span>
                       <div className={localStyles.progressBar}>
                          <div 
                            className={localStyles.progressInner} 
                            style={{ 
                              width: `${Math.min(100, (a.actuallyUsedQuantity / (a.allocatedQuantity || 1)) * 100)}%`,
                              backgroundColor: a.actuallyUsedQuantity > a.allocatedQuantity ? '#ef4444' : '#10b981'
                            }} 
                          />
                       </div>
                    </div>
                  </td>
                  <td>
                    <span className={`${warehouseStyles.stockValue} ${a.actuallyUsedQuantity > a.allocatedQuantity ? warehouseStyles.textDanger : warehouseStyles.textSuccess}`}>
                      {(a.allocatedQuantity - a.actuallyUsedQuantity).toFixed(2)}
                    </span>
                  </td>
                  <td>
                    {isEditing === a.ingredientId ? (
                      <input 
                        type="text" 
                        value={editNote}
                        onChange={(e) => setEditNote(e.target.value)}
                        className={localStyles.editNoteInput}
                      />
                    ) : (
                      <span className={localStyles.noteText}>{a.note || "-"}</span>
                    )}
                  </td>
                  <td>
                    {isEditing === a.ingredientId ? (
                      <div className={localStyles.editActions}>
                         <button onClick={() => handleSave(a.ingredientId)} className={localStyles.saveBtn}><Save size={16} /></button>
                         <button onClick={() => setIsEditing(null)} className={localStyles.cancelBtn}>×</button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => {
                          setIsEditing(a.ingredientId);
                          setEditValue(a.allocatedQuantity.toString());
                          setEditNote(a.note || "");
                        }}
                        className={localStyles.editBtn}
                      >
                         <Edit2 size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {paginatedUnallocated.length > 0 && (
                <tr className={localStyles.dividerRow}>
                  <td colSpan={7}>Nguyên liệu chưa được định lượng</td>
                </tr>
              )}
              {paginatedUnallocated.map(i => (
                <tr key={i.ingredientId} className={localStyles.unallocatedRow}>
                   <td>{i.ingredientName}</td>
                   <td>{i.unit}</td>
                   <td>
                      {isEditing === i.ingredientId ? (
                        <input 
                          type="number" 
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className={localStyles.editInput}
                        />
                      ) : (
                         <span className={localStyles.dimText}>Chưa thiết lập</span>
                      )}
                   </td>
                   <td>0.00</td>
                   <td>-</td>
                   <td>
                      {isEditing === i.ingredientId ? (
                        <input 
                          type="text" 
                          value={editNote}
                          onChange={(e) => setEditNote(e.target.value)}
                          className={localStyles.editNoteInput}
                        />
                      ) : (
                         "-"
                      )}
                   </td>
                   <td>
                      {isEditing === i.ingredientId ? (
                        <div className={localStyles.editActions}>
                           <button onClick={() => handleSave(i.ingredientId)} className={localStyles.saveBtn}><Save size={16} /></button>
                           <button onClick={() => setIsEditing(null)} className={localStyles.cancelBtn}>×</button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => {
                            setIsEditing(i.ingredientId);
                            setEditValue("");
                            setEditNote("");
                          }}
                          className={localStyles.addBtn}
                        >
                           Thiết lập ngay
                        </button>
                      )}
                   </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {totalPages > 1 && (
          <div className={styles.pagination} style={{ padding: '1rem 0' }}>
            <div className={styles.pageInfo}>
              Hiển thị <strong>{(currentPage - 1) * itemsPerPage + 1}</strong> đến <strong>{Math.min(currentPage * itemsPerPage, filteredAllocations.length)}</strong> trong <strong>{filteredAllocations.length}</strong> kết quả
            </div>
            <div className={styles.paginationControls}>
              <button 
                className={styles.pageBtn} 
                disabled={currentPage === 1} 
                onClick={() => setCurrentPage(p => p - 1)}
              >
                Trước
              </button>
              <button 
                className={styles.pageBtn} 
                disabled={currentPage === totalPages} 
                onClick={() => setCurrentPage(p => p + 1)}
              >
                Sau
              </button>
            </div>
          </div>
        )}

        {totalUnallocatedPages > 1 && (
          <div className={styles.pagination} style={{ padding: '1rem 0', borderTop: '1px dotted #eee' }}>
            <div className={styles.pageInfo}>
              Hiển thị unallocated <strong>{(unallocatedPage - 1) * itemsPerPage + 1}</strong> đến <strong>{Math.min(unallocatedPage * itemsPerPage, unallocatedIngredients.length)}</strong> trong <strong>{unallocatedIngredients.length}</strong> kết quả
            </div>
            <div className={styles.paginationControls}>
              <button 
                className={styles.pageBtn} 
                disabled={unallocatedPage === 1} 
                onClick={() => setUnallocatedPage(p => p - 1)}
              >
                Trước
              </button>
              <button 
                className={styles.pageBtn} 
                disabled={unallocatedPage === totalUnallocatedPages} 
                onClick={() => setUnallocatedPage(p => p + 1)}
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
