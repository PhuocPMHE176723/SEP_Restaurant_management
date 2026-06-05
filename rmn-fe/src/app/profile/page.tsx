"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header/Header";

export default function ProfilePage() {
  const router = useRouter();
  const { isLoggedIn, user } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    if (!isLoggedIn || !user) {
      router.replace("/login");
      return;
    }

    const isCustomer = user.roles.some(
      (role) => role.toLowerCase() === "customer"
    );

    if (isCustomer) {
      router.replace("/profile/customer");
    } else {
      router.replace("/profile/staff");
    }
  }, [mounted, isLoggedIn, user, router]);

  return (
    <>
      <Header />
      <div style={{ padding: "8rem 2rem", textAlign: "center", color: "#94a3b8" }}>
        <p style={{ fontSize: "1.2rem", marginBottom: "1rem" }}>Đang chuyển hướng...</p>
        <div style={{
          width: "40px",
          height: "40px",
          border: "4px solid #3b82f6",
          borderTopColor: "transparent",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
          margin: "0 auto"
        }} />
        <style jsx>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </>
  );
}
