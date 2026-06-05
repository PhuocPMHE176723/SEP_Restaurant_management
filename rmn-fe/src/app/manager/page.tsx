"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
import { getDashboardStats, type DashboardStats, type LowStockIngredient, type StaffPerformanceMetric } from "../../lib/api/admin";
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Calendar, 
  Utensils, 
  AlertTriangle, 
  Award, 
  Activity, 
  ArrowRight,
  TrendingDown,
  Layers,
  ChefHat
} from "lucide-react";
import styles from "./dashboard.module.css";

// ── Helpers ───────────────────────────────────────────────────
function formatVND(price: number): string {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);
}

function formatK(val: number): string {
  if (val >= 1000000) return (val / 1000000).toFixed(1) + "M";
  if (val >= 1000) return (val / 1000).toFixed(0) + "K";
  return val.toString();
}

// ── LineChart Component (Revenue) ──────────────────────────────
interface LineChartProps {
  data: DashboardStats["dailyRevenueChart"];
  isAdmin: boolean;
}

function LineChart({ data, isAdmin }: LineChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<SVGSVGElement | null>(null);

  if (!data || data.length === 0) {
    return <div style={{ color: "#94a3b8", fontSize: "0.875rem" }}>Không có dữ liệu doanh thu</div>;
  }

  const width = 500;
  const height = 220;
  const paddingLeft = 55;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 30;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const maxVal = Math.max(...data.map(d => d.revenue), 1000000);

  // Map points to SVG space
  const points = data.map((d, index) => {
    const x = paddingLeft + (index * chartWidth) / (data.length - 1);
    const y = paddingTop + chartHeight - (d.revenue / maxVal) * chartHeight;
    return { x, y, ...d };
  });

  const pathD = points.map((p, index) => `${index === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(" ");
  const areaD = points.length > 0 
    ? `${pathD} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${paddingTop + chartHeight} Z`
    : "";

  const themeColor = isAdmin ? "#3b82f6" : "#f97316";

  const handleMouseMove = (e: React.MouseEvent, index: number, p: typeof points[0]) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    // Calculate relative x/y inside container
    const x = p.x;
    const y = p.y;
    setHoveredIdx(index);
    setTooltipPos({ x, y });
  };

  // Convert DayOfWeek string to Vietnamese abbreviation
  const getDayLabel = (day: string, dateStr: string) => {
    const parts = dateStr.split("-");
    const formattedDate = parts.length === 3 ? `${parts[2]}/${parts[1]}` : dateStr;
    switch(day.toLowerCase()) {
      case "monday": return `T2 (${formattedDate})`;
      case "tuesday": return `T3 (${formattedDate})`;
      case "wednesday": return `T4 (${formattedDate})`;
      case "thursday": return `T5 (${formattedDate})`;
      case "friday": return `T6 (${formattedDate})`;
      case "saturday": return `T7 (${formattedDate})`;
      case "sunday": return `CN (${formattedDate})`;
      default: return formattedDate;
    }
  };

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <svg viewBox={`0 0 ${width} ${height}`} className={styles.chartSvg} ref={containerRef}>
        <defs>
          <linearGradient id={`gradient-${themeColor}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={themeColor} stopOpacity="0.25" />
            <stop offset="100%" stopColor={themeColor} stopOpacity="0.00" />
          </linearGradient>
        </defs>

        {/* Horizontal Gridlines */}
        {[0, 1, 2, 3].map((i) => {
          const y = paddingTop + i * (chartHeight / 3);
          const gridVal = maxVal - i * (maxVal / 3);
          return (
            <g key={i}>
              <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} className={styles.gridLine} />
              <text x={paddingLeft - 8} y={y + 4} textAnchor="end" className={styles.axisText}>
                {formatK(gridVal)}
              </text>
            </g>
          );
        })}

        {/* Area and Line */}
        {points.length > 1 && (
          <>
            <path d={areaD} fill={`url(#gradient-${themeColor})`} />
            <path d={pathD} fill="none" stroke={themeColor} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          </>
        )}

        {/* X Axis Labels and Interactive Points */}
        {points.map((p, index) => {
          const isHovered = hoveredIdx === index;
          return (
            <g key={index}>
              {/* Vertical dotted guide on hover */}
              {isHovered && (
                <line 
                  x1={p.x} 
                  y1={paddingTop} 
                  x2={p.x} 
                  y2={paddingTop + chartHeight} 
                  stroke={themeColor} 
                  strokeWidth="1.5" 
                  strokeDasharray="4 4" 
                  opacity="0.5" 
                />
              )}

              {/* Day Labels */}
              <text x={p.x} y={height - 8} textAnchor="middle" className={styles.axisText} style={{ fontSize: "9px" }}>
                {getDayLabel(p.dayOfWeek, p.date)}
              </text>

              {/* Data points */}
              <circle
                cx={p.x}
                cy={p.y}
                r={isHovered ? 6 : 4}
                className={styles.chartPoint}
                stroke={themeColor}
                onMouseEnter={(e) => handleMouseMove(e, index, p)}
                onMouseLeave={() => setHoveredIdx(null)}
              />
            </g>
          );
        })}
      </svg>

      {/* Floating Tooltip */}
      {hoveredIdx !== null && (
        <div 
          className={styles.tooltip}
          style={{ 
            left: `${(tooltipPos.x / width) * 100}%`, 
            top: `${(tooltipPos.y / height) * 100}%` 
          }}
        >
          <span style={{ display: "block", fontSize: "0.7rem", opacity: "0.8", marginBottom: "2px" }}>
            {data[hoveredIdx].date} ({data[hoveredIdx].dayOfWeek})
          </span>
          {formatVND(data[hoveredIdx].revenue)}
        </div>
      )}
    </div>
  );
}

