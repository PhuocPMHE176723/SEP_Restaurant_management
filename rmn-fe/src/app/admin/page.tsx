"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/manager");
  }, [router]);

  return (
    <div style={{ 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center", 
      minHeight: "100svh", 
      background: "#0f172a", 
      color: "#94a3b8",
      fontSize: "0.9rem" 
    }}>
      Redirecting to management portal...
    </div>
  );
}
