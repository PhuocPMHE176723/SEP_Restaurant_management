import React, { useState, useEffect } from 'react';
import { diningTableApi } from '../../lib/api/dining-table';
import type { DiningTableResponse } from '../../types/models/dining-table';
import styles from './TableSelectModal.module.css';

interface Props {
  partySize: number;
  onSelect: (tableId: number) => void;
  onClose: () => void;
}

const TableSelectModal: React.FC<Props> = ({ partySize, onSelect, onClose }) => {
  const [tables, setTables] = useState<DiningTableResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      const data = await diningTableApi.getAllTables();
      // Filter available tables with enough capacity
      const available = data.filter(t => t.status === 'AVAILABLE' && t.capacity >= partySize);
      setTables(available);
    } catch (error) {
      console.error('Failed to fetch tables:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h3 className={styles.title}>Chọn bàn (Khách: {partySize})</h3>
          <button onClick={onClose} className={styles.closeBtn}>&times;</button>
        </div>
        <div className={styles.body}>
          {loading ? (
            <div className={styles.spinnerWrapper}>Đang tải...</div>
          ) : tables.length === 0 ? (
            <p className={styles.empty}>Không có bàn nào trống phù hợp ({partySize} người).</p>
          ) : (
            <div className={styles.grid}>
              {tables.map(table => (
                <div 
                  key={table.tableId} 
                  className={styles.tableCard}
                  onClick={() => onSelect(table.tableId)}
                >
                  <div className={styles.icon}>🪑</div>
                  <div className={styles.info}>
                    <span className={styles.tableCode}>{table.tableCode}</span>
                    <span className={styles.capacity}>Sức chứa: {table.capacity} ghế</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose}>Hủy bỏ</button>
        </div>
      </div>
    </div>
  );
};

export default TableSelectModal;
