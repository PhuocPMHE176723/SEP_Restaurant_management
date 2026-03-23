"use client";

import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { blogApi } from "../../../../lib/api/blog";
import { BlogCategory } from "../../../../types/models/content";
import styles from "../../../manager/manager.module.css";

export default function BlogCategoriesPage() {
    const [categories, setCategories] = useState<BlogCategory[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newCategory, setNewCategory] = useState({ categoryName: "", description: "", isActive: true });

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            setIsLoading(true);
            const data = await blogApi.getCategories();
            setCategories(data);
        } catch (err: any) {
            setError(err.message || "Failed to fetch categories");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await blogApi.createCategory(newCategory);
            setIsModalOpen(false);
            setNewCategory({ categoryName: "", description: "", isActive: true });
            fetchCategories();
        } catch (err: any) {
            Swal.fire({
                title: "Lỗi",
                text: err.message || "Failed to create category",
                icon: "error",
                confirmButtonColor: "var(--error)"
            });
        }
    };

    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: "Xác nhận xóa?",
            text: "Bạn có chắc chắn muốn xóa danh mục này?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Xóa",
            cancelButtonText: "Hủy"
        });
        
        if (!result.isConfirmed) return;
        
        try {
            await blogApi.deleteCategory(id);
            fetchCategories();
            Swal.fire({
                title: "Thành công",
                text: "Xóa danh mục thành công!",
                icon: "success",
                confirmButtonColor: "var(--brand-primary)"
            });
        } catch (err: any) {
            Swal.fire({
                title: "Lỗi",
                text: err.message || "Failed to delete category",
                icon: "error",
                confirmButtonColor: "var(--error)"
            });
        }
    };

    return (
        <div className={styles.pageContainer}>
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.pageTitle}>Danh mục Blog</h1>
                    <p className={styles.pageSubtitle}>Quản lý các danh mục bài viết trên website</p>
                </div>
                <button className={styles.btnAdd} onClick={() => setIsModalOpen(true)}>
                    <span>+</span> Thêm danh mục
                </button>
            </div>

            {error && <div className={styles.modalError} style={{ marginBottom: '1.5rem' }}>{error}</div>}

            <div className={styles.tableWrap}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Tên danh mục</th>
                            <th>Mô tả</th>
                            <th>Trạng thái</th>
                            <th style={{ textAlign: "right" }}>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan={5}><div className={styles.spinner}></div></td></tr>
                        ) : categories.length === 0 ? (
                            <tr>
                                <td colSpan={5}>
                                    <div className={styles.emptyState}>
                                        <h3>Trống</h3>
                                        <p>Chưa có danh mục nào được tạo.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            categories.map((cat) => (
                                <tr key={cat.categoryId}>
                                    <td>#{cat.categoryId}</td>
                                    <td style={{ fontWeight: 700, color: '#1e293b' }}>{cat.categoryName}</td>
                                    <td>{cat.description || "—"}</td>
                                    <td>
                                        <span className={cat.isActive ? styles.badgeActive : styles.badgeInactive}>
                                            {cat.isActive ? "Hoạt động" : "Ẩn"}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: "right" }}>
                                        <button 
                                            className={styles.btnDelete}
                                            onClick={() => handleDelete(cat.categoryId)}
                                        >
                                            Xoá
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <div className={styles.modalHead}>
                            <h2 className={styles.modalTitle}>Thêm danh mục mới</h2>
                            <button onClick={() => setIsModalOpen(false)} className={styles.modalClose}>&times;</button>
                        </div>
                        <form onSubmit={handleCreateCategory}>
                            <div className={styles.modalBody}>
                                <div className={styles.formGroup}>
                                    <label>Tên danh mục</label>
                                    <input 
                                        type="text" 
                                        required 
                                        className={styles.input}
                                        value={newCategory.categoryName}
                                        onChange={(e) => setNewCategory({ ...newCategory, categoryName: e.target.value })}
                                        placeholder="Ví dụ: Khuyến mãi, Tin tức..."
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Mô tả</label>
                                    <textarea 
                                        className={styles.textarea}
                                        value={newCategory.description}
                                        onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                                        placeholder="Mô tả ngắn về danh mục này"
                                        rows={3}
                                    />
                                </div>
                                <div className={styles.checkRow}>
                                    <input 
                                        type="checkbox" 
                                        id="isCatActive"
                                        checked={newCategory.isActive}
                                        onChange={(e) => setNewCategory({ ...newCategory, isActive: e.target.checked })}
                                    />
                                    <label htmlFor="isCatActive">Trạng thái hoạt động</label>
                                </div>
                            </div>
                            <div className={styles.modalFoot}>
                                <button type="button" onClick={() => setIsModalOpen(false)} className={styles.btnCancel}>Huỷ</button>
                                <button type="submit" className={styles.btnAdd} style={{ marginTop: 0 }}>Lưu danh mục</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
