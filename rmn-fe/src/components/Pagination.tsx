import styles from "../app/manager/manager.module.css";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
}: PaginationProps) {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    if (startPage > 1) {
      pages.push(
        <button
          key={1}
          onClick={() => onPageChange(1)}
          className={`${styles.pageBtn} ${1 === currentPage ? styles.pageBtnActive : ""}`}
        >
          1
        </button>,
      );
      if (startPage > 2) {
        pages.push(
          <span key="start-ellipsis" className={styles.pageEllipsis}>
            ...
          </span>,
        );
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => onPageChange(i)}
          className={`${styles.pageBtn} ${i === currentPage ? styles.pageBtnActive : ""}`}
        >
          {i}
        </button>,
      );
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(
          <span key="end-ellipsis" className={styles.pageEllipsis}>
            ...
          </span>,
        );
      }
      pages.push(
        <button
          key={totalPages}
          onClick={() => onPageChange(totalPages)}
          className={`${styles.pageBtn} ${totalPages === currentPage ? styles.pageBtnActive : ""}`}
        >
          {totalPages}
        </button>,
      );
    }

    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <div className={styles.pagination}>
      <div className={styles.pageInfo}>
        Hiển thị {startItem}-{endItem} của {totalItems} mục
      </div>

      <div className={styles.paginationControls}>
        <button
          className={styles.pageBtn}
          onClick={handlePrevious}
          disabled={currentPage === 1}
        >
          ← Trước
        </button>

        {renderPageNumbers()}

        <button
          className={styles.pageBtn}
          onClick={handleNext}
          disabled={currentPage === totalPages}
        >
          Sau →
        </button>
      </div>
    </div>
  );
}
