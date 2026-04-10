"use client";

import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { blogApi } from "@/lib/api/blog";
import { BlogCategory } from "@/types/models/content";
import Modal from "@/components/Modal/Modal";
import styles from "../../manager/manager.module.css";
import { PlusCircle, Edit2, Trash2, Check, X } from "lucide-react";

interface CategorySelectProps {
  value: number;
  onChange: (categoryId: number) => void;
  required?: boolean;
}

export function BlogCategorySelect({ value, onChange, required }: CategorySelectProps) {
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // States for Category Management Modal
  const [isLoading, setIsLoading] = useState(true);
  const [newCatName, setNewCatName] = useState("");
  const [editingCatId, setEditingCatId] = useState<number | null>(null);
  const [editingCatName, setEditingCatName] = useState("");

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const data = await blogApi.getCategories();
      setCategories(data);
      // Auto-select first active category if no value is set
      if (value === 0 && data.filter(c => c.isActive).length > 0) {
        onChange(data.find(c => c.isActive)!.categoryId);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCatName.trim()) return;
    try {
      const newCat = await blogApi.createCategory({
        categoryName: newCatName.trim(),
        description: "",
        isActive: true
      });
      setNewCatName("");
      await fetchCategories();
      onChange(newCat.categoryId); // auto-select new category
    } catch (err: any) {
      Swal.fire("Lỗi", err.message || "Tạo danh mục thất bại", "error");
    }
  };

  const handleSaveEdit = async (catId: number) => {
    if (!editingCatName.trim()) return;
    try {
      await blogApi.updateCategory(catId, { categoryName: editingCatName.trim() });
      setEditingCatId(null);
      await fetchCategories();
    } catch (err: any) {
      Swal.fire("Lỗi", err.message || "Cập nhật thất bại", "error");
    }
  };

  const handleDelete = async (catId: number) => {
    const result = await Swal.fire({
      title: "Xác nhận xóa",
      text: "Bạn có chắc chắn muốn xóa danh mục này?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy",
      confirmButtonColor: "#ef4444"
    });
    if (!result.isConfirmed) return;

    try {
      await blogApi.deleteCategory(catId);
      await fetchCategories();
      if (value === catId) {
        onChange(0);
      }
    } catch (err: any) {
      Swal.fire("Lỗi", err.message || "Xóa thất bại", "error");
    }
  };

  return (
    <>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <select
          className={styles.select}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          required={required}
          style={{ flex: 1 }}
        >
          <option value={0}>Chọn danh mục</option>
          {categories.filter(c => c.isActive).map((cat) => (
            <option key={cat.categoryId} value={cat.categoryId}>
              {cat.categoryName}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          style={{
            background: 'var(--brand-primary)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '0 1rem',
            height: '42px',
            cursor: 'pointer',
            fontWeight: 600,
            whiteSpace: 'nowrap'
          }}
        >
          Quản lý
        </button>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Quản lý danh mục"
        type="info"
      >
        <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px' }}>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <input
              type="text"
              placeholder="Tên danh mục mới..."
              className={styles.input}
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
            />
            <button
              type="button"
              onClick={handleAddCategory}
              style={{
                background: '#10b981', color: 'white', border: 'none',
                borderRadius: '8px', padding: '0 1rem', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '0.25rem'
              }}
            >
              <PlusCircle size={18} /> Thêm
            </button>
          </div>

          <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
            {isLoading ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>Đang tải...</div>
            ) : categories.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>Chưa có danh mục nào</div>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {categories.map(cat => (
                  <li key={cat.categoryId} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '0.75rem', background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0'
                  }}>
                    {editingCatId === cat.categoryId ? (
                      <input
                        autoFocus
                        type="text"
                        className={styles.input}
                        style={{ padding: '0.25rem 0.5rem', flex: 1, marginRight: '0.5rem' }}
                        value={editingCatName}
                        onChange={(e) => setEditingCatName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(cat.categoryId)}
                      />
                    ) : (
                      <span style={{ fontWeight: 600, color: '#334155' }}>
                        {cat.categoryName} {cat.isActive ? '' : '(Đã ẩn)'}
                      </span>
                    )}

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {editingCatId === cat.categoryId ? (
                        <>
                          <button type="button" onClick={() => handleSaveEdit(cat.categoryId)} style={{ background: '#10b981', color: 'white', border: 'none', padding: '0.25rem', borderRadius: '4px', cursor: 'pointer' }} title="Lưu">
                            <Check size={16} />
                          </button>
                          <button type="button" onClick={() => setEditingCatId(null)} style={{ background: '#94a3b8', color: 'white', border: 'none', padding: '0.25rem', borderRadius: '4px', cursor: 'pointer' }} title="Huỷ">
                            <X size={16} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button type="button" onClick={() => { setEditingCatId(cat.categoryId); setEditingCatName(cat.categoryName); }} style={{ background: '#f59e0b', color: 'white', border: 'none', padding: '0.25rem', borderRadius: '4px', cursor: 'pointer' }} title="Sửa">
                            <Edit2 size={16} />
                          </button>
                          <button type="button" onClick={() => handleDelete(cat.categoryId)} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '0.25rem', borderRadius: '4px', cursor: 'pointer' }} title="Xóa">
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
}
