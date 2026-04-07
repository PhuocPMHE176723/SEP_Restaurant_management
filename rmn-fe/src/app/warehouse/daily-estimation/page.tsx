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
  const [isEditing, setIsEditing] = useState<number | null>(null); // ingredientId
  const [editValue, setEditValue] = useState<string>("");
  const [editNote, setEditNote] = useState<string>("");

  useEffect(() => {
    fetchData();
  }, [date]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch current allocations for the date
      const allocResp = await fetch(`/api/DailyEstimation?date=${date}`);
      const allocData = await allocResp.json();
      
      // Fetch all ingredients for selection
      const ingResp = await fetch("/api/Ingredient");
      const ingData = await ingResp.json();

      if (allocData.success) {
        setAllocations(allocData.data);
      }
      if (ingData.success) {
        setIngredients(ingData.data.filter((i: any) => i.isActive));
      }
    } catch (error) {
      toast.error("Không thể tải dữ liệu định lượng");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (ingredientId: number) => {
    try {
      const resp = await fetch("/api/DailyEstimation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: date,
          ingredientId: ingredientId,
          allocatedQuantity: parseFloat(editValue) || 0,
          note: editNote
        })
      });
      const data = await resp.json();
      if (data.success) {
        toast.success("Đã cập nhật định lượng");
        setIsEditing(null);
        fetchData();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Lỗi khi lưu dữ liệu");
    }
  };

  const filteredAllocations = useMemo(() => {
    return allocations.filter(a => 
      a.ingredientName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allocations, searchTerm]);

  const unallocatedIngredients = useMemo(() => {
    const allocatedIds = new Set(allocations.map(a => a.ingredientId));
    return ingredients.filter(i => !allocatedIds.has(i.ingredientId));
  }, [ingredients, allocations]);

  return (
    <div className={styles.pageContainer}>
      <header className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Định lượng Nguyên liệu theo Ngày</h1>
          <p className={styles.pageSubtitle}>Quản lý lượng cốt liệu chuẩn bị sẵn cho bếp và theo dõi tiêu thụ thực tế.</p>
        </div>
        <div className={localStyles.headerActions}>
           <div className={localStyles.datePickerWrapper}>
              <Calendar size={18} />
              <input 
                type="date" 
                value={date} 
                onChange={(e) => setDate(e.target.value)}
                className={localStyles.dateInput}
              />
           </div>
        </div>
      </header>

      <section className={localStyles.statsGrid}>
        <div className={localStyles.statCard}>
          <Package className={localStyles.statIcon} />
          <div className={localStyles.statInfo}>
             <span className={localStyles.statLabel}>Nguyên liệu đã định lượng</span>
             <span className={localStyles.statValue}>{allocations.length}</span>
          </div>
        </div>
        <div className={localStyles.statCard}>
          <TrendingUp className={localStyles.statIcon} style={{ color: '#10b981' }} />
          <div className={localStyles.statInfo}>
             <span className={localStyles.statLabel}>Tổng tiêu thụ thực tế</span>
             <span className={localStyles.statValue}>
                {allocations.reduce((sum, a) => sum + a.actuallyUsedQuantity, 0).toFixed(1)} đơn vị
             </span>
          </div>
        </div>
        <div className={localStyles.statCard}>
          <AlertTriangle className={localStyles.statIcon} style={{ color: '#f59e0b' }} />
          <div className={localStyles.statInfo}>
             <span className={localStyles.statLabel}>Vượt định mức</span>
             <span className={localStyles.statValue}>
                {allocations.filter(a => a.actuallyUsedQuantity > a.allocatedQuantity).length}
             </span>
          </div>
        </div>
      </section>

      <div className={styles.tableCard}>
        <div className={styles.tableActions}>
          <div className={styles.searchWrapper}>
            <Search size={18} />
            <input 
              type="text" 
              placeholder="Tìm nguyên liệu..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.tableResponsive}>
          <table className={styles.table}>
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
              {filteredAllocations.map((a) => (
                <tr key={a.id} className={a.status === "OVER_LIMIT" ? localStyles.rowOverLimit : ""}>
                  <td><strong>{a.ingredientName}</strong></td>
                  <td><span className={localStyles.unitBadge}>{a.unit}</span></td>
                  <td>
                    {isEditing === a.ingredientId ? (
                      <input 
                        type="number" 
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className={localStyles.editInput}
                      />
                    ) : (
                      <span className={localStyles.allocatedValue}>{a.allocatedQuantity}</span>
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
                    <span className={a.actuallyUsedQuantity > a.allocatedQuantity ? localStyles.diffNegative : localStyles.diffPositive}>
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
              {unallocatedIngredients.length > 0 && (
                <tr className={localStyles.dividerRow}>
                  <td colSpan={7}>Nguyên liệu chưa được định lượng</td>
                </tr>
              )}
              {unallocatedIngredients.map(i => (
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
      </div>
    </div>
  );
}
