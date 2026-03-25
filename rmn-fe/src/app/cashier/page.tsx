"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CashierPage() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace("/cashier/reservations");
  }, [router]);

  return null;
}