// ── DoughnutChart Component (Reservations) ─────────────────────
interface DoughnutChartProps {
  data: DashboardStats["reservationStatus"];
}

function DoughnutChart({ data }: DoughnutChartProps) {
  if (!data || data.length === 0) {
    return <div style={{ color: "#94a3b8", fontSize: "0.875rem" }}>Không có dữ liệu đặt bàn</div>;
  }

  const statusMap: Record<string, { label: string; color: string }> = {
    PENDING: { label: "Chờ duyệt", color: "#f59e0b" },
    CONFIRMED: { label: "Đã duyệt", color: "#7c3aed" },
    ARRIVED: { label: "Đã đến", color: "#10b981" },
    CANCELLED: { label: "Đã hủy", color: "#ef4444" },
    COMPLETED: { label: "Hoàn thành", color: "#3b82f6" },
  };

  const total = data.reduce((sum, d) => sum + d.count, 0);

  // Doughnut dimensions
  const size = 160;
  const strokeWidth = 14;
  const radius = 50;
  const circumference = 2 * Math.PI * radius; // 314.159

  let accumPercent = 0;

  return (
    <div className={styles.doughnutContainer}>
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {total === 0 ? (
            <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#e2e8f0" strokeWidth={strokeWidth} />
          ) : (
            data.map((item, idx) => {
              const meta = statusMap[item.status.toUpperCase()] || { label: item.status, color: "#64748b" };
              const percent = item.count / total;
              const strokeDashoffset = circumference - percent * circumference;
              const angle = accumPercent * 360 - 90;
              accumPercent += percent;

              return (
                <circle
                  key={idx}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke={meta.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  transform={`rotate(${angle} ${size/2} ${size/2})`}
                  strokeLinecap="round"
                  style={{ transition: "stroke-dashoffset 0.5s ease" }}
                />
              );
            })
          )}
        </svg>

        {/* Center Text label */}
        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          lineHeight: "1.1"
        }}>
          <span style={{ fontSize: "1.5rem", fontWeight: "800", color: "#0f172a" }}>{total}</span>
          <span style={{ fontSize: "0.68rem", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", marginTop: "2px" }}>Đặt bàn</span>
        </div>
      </div>

      {/* Legends */}
      <div className={styles.doughnutLabels}>
        {data.map((item, idx) => {
          const meta = statusMap[item.status.toUpperCase()] || { label: item.status, color: "#64748b" };
          const percent = ((item.count / (total || 1)) * 100).toFixed(0);
          return (
            <div key={idx} className={styles.doughnutLabelItem}>
              <span className={styles.colorIndicator} style={{ backgroundColor: meta.color }} />
              <span style={{ flex: 1, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{meta.label}</span>
              <span style={{ fontWeight: "700", color: "#0f172a" }}>{item.count} ({percent}%)</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── HorizontalBarChart Component (Top Selling Items) ─────────
interface BarChartProps {
  data: DashboardStats["topSellers"];
}

function BarChart({ data }: BarChartProps) {
  if (!data || data.length === 0) {
    return <div style={{ color: "#94a3b8", fontSize: "0.875rem" }}>Không có dữ liệu món bán chạy</div>;
  }

  const maxQty = Math.max(...data.map(d => d.quantity), 1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", width: "100%" }}>
      {data.map((item, idx) => {
        const percent = (item.quantity / maxQty) * 100;
        return (
          <div key={idx} style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.825rem", fontWeight: "700" }}>
              <span style={{ color: "#1e293b", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", maxWidth: "70%" }}>
                {idx + 1}. {item.name}
              </span>
              <span style={{ color: "#64748b" }}>
                {item.quantity} phần <span style={{ color: "#94a3b8", fontWeight: "normal", fontSize: "0.75rem" }}>({formatVND(item.revenue)})</span>
              </span>
            </div>
            <div style={{ width: "100%", height: "10px", background: "#f1f5f9", borderRadius: "999px", overflow: "hidden" }}>
              <div 
                style={{ 
                  width: `${percent}%`, 
                  height: "100%", 
                  background: "linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)", 
                  borderRadius: "999px",
                  transition: "width 0.8s cubic-bezier(0.4, 0, 0.2, 1)" 
                }} 
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main Dashboard Page ──────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isAdmin = user?.roles.some(role => role.toLowerCase() === "admin") ?? false;

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await getDashboardStats();
        setStats(data);
      } catch (err: any) {
        console.error("Dashboard Stats Fetch Error:", err);
        setError(err.message || "Lỗi tải dữ liệu thống kê từ hệ thống.");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={`${styles.loadingSpinner} ${isAdmin ? styles.loadingSpinnerAdmin : ""}`} />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className={styles.container}>
        <div className={styles.errorState}>
          <AlertTriangle size={20} />
          {error || "Không thể khởi tạo thông số tổng quan."}
        </div>
      </div>
    );
  }

  // Calculate table occupancy percentage
  const tableOccupancyPercent = stats.totalTables > 0 
    ? Math.round((stats.occupiedTables / stats.totalTables) * 100) 
    : 0;

  return (
    <div className={styles.container}>
      {/* Welcome Header */}
      <div className={styles.welcomeSection}>
        <div className={styles.welcomeText}>
          <h1>Tổng quan hệ thống</h1>
          <p>Dữ liệu vận hành và doanh thu được cập nhật theo thời gian thực</p>
        </div>
        <div className={`${styles.roleBadge} ${isAdmin ? styles.roleBadgeAdmin : ""}`}>
          <Activity size={13} />
          {isAdmin ? "Vai trò: Admin" : "Vai trò: Manager"}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className={styles.kpiGrid}>
        {/* Card 1: Daily Revenue */}
        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIconWrapper} ${isAdmin ? styles.kpiIconWrapperBlue : ""}`}>
            <DollarSign size={22} />
          </div>
          <div className={styles.kpiMeta}>
            <span className={styles.kpiTitle}>Doanh thu hôm nay</span>
            <span className={styles.kpiValue}>{formatVND(stats.dailyRevenue)}</span>
            <span className={styles.kpiSub}>
              <span className={styles.trendUp}>↑ Live</span> từ hóa đơn thanh toán
            </span>
          </div>
        </div>

        {/* Card 2: Monthly Revenue */}
        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIconWrapper} ${styles.kpiIconWrapperGreen}`}>
            <TrendingUp size={22} />
          </div>
          <div className={styles.kpiMeta}>
            <span className={styles.kpiTitle}>Doanh thu tháng này</span>
            <span className={styles.kpiValue}>{formatVND(stats.monthlyRevenue)}</span>
            <span className={styles.kpiSub}>
              Từ 1 đầu tháng tới hiện tại
            </span>
          </div>
        </div>

        {/* Card 3: Today's Reservations */}
        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIconWrapper} ${styles.kpiIconWrapperPurple}`}>
            <Calendar size={22} />
          </div>
          <div className={styles.kpiMeta}>
            <span className={styles.kpiTitle}>Đơn đặt bàn hôm nay</span>
            <span className={styles.kpiValue}>{stats.todayReservations}</span>
            <span className={styles.kpiSub}>
              Số đặt chỗ trong ngày
            </span>
          </div>
        </div>

        {/* Card 4: Role tailored (Admin users vs Manager tables) */}
        {isAdmin ? (
          <div className={styles.kpiCard}>
            <div className={`${styles.kpiIconWrapper} ${styles.kpiIconWrapperBlue}`}>
              <Users size={22} />
            </div>
            <div className={styles.kpiMeta}>
              <span className={styles.kpiTitle}>Khách hàng tích cực</span>
              <span className={styles.kpiValue}>{stats.totalCustomers}</span>
              <span className={styles.kpiSub}>
                Tổng thành viên đăng ký
              </span>
            </div>
          </div>
        ) : (
          <div className={styles.kpiCard}>
            <div className={`${styles.kpiIconWrapper} ${isAdmin ? styles.kpiIconWrapperBlue : ""}`}>
              <Utensils size={22} />
            </div>
            <div className={styles.kpiMeta}>
              <span className={styles.kpiTitle}>Sử dụng bàn ăn</span>
              <span className={styles.kpiValue}>{stats.occupiedTables}/{stats.totalTables}</span>
              <span className={styles.kpiSub}>
                Đang sử dụng ({tableOccupancyPercent}%)
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Main Charts Grid */}
      <div className={styles.chartsGrid}>
        {/* Chart 1: Revenue Line Chart (7 Days) */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <div>
              <h3 className={styles.chartTitle}>Biểu đồ doanh thu tuần</h3>
              <span className={styles.chartSubtitle}>Doanh số 7 ngày hoạt động gần nhất</span>
            </div>
          </div>
          <div className={styles.chartBody}>
            <LineChart data={stats.dailyRevenueChart} isAdmin={isAdmin} />
          </div>
        </div>

        {/* Chart 2: Reservations Doughnut Chart */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <div>
              <h3 className={styles.chartTitle}>Cơ cấu đặt bàn</h3>
              <span className={styles.chartSubtitle}>Phân loại theo trạng thái</span>
            </div>
          </div>
          <div className={styles.chartBody}>
            <DoughnutChart data={stats.reservationStatus} />
          </div>
        </div>
      </div>

      {/* Lower widgets section */}
      <div className={styles.bottomGrid}>
        {/* Widget 1: Top Sellers (Dishes) */}
        <div className={styles.widgetCard}>
          <div className={styles.widgetHeader}>
            <h3 className={styles.widgetTitle}>Món ăn bán chạy nhất</h3>
            <span style={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: "700" }}>30 ngày qua</span>
          </div>
          <BarChart data={stats.topSellers} />
        </div>

        {/* Widget 2: Role Tailored details (Low Stock Warning for Manager vs Staff Leaderboard for Admin) */}
        {isAdmin ? (
          <div className={styles.widgetCard}>
            <div className={styles.widgetHeader}>
              <h3 className={styles.widgetTitle}>Nhân viên xuất sắc</h3>
              <span style={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: "700" }}>Xét doanh số 30 ngày</span>
            </div>
            <table className={styles.leaderboardTable}>
              <thead>
                <tr>
                  <th>Họ và tên</th>
                  <th style={{ textAlign: "center" }}>Hóa đơn</th>
                  <th style={{ textAlign: "right" }}>Tổng doanh số</th>
                </tr>
              </thead>
              <tbody>
                {stats.staffPerformance.length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{ textAlign: "center", color: "#94a3b8" }}>
                      Chưa ghi nhận hóa đơn bán hàng
                    </td>
                  </tr>
                ) : (
                  stats.staffPerformance.map((staff, idx) => (
                    <tr key={idx}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center" }}>
                          <span className={styles.staffAvatar}>
                            {staff.staffName.charAt(0).toUpperCase()}
                          </span>
                          <span style={{ fontWeight: "700", color: "#1e293b" }}>{staff.staffName}</span>
                        </div>
                      </td>
                      <td style={{ textAlign: "center", fontWeight: "700", color: "#475569" }}>
                        {staff.invoicesCount}
                      </td>
                      <td style={{ textAlign: "right", fontWeight: "800", color: "#10b981" }}>
                        {formatVND(staff.revenue)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={styles.widgetCard}>
            <div className={styles.widgetHeader}>
              <h3 className={styles.widgetTitle}>Cảnh báo tồn kho</h3>
              <span style={{ fontSize: "0.75rem", color: "#ef4444", fontWeight: "700" }}>Hạn mức &lt; 15 đơn vị</span>
            </div>
            <div className={styles.stockList}>
              {stats.lowStockIngredients.length === 0 ? (
                <div style={{ textAlign: "center", color: "#94a3b8", padding: "1.5rem 0", fontSize: "0.875rem" }}>
                  Tồn kho các nguyên liệu đang ở mức an toàn
                </div>
              ) : (
                stats.lowStockIngredients.map((ing, idx) => (
                  <div key={idx} className={styles.stockItem}>
                    <div className={styles.stockMeta}>
                      <span className={styles.stockName}>{ing.ingredientName}</span>
                      <span className={styles.stockUnit}>Đơn vị tính: {ing.unit}</span>
                    </div>
                    <div className={styles.stockValueWrapper}>
                      <span className={`${styles.stockBadge} ${ing.stock <= 5 ? styles.stockCritical : styles.stockWarning}`}>
                        Còn {ing.stock.toFixed(1)} {ing.unit}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
