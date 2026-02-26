import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Nhà Hàng G26 – Đặt Bàn Trực Tuyến",
  description: "Đặt bàn tại Nhà Hàng G26 dễ dàng, nhanh chóng. Thực đơn phong phú, không gian sang trọng.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body className={inter.variable}>
        {children}
      </body>
    </html>
  );
}
