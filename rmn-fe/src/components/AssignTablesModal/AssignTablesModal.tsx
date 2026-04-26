import React, { useEffect, useMemo, useState } from "react";
import {
    CheckCircle2,
    Info,
    LayoutGrid,
    UserPlus,
    Users,
    X,
} from "lucide-react";
import styles from "./AssignTablesModal.module.css";
import type { ReservationAssignTablesResponse } from "@/lib/api/table-reservation";

type AssignTablesModalProps = {
    open: boolean;
    assignData: ReservationAssignTablesResponse | null;
    loading?: boolean;
    submitting?: boolean;
    onClose: () => void;
    onSubmit: (payload: { reservationId: number; tableIds: number[] }) => void | Promise<void>;
};

const AssignTablesModal = ({
    open,
    assignData,
    loading = false,
    submitting = false,
    onClose,
    onSubmit,
}: AssignTablesModalProps) => {
    const [selectedTableIds, setSelectedTableIds] = useState<number[]>([]);

    useEffect(() => {
        if (open && assignData) {
            setSelectedTableIds(assignData.selectedTableIds || []);
        }
    }, [open, assignData]);

    const selectedTables = useMemo(() => {
        if (!assignData?.tables) return [];
        return assignData.tables.filter((table) =>
            selectedTableIds.includes(table.tableId),
        );
    }, [assignData, selectedTableIds]);

    const currentTotalCapacity = useMemo(() => {
        return selectedTables.reduce((total, table) => total + table.capacity, 0);
    }, [selectedTables]);

    const table4Count = assignData?.table4Count ?? 0;
    const table6Count = assignData?.table6Count ?? 0;
    const table8Count = assignData?.table8Count ?? 0;

    const requestedTableCount = table4Count + table6Count + table8Count;
    const isBookingByTable = requestedTableCount > 0;
    const isBookingByPeople = !isBookingByTable;

    const requestedCapacity =
        table4Count * 4 + table6Count * 6 + table8Count * 8;

    const selectedTableCount = selectedTableIds.length;

    const isCapacityEnough = isBookingByPeople
        ? currentTotalCapacity >= (assignData?.numberOfGuest ?? 0)
        : currentTotalCapacity >= requestedCapacity;

    const isTableCountExact = isBookingByTable
        ? selectedTableCount === requestedTableCount
        : true;

    const canSubmit =
        !!assignData &&
        selectedTableCount > 0 &&
        isCapacityEnough &&
        isTableCountExact &&
        !submitting;

    const toggleTableSelection = (tableId: number, isSelectable: boolean) => {
        if (!isSelectable) return;

        setSelectedTableIds((prev) => {
            if (prev.includes(tableId)) {
                return prev.filter((id) => id !== tableId);
            }

            return [...prev, tableId];
        });
    };

    const handleSubmit = async () => {
        if (!canSubmit || !assignData) return;

        await onSubmit({
            reservationId: assignData.reservationId,
            tableIds: selectedTableIds,
        });
    };

    if (!open) return null;

    return (
        <div className={styles.modalRoot}>
            <button
                type="button"
                className={styles.backdrop}
                onClick={onClose}
                aria-label="Đóng modal gán bàn"
            />

            <section className={styles.modalPanel}>
                <header className={styles.modalHeader}>
                    <div className={styles.headerLeft}>
                        <div className={styles.headerIcon}>
                            <LayoutGrid size={24} />
                        </div>

                        <div>
                            <h3 className={styles.title}>
                                Điều phối bàn cho đơn {assignData?.reservationCode || ""}
                            </h3>
                            <p className={styles.subtitle}>
                                Khách hàng:{" "}
                                <span>{assignData?.customerName || "--"}</span>
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
                    <div className={styles.infoGroups}>
                        <div className={styles.infoItem}>
                            <span className={`${styles.dot} ${styles.blueDot}`} />
                            <span className={styles.infoLabel}>Yêu cầu:</span>
                            <span className={styles.infoValue}>
                                {isBookingByTable
                                    ? `${requestedTableCount} bàn`
                                    : `${assignData?.numberOfGuest ?? 0} khách`}
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
                            <span
                                className={`${styles.dot} ${isCapacityEnough ? styles.greenDot : styles.yellowDot
                                    }`}
                            />
                            <span className={styles.infoLabel}>Đã chọn:</span>
                            <span
                                className={`${styles.infoValue} ${isCapacityEnough ? styles.successText : styles.warningText
                                    }`}
                            >
                                {selectedTableIds.length} bàn, sức chứa {currentTotalCapacity} người
                            </span>
                        </div>
                    </div>

                    {isBookingByPeople &&
                        selectedTableCount > 0 &&
                        !isCapacityEnough && (
                            <div className={styles.warningBox}>
                                <Info size={14} />
                                <span>Sức chứa chưa đủ cho số lượng khách</span>
                            </div>
                        )}

                    {isBookingByTable &&
                        selectedTableCount > 0 &&
                        selectedTableCount < requestedTableCount && (
                            <div className={styles.warningBox}>
                                <Info size={14} />
                                <span>Chưa chọn đủ số bàn khách yêu cầu</span>
                            </div>
                        )}

                    {isBookingByTable &&
                        selectedTableCount > requestedTableCount && (
                            <div className={styles.warningBox}>
                                <Info size={14} />
                                <span>Số bàn chọn vượt quá số bàn khách đặt trước</span>
                            </div>
                        )}

                    {isBookingByTable &&
                        selectedTableCount === requestedTableCount &&
                        !isCapacityEnough && (
                            <div className={styles.warningBox}>
                                <Info size={14} />
                                <span>Sức chứa chưa đủ theo loại bàn khách yêu cầu</span>
                            </div>
                        )}
                </div>

                <div className={styles.tableBody}>
                    {loading ? (
                        <div className={styles.loading}>Đang tải danh sách bàn...</div>
                    ) : (
                        <div className={styles.tableGrid}>
                            {(assignData?.tables || []).map((table) => {
                                const isSelected = selectedTableIds.includes(table.tableId);
                                const disabled = !table.isSelectable;

                                let cardClass = styles.tableCard;
                                if (disabled) cardClass += ` ${styles.disabledCard}`;
                                else if (isSelected) cardClass += ` ${styles.selectedCard}`;

                                return (
                                    <button
                                        key={table.tableId}
                                        type="button"
                                        disabled={disabled}
                                        onClick={() => toggleTableSelection(table.tableId, table.isSelectable)}
                                        className={cardClass}
                                        title={table.statusMessage}
                                    >
                                        <div className={styles.tableTop}>
                                            <span className={styles.tableName}>
                                                {table.tableName || table.tableCode}
                                            </span>

                                            {!disabled && isSelected && (
                                                <span className={styles.selectedIcon}>
                                                    <CheckCircle2 size={16} />
                                                </span>
                                            )}
                                        </div>

                                        <div className={styles.tableMeta}>
                                            <div className={styles.capacityText}>
                                                <Users size={12} />
                                                <span>{table.capacity} chỗ ngồi</span>
                                            </div>

                                            <div
                                                className={`${styles.statusText} ${table.isOccupied
                                                    ? styles.occupiedText
                                                    : table.isReserved
                                                        ? styles.reservedText
                                                        : isSelected
                                                            ? styles.selectedStatusText
                                                            : styles.availableText
                                                    }`}
                                            >
                                                {table.statusMessage}
                                            </div>
                                        </div>

                                        {!disabled && !isSelected && (
                                            <span className={styles.hoverIcon}>
                                                <UserPlus size={14} />
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                <footer className={styles.modalFooter}>
                    <p className={styles.footerNote}>
                        * Có thể chọn một hoặc nhiều bàn trống để đáp ứng yêu cầu khách hàng.
                    </p>

                    <div className={styles.footerActions}>
                        <button type="button" onClick={onClose} className={styles.cancelButton}>
                            Hủy bỏ
                        </button>

                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={!canSubmit}
                            className={styles.submitButton}
                        >
                            {submitting ? "Đang gán..." : "Xác nhận gán bàn"}
                        </button>
                    </div>
                </footer>
            </section>
        </div>
    );
};

export default AssignTablesModal;


