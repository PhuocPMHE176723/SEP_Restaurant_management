import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { AuthProvider } from "../contexts/AuthContext";
import "./globals.css";

const inter = Inter({ subsets: ["latin", "vietnamese"], variable: "--font-inter" });
const playfair = Playfair_Display({ 
  subsets: ["latin", "vietnamese"], 
  variable: "--font-playfair",
  weight: ["400", "700", "900"] 
});

export const metadata: Metadata = {
  title: "Nhà Hàng Khói Quê – Đặt Bàn Trực Tuyến",
  description: "Đặt bàn tại Nhà Hàng Khói Quê dễ dàng, nhanh chóng. Thực đơn phong phú, không gian sang trọng.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body className={`${inter.variable} ${playfair.variable}`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}

