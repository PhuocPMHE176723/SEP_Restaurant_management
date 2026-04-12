"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Header from "../../../../components/Header/Header";
import Footer from "../../../../components/Footer/Footer";
import { blogApi } from "../../../../lib/api/blog";
import { BlogPost } from "../../../../types/models/content";
import styles from "../blog.module.css";

export default function BlogDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchPost(Number(params.id));
    }
  }, [params.id]);

  const fetchPost = async (id: number) => {
    try {
      setLoading(true);
      const data = await blogApi.getPostById(id);
      
      // Basic security: if archived and not staff, redirect
      // Note: In a real app, this should be handled by backend or server-side rendering
      if (data.status === "ARCHIVED") {
        router.push("/blog");
        return;
      }
      
      setPost(data);
    } catch (error) {
      console.error("Failed to fetch post:", error);
      router.push("/blog");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    });
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className={styles.loading}>Đang tải nội dung...</div>
        <Footer />
      </>
    );
  }

  if (!post) {
    return null; // or error state
  }

  return (
    <>
      <Header />
      <main className={styles.main}>
        <div className="container">
          <div className={styles.contentContainer}>
            <header className={styles.detailHeader}>
              <Link href="/blog" className={styles.backBtn}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="19" y1="12" x2="5" y2="12"></line>
                  <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
                Quay lại tin tức
              </Link>
              
              <div className={styles.postMeta}>
                <span className={styles.category}>{post.categoryName}</span>
                <span className={styles.date}>{formatDate(post.createdAt)}</span>
              </div>
              
              <h1 className={styles.detailTitle}>{post.title}</h1>
            </header>

            {post.featuredImage && (
              <div className={styles.featuredImage}>
                <img src={post.featuredImage} alt={post.title} />
              </div>
            )}

            <article 
              className={styles.blogContent}
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
