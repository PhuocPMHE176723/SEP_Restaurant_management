import React from "react";
import { LayoutGrid, Users, X, CheckCircle2 } from "lucide-react";
import styles from "./ViewAssignTablesModal.module.css";
import type { ReservationAssignTablesResponse } from "@/lib/api/table-reservation";

type ViewAssignedTablesModalProps = {
    open: boolean;
    data: ReservationAssignTablesResponse | null;
    loading?: boolean;
    onClose: () => void;
};

const ViewAssignedTablesModal = ({
    open,
    data,
    loading = false,
    onClose,
}: ViewAssignedTablesModalProps) => {
    if (!open) return null;

    const assignedTableIds = data?.selectedTableIds || [];
    const assignedTables = (data?.tables || []).filter((table) =>
        assignedTableIds.includes(table.tableId),
    );

    const totalCapacity = assignedTables.reduce(
        (total, table) => total + table.capacity,
        0,
    );
    const table4Count = data?.table4Count ?? 0;
    const table6Count = data?.table6Count ?? 0;
    const table8Count = data?.table8Count ?? 0;

    const requestedTableTypeCount = table4Count + table6Count + table8Count;

    const isBookingByTable = requestedTableTypeCount > 0;
    return (
        <div className={styles.modalRoot}>
            <button
                type="button"
                className={styles.backdrop}
                onClick={onClose}
                aria-label="Đóng modal xem bàn đã gán"
            />

            <section className={styles.modalPanel}>
                <header className={styles.modalHeader}>
                    <div className={styles.headerLeft}>
                        <div className={styles.headerIcon}>
                            <LayoutGrid size={24} />
                        </div>

                        <div>
                            <h3 className={styles.title}>
                                Bàn đã gán cho đơn {data?.reservationCode || ""}
                            </h3>
                            <p className={styles.subtitle}>
                                Khách hàng: <span>{data?.customerName || "--"}</span>
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className={styles.closeButton}
                        aria-label="Đóng"
                    >
                        <X size={24} />
                    </button>
                </header>

                <div className={styles.infoBar}>
                    <div className={styles.infoItem}>
                        <span className={`${styles.dot} ${styles.blueDot}`} />
                        <span className={styles.infoLabel}>Yêu cầu:</span>
                        <span className={styles.infoValue}>
                            {isBookingByTable
                                ? `${requestedTableTypeCount} bàn`
                                : `${data?.numberOfGuest ?? 0} khách`}
                        </span>
                    </div>
                    {isBookingByTable && (
                        <div className={styles.tableTypeSummary}>
                            {table4Count > 0 && <span>{table4Count} bàn 4 chỗ</span>}
                            {table6Count > 0 && <span>{table6Count} bàn 6 chỗ</span>}
                            {table8Count > 0 && <span>{table8Count} bàn 8 chỗ</span>}
                        </div>
                    )}

                    <div className={styles.divider} />

                    <div className={styles.infoItem}>
                        <span className={`${styles.dot} ${styles.greenDot}`} />
                        <span className={styles.infoLabel}>Đã gán:</span>
                        <span className={`${styles.infoValue} ${styles.successText}`}>
                            {assignedTables.length} bàn, sức chứa {totalCapacity} người
                        </span>
                    </div>
                </div>

                <div className={styles.body}>
                    {loading ? (
                        <div className={styles.loading}>Đang tải bàn đã gán...</div>
                    ) : assignedTables.length === 0 ? (
                        <div className={styles.emptyBox}>
                            <LayoutGrid size={36} />
                            <h4>Chưa có bàn được gán</h4>
                            <p>Đơn đặt bàn này hiện chưa được điều phối bàn.</p>
                        </div>
                    ) : (
                        <div className={styles.tableGrid}>
                            {assignedTables.map((table) => (
                                <article key={table.tableId} className={styles.tableCard}>
                                    <div className={styles.tableTop}>
                                        <span className={styles.tableName}>
                                            {table.tableName || table.tableCode}
                                        </span>

                                        <span className={styles.selectedIcon}>
                                            <CheckCircle2 size={16} />
                                        </span>
                                    </div>

                                    <div className={styles.tableMeta}>
                                        <div className={styles.capacityText}>
                                            <Users size={12} />
                                            <span>{table.capacity} chỗ ngồi</span>
                                        </div>

                                        <div className={styles.statusText}>Đã gán cho đơn này</div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </div>

                <footer className={styles.modalFooter}>
                    <p className={styles.footerNote}>
                        * Modal này chỉ dùng để xem bàn đã gán, không thể thay đổi bàn.
                    </p>

                    <button type="button" className={styles.closeFooterButton} onClick={onClose}>
                        Đóng
                    </button>
                </footer>
            </section>
        </div>
    );
};

export default ViewAssignedTablesModal;


