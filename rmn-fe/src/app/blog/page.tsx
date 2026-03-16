"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import { blogApi } from "../../lib/api/blog";
import type { BlogPost } from "../../types/models/content";
import styles from "./blog.module.css";

export default function BlogListPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const allPosts = await blogApi.getAllPosts();
        // Show only published posts
        setPosts(allPosts.filter(p => p.status === "PUBLISHED"));
      } catch (error) {
        console.error("Failed to fetch blog posts:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <>
      <Header />
      <main className={styles.blogContainer}>
        <div className="container">
          <div className={styles.blogHeader}>
            <h1 className={styles.blogTitle}>Tin tức & Sự kiện</h1>
            <p className={styles.blogSub}>Cập nhật những tin tức mới nhất từ Nhà Hàng Khói Quê</p>
          </div>

          {loading ? (
            <div className="spinner" />
          ) : posts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem' }}>
              <h3>Chưa có bài viết nào</h3>
              <p>Vui lòng quay lại sau.</p>
              <Link href="/" className="btn btn-primary" style={{ marginTop: '1rem' }}>Về trang chủ</Link>
            </div>
          ) : (
            <div className={styles.blogGrid}>
              {posts.map((post) => (
                <Link key={post.postId} href={`/blog/${post.postId}`} className={styles.blogCard}>
                  <div className={styles.cardImageWrap}>
                    <img 
                      src={post.featuredImage || "https://images.unsplash.com/photo-1514361892635-6b07e31e75f9?q=80&w=2070&auto=format&fit=crop"} 
                      alt={post.title} 
                      className={styles.cardImage} 
                    />
                    <span className={styles.categoryBadge}>{post.categoryName}</span>
                  </div>
                  <div className={styles.cardContent}>
                    <div className={styles.cardMeta}>
                      {new Date(post.createdAt).toLocaleDateString("vi-VN")} • {post.authorName || "Quản trị viên"}
                    </div>
                    <h2 className={styles.cardTitle}>{post.title}</h2>
                    <p className={styles.cardExcerpt}>{post.excerpt || post.content.substring(0, 150) + "..."}</p>
                    <div className={styles.cardFooter}>
                      <span className={styles.readMore}>
                        Xem chi tiết
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
