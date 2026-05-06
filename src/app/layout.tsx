import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import StyledComponentsRegistry from "@/lib/antd-registry";
import QueryProvider from "@/providers/query-provider";
import { ConfigProvider } from "antd";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "eUni - Hệ Thống Tác Nghiệp Số Xây Dựng Và Cập Nhật CTDT",
  description: "Hệ thống quản lý quy trình xây dựng và cập nhật chương trình đào tạo",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <StyledComponentsRegistry>
          <ConfigProvider
            theme={{
              token: {
                colorPrimary: "#16559d", // brand-600
                borderRadius: 8,
                fontFamily: "var(--font-inter)",
              },
              components: {
                Button: {
                  controlHeight: 40,
                  borderRadius: 8,
                },
                Input: {
                  controlHeight: 40,
                },
                Select: {
                  controlHeight: 40,
                },
              },
            }}
          >
            <QueryProvider>
              {children}
            </QueryProvider>
          </ConfigProvider>
        </StyledComponentsRegistry>
      </body>
    </html>
  );
}
