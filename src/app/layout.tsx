import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import StyledComponentsRegistry from "@/lib/antd-registry";
import QueryProvider from "@/providers/query-provider";
import { ConfigProvider, App } from "antd";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
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
    <html lang="vi" className={`${inter.variable} ${outfit.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-[#f8fafc]" suppressHydrationWarning>
        <StyledComponentsRegistry>
          <ConfigProvider
            theme={{
              token: {
                colorPrimary: "#2563eb", 
                borderRadius: 12,
                fontFamily: "var(--font-inter)",
                colorBgContainer: "#ffffff",
                colorTextBase: "#1e293b",
                wireframe: false,
              },
              components: {
                Button: {
                  controlHeight: 44,
                  borderRadius: 12,
                  fontWeight: 600,
                  boxShadow: 'none',
                },
                Input: {
                  controlHeight: 44,
                  borderRadius: 12,
                },
                Select: {
                  controlHeight: 44,
                  borderRadius: 12,
                },
                Card: {
                  borderRadiusLG: 16,
                  boxShadowTertiary: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
                },
                Table: {
                  borderRadius: 12,
                  headerBg: '#f8fafc',
                  headerColor: '#64748b',
                  headerBorderRadius: 12,
                },
                Tabs: {
                  itemSelectedColor: '#2563eb',
                  inkBarColor: '#2563eb',
                  titleFontSize: 16,
                },
                Statistic: {
                  contentFontSize: 28,
                  titleFontSize: 14,
                }
              },
            }}
          >
            <QueryProvider>
              <App>
                {children}
              </App>
            </QueryProvider>
          </ConfigProvider>
        </StyledComponentsRegistry>
      </body>
    </html>
  );
}
