"use client";

import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import Link from "next/link";
import { blogApi } from "../../../lib/api/blog";
import { BlogPost } from "../../../types/models/content";
import styles from "../../manager/manager.module.css";

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "DRAFT" | "PUBLISHED" | "ARCHIVED">("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const data = await blogApi.getAllPosts();
      setPosts(data as any);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch posts:", error);
      setLoading(false);
    }
  };

  const handleDeletePost = async (id: number) => {
    const result = await Swal.fire({
      title: "Xác nhận xóa?",
      text: "Bạn có chắc muốn xóa bài viết này?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy"
    });
    
    if (!result.isConfirmed) return;
    
    try {
      await blogApi.deletePost(id);
      fetchPosts();
      Swal.fire({
        title: "Thành công",
        text: "Xóa bài viết thành công!",
        icon: "success",
        confirmButtonColor: "var(--brand-primary)"
      });
    } catch (error) {
      console.error("Failed to delete post:", error);
      Swal.fire({
        title: "Lỗi",
        text: "Xóa bài viết thất bại!",
        icon: "error",
        confirmButtonColor: "var(--error)"
      });
    }
  };

  const handleToggleStatus = async (post: BlogPost, newStatus: "PUBLISHED" | "ARCHIVED") => {
    try {
      await blogApi.updatePost(post.postId, {
        title: post.title,
        content: post.content,
        categoryId: post.categoryId,
        status: newStatus,
        featuredImage: post.featuredImage,
      });
      fetchPosts();
    } catch (error) {
      console.error("Failed to update status:", error);
      Swal.fire({
        title: "Lỗi",
        text: "Cập nhật trạng thái thất bại!",
        icon: "error",
        confirmButtonColor: "var(--error)"
      });
    }
  };

  const filteredPosts = posts.filter((post) => {
    const matchesFilter = filter === "ALL" || post.status === filter;
    const matchesSearch =
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.categoryName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Quản lý Blog</h1>
          <p className={styles.pageSubtitle}>Tạo và quản lý các bài viết tin tức, khuyến mãi</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link href="/staff/blog/create" className={styles.btnAdd}>
            <span>+</span> Tạo bài viết mới
          </Link>
        </div>
      </div>

      <div className={styles.filterBar}>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Tìm theo tiêu đề hoặc danh mục..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          className={styles.select}
          style={{ width: 'auto' }}
          value={filter}
          onChange={(e) => setFilter(e.target.value as any)}
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value="DRAFT">Bản nháp</option>
          <option value="PUBLISHED">Đã xuất bản</option>
          <option value="ARCHIVED">Đã ẩn</option>
        </select>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th style={{ width: '40%' }}>Bài viết</th>
              <th>Danh mục</th>
              <th>Trạng thái</th>
              <th>Ngày tạo</th>
              <th style={{ textAlign: 'right' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5}><div className={styles.spinner}></div></td></tr>
            ) : filteredPosts.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <div className={styles.emptyState}>
                    <h3>Không tìm thấy</h3>
                    <p>Không có bài viết nào phù hợp với tìm kiếm của bạn.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredPosts.map((post) => (
                <tr key={post.postId}>
                  <td>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      {post.featuredImage ? (
                        <img src={post.featuredImage} alt="" className={styles.thumbnail} style={{ width: '80px', height: '50px' }} />
                      ) : (
                        <div className={styles.noImage} style={{ width: '80px', height: '50px', fontSize: '1rem' }}>📝</div>
                      )}
                      <div>
                        <div style={{ fontWeight: 700, color: '#1e293b' }}>{post.title}</div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Quản trị viên</div>
                      </div>
                    </div>
                  </td>
                  <td>{post.categoryName}</td>
                  <td>
                    <span className={`${styles.badge} ${post.status === 'PUBLISHED' ? styles.statusPublished : post.status === 'DRAFT' ? styles.statusDraft : styles.statusArchived}`}>
                      {post.status === "DRAFT" && "Bản nháp"}
                      {post.status === "PUBLISHED" && "Đã xuất bản"}
                      {post.status === "ARCHIVED" && "Đã ẩn"}
                    </span>
                  </td>
                  <td>{new Date(post.createdAt).toLocaleDateString("vi-VN")}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div className={styles.btnRow} style={{ justifyContent: 'flex-end' }}>
                      <Link href={`/staff/blog/edit/${post.postId}`} className={styles.btnEdit}>
                        Sửa
                      </Link>
                      {post.status !== "PUBLISHED" && (
                        <button className={styles.btnEdit} onClick={() => handleToggleStatus(post, "PUBLISHED")} style={{ background: '#ecfdf5', color: '#059669', borderColor: '#d1fae5' }}>
                          Hiện
                        </button>
                      )}
                      {post.status === "PUBLISHED" && (
                        <button className={styles.btnEdit} onClick={() => handleToggleStatus(post, "ARCHIVED")}>
                          Ẩn
                        </button>
                      )}
                      <button className={styles.btnDelete} onClick={() => handleDeletePost(post.postId)}>
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
