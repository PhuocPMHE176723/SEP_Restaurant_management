"use client";

import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { sliderApi } from "../../../lib/api/slider";
import type { Slider } from "../../../types/models/content";
import styles from "../../manager/manager.module.css";

export default function SlidersPage() {
  const [sliders, setSliders] = useState<Slider[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentSlider, setCurrentSlider] = useState<Partial<Slider>>({
    imageUrl: "",
    title: "",
    link: "",
    displayOrder: 0,
    isActive: true
  });

  useEffect(() => {
    fetchSliders();
  }, []);

  const fetchSliders = async () => {
    try {
      const data = await sliderApi.getAllSliders();
      setSliders(data);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch sliders:", error);
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (currentSlider.sliderId) {
        await sliderApi.updateSlider(currentSlider.sliderId, currentSlider as any);
      } else {
        await sliderApi.createSlider(currentSlider as any);
      }
      setShowModal(false);
      fetchSliders();
    } catch (error) {
      console.error("Failed to save slider:", error);
      Swal.fire({
        title: "Lỗi",
        text: "Lưu slider thất bại!",
        icon: "error",
        confirmButtonColor: "var(--error)"
      });
    }
  };

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: "Xác nhận xóa?",
      text: "Bạn có chắc muốn xóa slider này?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy"
    });
    
    if (!result.isConfirmed) return;
    
    try {
      await sliderApi.deleteSlider(id);
      fetchSliders();
      Swal.fire({
        title: "Thành công",
        text: "Xóa slider thành công!",
        icon: "success",
        confirmButtonColor: "var(--brand-primary)"
      });
    } catch (error) {
      console.error("Failed to delete slider:", error);
      Swal.fire({
        title: "Lỗi",
        text: "Xóa slider thất bại!",
        icon: "error",
        confirmButtonColor: "var(--error)"
      });
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Quản lý Slider</h1>
          <p className={styles.pageSubtitle}>Cấu hình banner hiển thị trên trang chủ</p>
        </div>
        <button 
          className={styles.btnAdd}
          onClick={() => {
            setCurrentSlider({ imageUrl: "", title: "", link: "", displayOrder: 0, isActive: true });
            setShowModal(true);
          }}
        >
          <span>+</span> Thêm Slider
        </button>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Hình ảnh</th>
              <th>Tiêu đề</th>
              <th>Thứ tự</th>
              <th>Trạng thái</th>
              <th style={{ textAlign: 'right' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5}><div className={styles.spinner}></div></td></tr>
            ) : sliders.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <div className={styles.emptyState}>
                    <h3>Trống</h3>
                    <p>Chưa có slider nào được tạo.</p>
                  </div>
                </td>
              </tr>
            ) : sliders.map((slider) => (
              <tr key={slider.sliderId}>
                <td>
                  <img 
                    src={slider.imageUrl} 
                    alt={slider.title || "Slider"} 
                    className={styles.thumbnail}
                    style={{ width: "160px", height: "60px", objectFit: "cover", borderRadius: "8px" }}
                  />
                </td>
                <td style={{ fontWeight: 700 }}>{slider.title || "—"}</td>
                <td>{slider.displayOrder}</td>
                <td>
                  <span className={slider.isActive ? styles.badgeActive : styles.badgeInactive}>
                    {slider.isActive ? "Đang hiện" : "Đang ẩn"}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <div className={styles.btnRow} style={{ justifyContent: 'flex-end' }}>
                    <button 
                      className={styles.btnEdit}
                      onClick={() => {
                        setCurrentSlider(slider);
                        setShowModal(true);
                      }}
                    >
                      Sửa
                    </button>
                    <button 
                      className={styles.btnDelete}
                      onClick={() => handleDelete(slider.sliderId)}
                    >
                      Xóa
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHead}>
              <h3 className={styles.modalTitle}>{currentSlider.sliderId ? "Sửa Slider" : "Thêm Slider mới"}</h3>
              <button onClick={() => setShowModal(false)} className={styles.modalClose}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label>URL Hình ảnh</label>
                  <input 
                    type="text" 
                    className={styles.input}
                    value={currentSlider.imageUrl}
                    onChange={e => setCurrentSlider({...currentSlider, imageUrl: e.target.value})}
                    placeholder="https://..."
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Tiêu đề</label>
                  <input 
                    type="text" 
                    className={styles.input}
                    value={currentSlider.title || ""}
                    onChange={e => setCurrentSlider({...currentSlider, title: e.target.value})}
                    placeholder="Tiêu đề hiển thị (tùy chọn)"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Link liên kết</label>
                  <input 
                    type="text" 
                    className={styles.input}
                    value={currentSlider.link || ""}
                    onChange={e => setCurrentSlider({...currentSlider, link: e.target.value})}
                    placeholder="/menu hoặc https://..."
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Thứ tự hiển thị</label>
                  <input 
                    type="number" 
                    className={styles.input}
                    value={currentSlider.displayOrder}
                    onChange={e => setCurrentSlider({...currentSlider, displayOrder: parseInt(e.target.value)})}
                  />
                </div>
                <div className={styles.checkRow}>
                  <input 
                    type="checkbox" 
                    id="isSliderActive"
                    checked={currentSlider.isActive}
                    onChange={e => setCurrentSlider({...currentSlider, isActive: e.target.checked})}
                  />
                  <label htmlFor="isSliderActive">Kích hoạt banner này</label>
                </div>
              </div>
              <div className={styles.modalFoot}>
                <button type="button" className={styles.btnCancel} onClick={() => setShowModal(false)}>Hủy</button>
                <button type="submit" className={styles.btnAdd} style={{ marginTop: 0 }}>Lưu Slider</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
