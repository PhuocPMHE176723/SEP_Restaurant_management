"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Header from "../../../components/Header/Header";
import Footer from "../../../components/Footer/Footer";
import { blogApi } from "../../../lib/api/blog";
import { BlogPost } from "../../../types/models/content";
import styles from "./blog.module.css";

export default function BlogListingPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const data = await blogApi.getAllPosts();
      // Only show published posts for public view
      const publishedPosts = data.filter(post => post.status === "PUBLISHED");
      setPosts(publishedPosts);
    } catch (error) {
      console.error("Failed to fetch posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  };

  // Helper to strip HTML for the excerpt
  const getExcerpt = (html: string) => {
    if (typeof DOMParser === "undefined") return html.replace(/<[^>]*>?/gm, ''); // Fallback for SSR if needed
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const text = doc.body.textContent || "";
    return text.length > 150 ? text.substring(0, 150) + "..." : text;
  };

  return (
    <>
      <Header />
      <main className={styles.main}>
        <div className="container">
          <header className={styles.header}>
            <h1 className={styles.title}>Tin tức & Sự kiện</h1>
            <p className={styles.subtitle}>Cập nhật những tin tức mới nhất, ưu đãi và văn hóa ẩm thực tại Khói Quê</p>
          </header>

          {loading ? (
            <div className={styles.loading}>Đang tải bài viết...</div>
          ) : posts.length === 0 ? (
            <div className={styles.loading}>Hiện chưa có bài viết nào.</div>
          ) : (
            <div className={styles.blogGrid}>
              {posts.map((post) => (
                <article key={post.postId} className={styles.blogCard}>
                  <div className={styles.cardImage}>
                    {post.featuredImage ? (
                      <img src={post.featuredImage} alt={post.title} />
                    ) : (
                      <div className={styles.cardNoImage}>📝</div>
                    )}
                  </div>
                  <div className={styles.cardBody}>
                    <div className={styles.cardMeta}>
                      <span className={styles.category}>{post.categoryName}</span>
                      <time className={styles.date}>{formatDate(post.createdAt)}</time>
                    </div>
                    <h2 className={styles.cardTitle}>
                      <Link href={`/blog/${post.postId}`}>{post.title}</Link>
                    </h2>
                    <p className={styles.cardExcerpt}>{getExcerpt(post.content)}</p>
                    <Link href={`/blog/${post.postId}`} className={styles.readMore}>
                      Xem chi tiết 
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                        <polyline points="12 5 19 12 12 19"></polyline>
                      </svg>
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
