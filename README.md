# eUni - Hệ Thống Tác Nghiệp Số (Next.js Version)

Đây là dự án Frontend được khởi tạo cho đề án tốt nghiệp với độ phức tạp cao về quy trình và bảo mật.

## Tech Stack
- **Framework**: Next.js 15+ (App Router)
- **Styling**: Tailwind CSS v4
- **UI Library**: Ant Design (với SSR support)
- **Data Fetching**: TanStack Query (React Query) + Axios
- **Icons**: Lucide React
- **Workflow**: bpmn-js (Hiển thị sơ đồ Camunda)
- **Validation**: React Hook Form + Zod

## Cấu trúc thư mục
- `src/app`: Định nghĩa các route và layout (App Router)
- `src/components/layout`: Các thành phần giao diện chính (Sidebar, Topbar, AppShell)
- `src/components/ui`: Các thành phần UI dùng chung và các thư viện như WorkflowViewer
- `src/lib`: Các tiện ích cấu hình (API client, Tailwind utils, AntD registry)
- `src/providers`: Các provider cho React context (Query Client)
- `src/services`: Các file gọi API theo nghiệp vụ
- `src/types`: Định nghĩa các interface và type TypeScript

## Bắt đầu
1. Cài đặt dependencies (đã thực hiện):
   ```bash
   npm install
   ```
2. Chạy môi trường phát triển:
   ```bash
   npm run dev
   ```
3. Truy cập: `http://localhost:3000`

## Quy trình nghiệp vụ (Camunda)
Hệ thống đã tích hợp `bpmn-js` để hiển thị các quy trình từ Camunda. Bạn có thể xem mẫu tại `/workflow/templates`.

## Bảo mật và Phân quyền (Casbin)
Frontend đã được chuẩn bị cấu hình để tích hợp với hệ thống phân quyền Casbin từ Backend.
