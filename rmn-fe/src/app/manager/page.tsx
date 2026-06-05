"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
import { 
  getDashboardStats, 
  type DashboardStats, 
  type LowStockIngredient, 
  type StaffPerformanceMetric,
  type TodayReservationItem,
  type DiningTableStatusItem,
  type DiscountCodeStats,
  type InventoryAuditSummary
} from "../../lib/api/admin";
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
  ChefHat,
  ShoppingBag,
  Percent,
  FileText,
  Clock,
  CheckCircle2,
  Lock,
  LineChart as LineIcon,
  BarChart2 as BarIcon,
  PieChart as PieIcon
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

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return dateStr;
  }
}

// ── line chart VN Day converter ─────────────────────────────────
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
    const x = p.x;
    const y = p.y;
    setHoveredIdx(index);
    setTooltipPos({ x, y });
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

              <text x={p.x} y={height - 8} textAnchor="middle" className={styles.axisText} style={{ fontSize: "9px" }}>
                {getDayLabel(p.dayOfWeek, p.date)}
              </text>

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

// ── Dual Line Chart: Sales vs Expense (Revenue vs Restocking) ───
interface DualLineChartProps {
  data: DashboardStats["salesExpenseChart"];
}

function DualLineChart({ data }: DualLineChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<SVGSVGElement | null>(null);

  if (!data || data.length === 0) {
    return <div style={{ color: "#94a3b8", fontSize: "0.875rem" }}>Không có dữ liệu chi phí doanh thu</div>;
  }

  const width = 500;
  const height = 220;
  const paddingLeft = 55;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 30;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const maxVal = Math.max(
    ...data.map(d => d.revenue), 
    ...data.map(d => d.expense), 
    1000000
  );

  const points = data.map((d, index) => {
    const x = paddingLeft + (index * chartWidth) / (data.length - 1);
    const yRev = paddingTop + chartHeight - (d.revenue / maxVal) * chartHeight;
    const yExp = paddingTop + chartHeight - (d.expense / maxVal) * chartHeight;
    return { x, yRev, yExp, ...d };
  });

  const revPathD = points.map((p, index) => `${index === 0 ? 'M' : 'L'} ${p.x} ${p.yRev}`).join(" ");
  const expPathD = points.map((p, index) => `${index === 0 ? 'M' : 'L'} ${p.x} ${p.yExp}`).join(" ");
  const revAreaD = `${revPathD} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${paddingTop + chartHeight} Z`;

  const handleMouseMove = (e: React.MouseEvent, index: number, p: typeof points[0]) => {
    if (!containerRef.current) return;
    const x = p.x;
    const y = Math.min(p.yRev, p.yExp);
    setHoveredIdx(index);
    setTooltipPos({ x, y });
  };

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <svg viewBox={`0 0 ${width} ${height}`} className={styles.chartSvg} ref={containerRef}>
        <defs>
          <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Gridlines */}
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

        {/* Area and Paths */}
        {points.length > 1 && (
          <>
            <path d={revAreaD} fill="url(#revGrad)" />
            <path d={revPathD} fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            <path d={expPathD} fill="none" stroke="#ef4444" strokeWidth="2" strokeDasharray="4 4" strokeLinecap="round" strokeLinejoin="round" />
          </>
        )}

        {/* Guides & Points */}
        {points.map((p, index) => {
          const isHovered = hoveredIdx === index;
          return (
            <g key={index}>
              {isHovered && (
                <line x1={p.x} y1={paddingTop} x2={p.x} y2={paddingTop + chartHeight} stroke="#cbd5e1" strokeWidth="1" strokeDasharray="3 3" />
              )}
              
              <text x={p.x} y={height - 8} textAnchor="middle" className={styles.axisText} style={{ fontSize: "9px" }}>
                {getDayLabel(p.dayOfWeek, p.date)}
              </text>

              {/* Revenue circle */}
              <circle
                cx={p.x}
                cy={p.yRev}
                r={isHovered ? 5 : 3}
                className={styles.chartPoint}
                stroke="#3b82f6"
                onMouseEnter={(e) => handleMouseMove(e, index, p)}
                onMouseLeave={() => setHoveredIdx(null)}
              />

              {/* Expense circle */}
              <circle
                cx={p.x}
                cy={p.yExp}
                r={isHovered ? 5 : 3}
                className={styles.chartPoint}
                stroke="#ef4444"
                onMouseEnter={(e) => handleMouseMove(e, index, p)}
                onMouseLeave={() => setHoveredIdx(null)}
              />
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className={styles.legendRow} style={{ marginTop: "0.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
          <span className={styles.legendColor} style={{ backgroundColor: "#3b82f6" }} />
          <span>Doanh thu bán hàng</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
          <span className={styles.legendColor} style={{ borderBottom: "2px dashed #ef4444", width: "12px" }} />
          <span>Chi phí nhập kho</span>
        </div>
      </div>

      {/* Floating Tooltip */}
      {hoveredIdx !== null && (
        <div 
          className={styles.tooltip}
          style={{ 
            left: `${(tooltipPos.x / width) * 100}%`, 
            top: `${(tooltipPos.y / height) * 100}%` 
          }}
        >
          <span style={{ display: "block", fontSize: "0.7rem", opacity: "0.8", marginBottom: "3px" }}>
            {data[hoveredIdx].date} ({data[hoveredIdx].dayOfWeek})
          </span>
          <span style={{ display: "block", color: "#60a5fa" }}>DT: {formatVND(data[hoveredIdx].revenue)}</span>
          <span style={{ display: "block", color: "#f87171" }}>Chi: {formatVND(data[hoveredIdx].expense)}</span>
        </div>
      )}
    </div>
  );
}

// ── New Registrations Chart (Bar Chart) ─────────────────────────
interface RegistrationsChartProps {
  data: DashboardStats["newRegistrationsChart"];
}

function RegistrationsChart({ data }: RegistrationsChartProps) {
  if (!data || data.length === 0) {
    return <div style={{ color: "#94a3b8", fontSize: "0.875rem" }}>Không có dữ liệu thành viên mới</div>;
  }

  const width = 500;
  const height = 220;
  const paddingLeft = 40;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 30;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const maxVal = Math.max(...data.map(d => d.count), 5);

  // Bar calculations
  const barWidth = 24;
  const gap = (chartWidth - (barWidth * data.length)) / (data.length + 1);

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <svg viewBox={`0 0 ${width} ${height}`} className={styles.chartSvg}>
        {/* Gridlines */}
        {[0, 1, 2, 4].map((i) => {
          const ratio = i / 4;
          const y = paddingTop + chartHeight * (1 - ratio);
          const gridVal = Math.round(maxVal * ratio);
          return (
            <g key={i}>
              <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} className={styles.gridLine} />
              <text x={paddingLeft - 8} y={y + 4} textAnchor="end" className={styles.axisText}>
                {gridVal}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {data.map((d, index) => {
          const x = paddingLeft + gap + index * (barWidth + gap);
          const barHeight = (d.count / maxVal) * chartHeight;
          const y = paddingTop + chartHeight - barHeight;

          return (
            <g key={index}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx="4"
                fill="linear-gradient(180deg, #10b981 0%, #34d399 100%)"
                className={styles.barRect}
                style={{ fill: "#10b981" }}
              />
              <text x={x + barWidth / 2} y={y - 4} textAnchor="middle" style={{ fontSize: "9px", fontWeight: "700", fill: "#10b981" }}>
                {d.count > 0 ? d.count : ""}
              </text>
              <text x={x + barWidth / 2} y={height - 8} textAnchor="middle" className={styles.axisText} style={{ fontSize: "9px" }}>
                {getDayLabel(d.dayOfWeek, d.date).split(" ")[0]}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ── Doughnut Chart (Loyalty Tiers) ──────────────────────────────
interface LoyaltyDoughnutProps {
  data: DashboardStats["loyaltyTiers"];
}

function LoyaltyDoughnut({ data }: LoyaltyDoughnutProps) {
  if (!data || data.length === 0) {
    return <div style={{ color: "#94a3b8", fontSize: "0.875rem" }}>Không có dữ liệu hạng thành viên</div>;
  }

  const colors = ["#3b82f6", "#f59e0b", "#a855f7", "#10b981", "#64748b"];
  const total = data.reduce((sum, d) => sum + d.count, 0);

  const size = 160;
  const strokeWidth = 14;
  const radius = 50;
  const circumference = 2 * Math.PI * radius; // 314.16

  let accumPercent = 0;

  return (
    <div className={styles.doughnutContainer}>
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {total === 0 ? (
            <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#e2e8f0" strokeWidth={strokeWidth} />
          ) : (
            data.map((item, idx) => {
              const color = colors[idx % colors.length];
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
                  stroke={color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  transform={`rotate(${angle} ${size/2} ${size/2})`}
                  strokeLinecap="round"
                />
              );
            })
          )}
        </svg>

        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          textAlign: "center"
        }}>
          <span style={{ fontSize: "1.5rem", fontWeight: "800", color: "#0f172a" }}>{total}</span>
          <span style={{ display: "block", fontSize: "0.65rem", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase" }}>Thành viên</span>
        </div>
      </div>

      <div className={styles.doughnutLabels}>
        {data.map((item, idx) => {
          const color = colors[idx % colors.length];
          const percent = ((item.count / (total || 1)) * 100).toFixed(0);
          return (
            <div key={idx} className={styles.doughnutLabelItem}>
              <span className={styles.colorIndicator} style={{ backgroundColor: color }} />
              <span style={{ flex: 1, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{item.tierName}</span>
              <span style={{ fontWeight: "700", color: "#0f172a" }}>{item.count} ({percent}%)</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── DoughnutChart Component (Reservations) ─────────────────────
interface ReservationsDoughnutProps {
  data: DashboardStats["reservationStatus"];
}

function ReservationsDoughnut({ data }: ReservationsDoughnutProps) {
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
                />
              );
            })
          )}
        </svg>

        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          textAlign: "center"
        }}>
          <span style={{ fontSize: "1.5rem", fontWeight: "800", color: "#0f172a" }}>{total}</span>
          <span style={{ display: "block", fontSize: "0.65rem", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase" }}>Đặt bàn</span>
        </div>
      </div>

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
  const [view, setView] = useState<"operations" | "financial">("operations");

  useEffect(() => {
    // Admins default to financial view, Managers to operational view
    if (isAdmin) setView("financial");
  }, [isAdmin]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await getDashboardStats();
        setStats(data);
      } catch (err: any) {
        console.error("Dashboard Stats Fetch Error:", err);
        setError(err.message || "Lỗi tải dữ liệu tổng quan từ hệ thống.");
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

  return (
    <div className={styles.container}>
      {/* Header section with view toggle */}
      <div className={styles.welcomeSection}>
        <div className={styles.welcomeText}>
          <h1>Tổng quan hệ thống</h1>
          <p>
            {view === "financial" 
              ? "Báo cáo doanh thu tài chính, chi phí kho và tăng trưởng thành viên" 
              : "Dữ liệu bàn ăn, sơ đồ nhà bếp và danh sách phục vụ thời gian thực"}
          </p>
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          {isAdmin && (
            <div className={styles.viewToggleContainer}>
              <button 
                type="button" 
                className={`${styles.toggleBtn} ${view === "operations" ? styles.toggleBtnActive : ""}`}
                onClick={() => setView("operations")}
              >
                <Clock size={14} /> Vận hành
              </button>
              <button 
                type="button" 
                className={`${styles.toggleBtn} ${view === "financial" ? styles.toggleBtnActive : ""}`}
                onClick={() => setView("financial")}
              >
                <DollarSign size={14} /> Doanh thu & Tài chính
              </button>
            </div>
          )}
          
          <div className={`${styles.roleBadge} ${isAdmin ? styles.roleBadgeAdmin : ""}`}>
            <Activity size={13} />
            {isAdmin ? "Admin" : "Manager"}
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────
         VIEW 1: OPERATIONS & DAILY OPERATIONAL DASHBOARD
         ──────────────────────────────────────────────────────── */}
      {view === "operations" && (
        <>
          {/* KPI grid for Operations */}
          <div className={styles.kpiGrid}>
            {/* Card 1: Today's Revenue */}
            <div className={styles.kpiCard}>
              <div className={styles.kpiIconWrapper}>
                <DollarSign size={22} />
              </div>
              <div className={styles.kpiMeta}>
                <span className={styles.kpiTitle}>Doanh thu hôm nay</span>
                <span className={styles.kpiValue}>{formatVND(stats.dailyRevenue)}</span>
                <span className={styles.kpiSub}>
                  <span className={styles.trendUp}>↑ Live</span> thu ngân
                </span>
              </div>
            </div>

            {/* Card 2: Occupied Dining tables */}
            <div className={styles.kpiCard}>
              <div className={styles.kpiIconWrapper}>
                <Utensils size={22} />
              </div>
              <div className={styles.kpiMeta}>
                <span className={styles.kpiTitle}>Bàn ăn đang dùng</span>
                <span className={styles.kpiValue}>{stats.occupiedTables}/{stats.totalTables}</span>
                <span className={styles.kpiSub}>
                  Tỷ lệ sử dụng: {stats.totalTables > 0 ? Math.round((stats.occupiedTables/stats.totalTables)*100) : 0}%
                </span>
              </div>
            </div>

            {/* Card 3: Today's Reservations */}
            <div className={styles.kpiCard}>
              <div className={styles.kpiIconWrapper} style={{ color: "#a855f7", backgroundColor: "rgba(168,85,247,0.08)" }}>
                <Calendar size={22} />
              </div>
              <div className={styles.kpiMeta}>
                <span className={styles.kpiTitle}>Đặt bàn hôm nay</span>
                <span className={styles.kpiValue}>{stats.todayReservations}</span>
                <span className={styles.kpiSub}>
                  Đơn đặt chỗ phục vụ hôm nay
                </span>
              </div>
            </div>

            {/* Card 4: Orders in progress */}
            <div className={styles.kpiCard}>
              <div className={styles.kpiIconWrapper} style={{ color: "#10b981", backgroundColor: "rgba(16,185,129,0.08)" }}>
                <ChefHat size={22} />
              </div>
              <div className={styles.kpiMeta}>
                <span className={styles.kpiTitle}>Hóa đơn hoạt động</span>
                <span className={styles.kpiValue}>{stats.activeOrdersCount}</span>
                <span className={styles.kpiSub}>
                  Đơn hàng đang phục vụ
                </span>
              </div>
            </div>
          </div>

          {/* Charts section */}
          <div className={styles.chartsGrid}>
            <div className={styles.chartCard}>
              <div className={styles.chartHeader}>
                <div>
                  <h3 className={styles.chartTitle}>Doanh thu 7 ngày qua</h3>
                  <span className={styles.chartSubtitle}>Thống kê doanh số tuần vừa rồi</span>
                </div>
              </div>
              <div className={styles.chartBody}>
                <LineChart data={stats.dailyRevenueChart} isAdmin={false} />
              </div>
            </div>

            <div className={styles.chartCard}>
              <div className={styles.chartHeader}>
                <div>
                  <h3 className={styles.chartTitle}>Cơ cấu đặt bàn</h3>
                  <span className={styles.chartSubtitle}>Tỷ lệ trạng thái các đơn đặt</span>
                </div>
              </div>
              <div className={styles.chartBody}>
                <ReservationsDoughnut data={stats.reservationStatus} />
              </div>
            </div>
          </div>

          {/* Operational Details Grid */}
          <div className={styles.bottomGrid}>
            {/* Dining tables status grid map */}
            <div className={styles.widgetCard}>
              <div className={styles.widgetHeader}>
                <h3 className={styles.widgetTitle}>Sơ đồ trạng thái bàn</h3>
                <span style={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: "700" }}>{stats.totalTables} Bàn ăn</span>
              </div>
              <div className={styles.tableStatusGrid}>
                {stats.tableStatusList.map((t) => {
                  const isOccupied = t.status.toUpperCase() === "OCCUPIED";
                  const isReserved = t.status.toUpperCase() === "RESERVED";
                  const statusClass = isOccupied 
                    ? styles.tableStatusOccupied 
                    : isReserved 
                    ? styles.tableStatusReserved 
                    : styles.tableStatusFree;

                  return (
                    <div key={t.tableId} className={`${styles.tableGridItem} ${statusClass}`}>
                      <span className={styles.tableGridCode}>{t.tableCode}</span>
                      <span className={styles.tableGridCap}>{t.capacity} chỗ</span>
                      <span className={styles.tableGridBadge}>
                        {isOccupied ? "Đang ăn" : isReserved ? "Đặt trước" : "Bàn trống"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Today's Reservations Timeline list */}
            <div className={styles.widgetCard}>
              <div className={styles.widgetHeader}>
                <h3 className={styles.widgetTitle}>Lịch đặt bàn hôm nay</h3>
                <span style={{ fontSize: "0.75rem", color: "#f97316", fontWeight: "700" }}>{stats.todayReservationsList.length} lượt</span>
              </div>
              <div className={styles.timelineList}>
                {stats.todayReservationsList.length === 0 ? (
                  <div style={{ color: "#94a3b8", textAlign: "center", padding: "3rem 0", fontSize: "0.875rem" }}>
                    Không có lượt đặt bàn nào trong ngày hôm nay
                  </div>
                ) : (
                  stats.todayReservationsList.map((res) => (
                    <div key={res.reservationId} className={styles.timelineItem}>
                      <div className={styles.timelineMeta}>
                        <span className={styles.timelineName}>{res.customerName}</span>
                        <span className={styles.timelineCount}>{res.customerPhone} | {res.totalTables} Bàn</span>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <span className={styles.timelineTime}>{formatDate(res.reservedAt).split(" ")[0]}</span>
                        <span style={{ 
                          display: "block", 
                          fontSize: "0.68rem", 
                          fontWeight: "800",
                          color: res.status === "CONFIRMED" ? "#7c3aed" : res.status === "ARRIVED" ? "#10b981" : "#f59e0b",
                          marginTop: "2px"
                        }}>
                          {res.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className={styles.bottomGrid}>
            {/* Top dishes */}
            <div className={styles.widgetCard}>
              <div className={styles.widgetHeader}>
                <h3 className={styles.widgetTitle}>Món ăn bán chạy</h3>
                <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: "700" }}>30 ngày qua</span>
              </div>
              <BarChart data={stats.topSellers} />
            </div>

            {/* Low stock alerts */}
            <div className={styles.widgetCard}>
              <div className={styles.widgetHeader}>
                <h3 className={styles.widgetTitle}>Cảnh báo tồn kho</h3>
                <span style={{ fontSize: "0.75rem", color: "#ef4444", fontWeight: "700" }}>Tồn kho dưới 15 đơn vị</span>
              </div>
              <div className={styles.stockList}>
                {stats.lowStockIngredients.length === 0 ? (
                  <div style={{ textAlign: "center", color: "#94a3b8", padding: "2rem 0", fontSize: "0.875rem" }}>
                    Tồn kho nguyên liệu ở trạng thái an toàn
                  </div>
                ) : (
                  stats.lowStockIngredients.slice(0, 4).map((ing, idx) => (
                    <div key={idx} className={styles.stockItem}>
                      <div className={styles.stockMeta}>
                        <span className={styles.stockName}>{ing.ingredientName}</span>
                        <span className={styles.stockUnit}>ĐVT: {ing.unit}</span>
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
          </div>
        </>
      )}

      {/* ────────────────────────────────────────────────────────
         VIEW 2: FINANCIAL & ANALYTICS DASHBOARD (ADMIN DETAILED)
         ──────────────────────────────────────────────────────── */}
      {view === "financial" && (
        <>
          {/* Detailed Financial KPIs */}
          <div className={styles.kpiGrid}>
            {/* KPI 1: Total Sales revenue (30 Days) */}
            <div className={styles.kpiCard}>
              <div className={`${styles.kpiIconWrapper} ${styles.kpiIconWrapperBlue}`}>
                <DollarSign size={22} />
              </div>
              <div className={styles.kpiMeta}>
                <span className={styles.kpiTitle}>Doanh thu bán hàng</span>
                <span className={styles.kpiValue} style={{ fontSize: "1.35rem" }}>{formatVND(stats.totalSales30Days)}</span>
                <span className={styles.kpiSub}>Xét trong 30 ngày qua</span>
              </div>
            </div>

            {/* KPI 2: Total Restocking Expenses (30 Days) */}
            <div className={styles.kpiCard}>
              <div className={styles.kpiIconWrapper} style={{ color: "#ef4444", backgroundColor: "rgba(239,68,68,0.08)" }}>
                <ShoppingBag size={22} />
              </div>
              <div className={styles.kpiMeta}>
                <span className={styles.kpiTitle}>Chi phí mua hàng (Kho)</span>
                <span className={styles.kpiValue} style={{ fontSize: "1.35rem" }}>{formatVND(stats.restockingCost30Days)}</span>
                <span className={styles.kpiSub}>Phiếu nhập kho đã hoàn thành</span>
              </div>
            </div>

            {/* KPI 3: Estimated Net Profit (Revenue - Cost) */}
            <div className={styles.kpiCard}>
              <div className={styles.kpiIconWrapper} style={{ color: "#10b981", backgroundColor: "rgba(16,185,129,0.08)" }}>
                <TrendingUp size={22} />
              </div>
              <div className={styles.kpiMeta}>
                <span className={styles.kpiTitle}>Ước tính lợi nhuận ròng</span>
                <span className={styles.kpiValue} style={{ 
                  fontSize: "1.35rem", 
                  color: stats.netProfit30Days >= 0 ? "#10b981" : "#ef4444" 
                }}>
                  {formatVND(stats.netProfit30Days)}
                </span>
                <span className={styles.kpiSub}>Doanh thu - Chi phí restocking</span>
              </div>
            </div>

            {/* KPI 4: Average Order Value (AOV) */}
            <div className={styles.kpiCard}>
              <div className={styles.kpiIconWrapper} style={{ color: "#a855f7", backgroundColor: "rgba(168,85,247,0.08)" }}>
                <Layers size={22} />
              </div>
              <div className={styles.kpiMeta}>
                <span className={styles.kpiTitle}>Giá trị đơn trung bình</span>
                <span className={styles.kpiValue} style={{ fontSize: "1.35rem" }}>{formatVND(stats.aov30Days)}</span>
                <span className={styles.kpiSub}>Số tiền thu về trên mỗi hóa đơn</span>
              </div>
            </div>
          </div>

          <div className={styles.kpiGrid} style={{ marginTop: "-0.5rem" }}>
            {/* KPI 5: Total Discounts given */}
            <div className={styles.kpiCard} style={{ padding: "1rem 1.5rem" }}>
              <div className={styles.kpiIconWrapper} style={{ width: "36px", height: "36px", color: "#ea580c", backgroundColor: "rgba(234,88,12,0.08)" }}>
                <Percent size={18} />
              </div>
              <div className={styles.kpiMeta}>
                <span className={styles.kpiTitle} style={{ fontSize: "0.72rem" }}>Khuyến mãi & giảm giá</span>
                <span className={styles.kpiValue} style={{ fontSize: "1.1rem" }}>-{formatVND(stats.totalDiscounts30Days)}</span>
              </div>
            </div>

            {/* KPI 6: Total VAT Collected */}
            <div className={styles.kpiCard} style={{ padding: "1rem 1.5rem" }}>
              <div className={styles.kpiIconWrapper} style={{ width: "36px", height: "36px", color: "#64748b", backgroundColor: "rgba(100,116,139,0.08)" }}>
                <FileText size={18} />
              </div>
              <div className={styles.kpiMeta}>
                <span className={styles.kpiTitle} style={{ fontSize: "0.72rem" }}>Thuế VAT đã thu hộ</span>
                <span className={styles.kpiValue} style={{ fontSize: "1.1rem" }}>{formatVND(stats.totalVat30Days)}</span>
              </div>
            </div>

            {/* KPI 7: Registered Members */}
            <div className={styles.kpiCard} style={{ padding: "1rem 1.5rem" }}>
              <div className={styles.kpiIconWrapper} style={{ width: "36px", height: "36px", color: "#2563eb", backgroundColor: "rgba(37,99,235,0.08)" }}>
                <Users size={18} />
              </div>
              <div className={styles.kpiMeta}>
                <span className={styles.kpiTitle} style={{ fontSize: "0.72rem" }}>Khách hàng đã đăng ký</span>
                <span className={styles.kpiValue} style={{ fontSize: "1.1rem" }}>{stats.totalCustomers}</span>
              </div>
            </div>

            {/* KPI 8: Active Staffs */}
            <div className={styles.kpiCard} style={{ padding: "1rem 1.5rem" }}>
              <div className={styles.kpiIconWrapper} style={{ width: "36px", height: "36px", color: "#059669", backgroundColor: "rgba(5,150,105,0.08)" }}>
                <CheckCircle2 size={18} />
              </div>
              <div className={styles.kpiMeta}>
                <span className={styles.kpiTitle} style={{ fontSize: "0.72rem" }}>Nhân viên hoạt động</span>
                <span className={styles.kpiValue} style={{ fontSize: "1.1rem" }}>{stats.totalStaff}</span>
              </div>
            </div>
          </div>

          {/* Admin Charts Grid */}
          <div className={styles.chartsGrid}>
            {/* Sales vs Expenses chart */}
            <div className={styles.chartCard}>
              <div className={styles.chartHeader}>
                <div>
                  <h3 className={styles.chartTitle}>Cân đối doanh thu & Chi phí kho</h3>
                  <span className={styles.chartSubtitle}>So sánh doanh số bán và phí nhập kho 7 ngày gần nhất</span>
                </div>
              </div>
              <div className={styles.chartBody}>
                <DualLineChart data={stats.salesExpenseChart} />
              </div>
            </div>

            {/* Loyalty tier chart */}
            <div className={styles.chartCard}>
              <div className={styles.chartHeader}>
                <div>
                  <h3 className={styles.chartTitle}>Cơ cấu hạng thành viên</h3>
                  <span className={styles.chartSubtitle}>Phân bố xếp hạng Loyalty của khách</span>
                </div>
              </div>
              <div className={styles.chartBody}>
                <LoyaltyDoughnut data={stats.loyaltyTiers} />
              </div>
            </div>
          </div>

          <div className={styles.chartsGrid} style={{ gridTemplateColumns: "1fr 1fr" }}>
            {/* New registrations chart */}
            <div className={styles.chartCard}>
              <div className={styles.chartHeader}>
                <div>
                  <h3 className={styles.chartTitle}>Xu hướng đăng ký mới</h3>
                  <span className={styles.chartSubtitle}>Số lượng khách hàng tạo tài khoản mới trong tuần</span>
                </div>
              </div>
              <div className={styles.chartBody}>
                <RegistrationsChart data={stats.newRegistrationsChart} />
              </div>
            </div>

            {/* Financial breakdown shares */}
            <div className={styles.chartCard}>
              <div className={styles.chartHeader}>
                <h3 className={styles.chartTitle}>Phân bổ giao dịch & hình thức</h3>
              </div>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                {/* Payment method shares */}
                <div>
                  <h4 style={{ fontSize: "0.825rem", fontWeight: "800", color: "#64748b", textTransform: "uppercase", marginBottom: "0.75rem", letterSpacing: "0.03em" }}>
                    Phương thức thanh toán (30 ngày)
                  </h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {stats.paymentMethodShare.length === 0 ? (
                      <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>Chưa có thanh toán nào được ghi nhận</div>
                    ) : (
                      stats.paymentMethodShare.map((pm, idx) => {
                        const totalPay = stats.paymentMethodShare.reduce((s, p) => s + p.amount, 0) || 1;
                        const percent = (pm.amount / totalPay) * 100;
                        return (
                          <div key={idx} style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", fontWeight: "700" }}>
                              <span style={{ color: "#1e293b" }}>{pm.method}</span>
                              <span style={{ color: "#475569" }}>{formatVND(pm.amount)} ({percent.toFixed(0)}%)</span>
                            </div>
                            <div style={{ width: "100%", height: "6px", background: "#f1f5f9", borderRadius: "999px" }}>
                              <div style={{ width: `${percent}%`, height: "100%", background: "#10b981", borderRadius: "999px" }} />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <hr style={{ border: "none", borderTop: "1px solid #f1f5f9" }} />

                {/* Order type shares */}
                <div>
                  <h4 style={{ fontSize: "0.825rem", fontWeight: "800", color: "#64748b", textTransform: "uppercase", marginBottom: "0.75rem", letterSpacing: "0.03em" }}>
                    Kênh bán hàng (30 ngày)
                  </h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {stats.orderTypeShare.length === 0 ? (
                      <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>Chưa có đơn hàng nào được ghi nhận</div>
                    ) : (
                      stats.orderTypeShare.map((ot, idx) => {
                        const totalRev = stats.orderTypeShare.reduce((s, o) => s + o.revenue, 0) || 1;
                        const percent = (ot.revenue / totalRev) * 100;
                        return (
                          <div key={idx} style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", fontWeight: "700" }}>
                              <span style={{ color: "#1e293b" }}>{ot.orderType === "DINE_IN" ? "Ăn tại bàn (Dine-in)" : "Mang về (Takeaway)"}</span>
                              <span style={{ color: "#475569" }}>{formatVND(ot.revenue)} ({percent.toFixed(0)}%)</span>
                            </div>
                            <div style={{ width: "100%", height: "6px", background: "#f1f5f9", borderRadius: "999px" }}>
                              <div style={{ width: `${percent}%`, height: "100%", background: "#a855f7", borderRadius: "999px" }} />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Admin Leaderboard & System logs grid */}
          <div className={styles.bottomGrid}>
            {/* Staff sales leaderboard */}
            <div className={styles.widgetCard}>
              <div className={styles.widgetHeader}>
                <h3 className={styles.widgetTitle}>Nhân viên xuất sắc</h3>
                <span style={{ fontSize: "0.75rem", color: "#3b82f6", fontWeight: "700" }}>30 ngày qua</span>
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
                        Chưa có dữ liệu thanh toán nhân viên
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
                        <td style={{ textAlign: "right", fontWeight: "800", color: "#3b82f6" }}>
                          {formatVND(staff.revenue)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Coupons & discounts usage lists */}
            <div className={styles.widgetCard}>
              <div className={styles.widgetHeader}>
                <h3 className={styles.widgetTitle}>Hiệu quả mã giảm giá</h3>
                <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: "700" }}>Top lượt dùng nhiều</span>
              </div>
              <table className={styles.leaderboardTable}>
                <thead>
                  <tr>
                    <th>Mã giảm giá</th>
                    <th style={{ textAlign: "center" }}>Giá trị</th>
                    <th style={{ textAlign: "right" }}>Số lượt dùng</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.discountStats.length === 0 ? (
                    <tr>
                      <td colSpan={3} style={{ textAlign: "center", color: "#94a3b8" }}>
                        Chưa thiết lập mã giảm giá nào
                      </td>
                    </tr>
                  ) : (
                    stats.discountStats.map((d, idx) => (
                      <tr key={idx}>
                        <td>
                          <span style={{ 
                            background: "#eff6ff", 
                            color: "#2563eb", 
                            padding: "0.2rem 0.5rem", 
                            borderRadius: "6px",
                            fontFamily: "monospace",
                            fontWeight: "700"
                          }}>
                            {d.code}
                          </span>
                        </td>
                        <td style={{ textAlign: "center", fontWeight: "700", color: "#334155" }}>
                          {d.discountType === "PERCENT" ? `${d.discountValue}%` : formatVND(d.discountValue)}
                        </td>
                        <td style={{ textAlign: "right", fontWeight: "800", color: "#10b981" }}>
                          {d.usedCount} {d.maxUses ? `/ ${d.maxUses}` : ""}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className={styles.bottomGrid} style={{ gridTemplateColumns: "1fr" }}>
            {/* Recent Inventory Audits */}
            <div className={styles.widgetCard}>
              <div className={styles.widgetHeader}>
                <h3 className={styles.widgetTitle}>Lịch sử kiểm kê kho mới nhất</h3>
              </div>
              <table className={styles.leaderboardTable} style={{ width: "100%" }}>
                <thead>
                  <tr>
                    <th>Mã kiểm kê</th>
                    <th>Ngày thực hiện</th>
                    <th>Nhân viên thực hiện</th>
                    <th style={{ textAlign: "center" }}>Số lượng mặt hàng</th>
                    <th>Ghi chú</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentAudits.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: "center", color: "#94a3b8" }}>
                        Chưa ghi nhận đợt kiểm kê kho nào
                      </td>
                    </tr>
                  ) : (
                    stats.recentAudits.map((audit, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: "700", color: "#1e293b" }}>{audit.auditCode}</td>
                        <td>{formatDate(audit.auditDate).split(" ")[0]}</td>
                        <td>{audit.staffName}</td>
                        <td style={{ textAlign: "center", fontWeight: "700" }}>{audit.itemsCount}</td>
                        <td style={{ color: "#64748b", fontSize: "0.8rem", maxWidth: "200px", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                          {audit.note || "---"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
