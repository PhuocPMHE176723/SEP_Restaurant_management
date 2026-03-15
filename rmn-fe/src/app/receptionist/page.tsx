"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ReceptionistPage() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace("/receptionist/reservations");
  }, [router]);

  return null;
}
