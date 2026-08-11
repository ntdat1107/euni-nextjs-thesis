import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

const LOREM_HTML_PARAGRAPHS = [
  `<p><strong>Chuẩn đầu ra (CLO) & Nội dung chương trình:</strong> Môn học này nhằm trang bị cho sinh viên kiến thức chuyên sâu về nguyên lý xây dựng hệ thống phần mềm quy mô lớn, áp dụng các kiến thức thực tiễn và tuân thủ các tiêu chuẩn kiểm định chất lượng giáo dục hiện hành.</p>`,
  `<p>Sinh viên sau khi hoàn thành học phần có khả năng:</p>`,
  `<ul>
    <li><strong>CLO 1:</strong> Phân tích và thiết kế kiến trúc phần mềm đáp ứng các yêu cầu phi chức năng (Hiệu năng, Bảo mật, Khả năng mở rộng).</li>
    <li><strong>CLO 2:</strong> Áp dụng các quy trình phát triển phần mềm hiện đại (Agile/Scrum, CI/CD, Automated Testing) vào dự án thực tế.</li>
    <li><strong>CLO 3:</strong> Đánh giá và lựa chọn công nghệ phù hợp cho từng bài toán nghiệp vụ phức tạp.</li>
  </ul>`,
  `<p><em>Ghi chú: Dữ liệu được hỗ trợ tạo tự động bởi AI Assistant của Hệ thống eUni.</em></p>`
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const authHeader = req.headers.get('authorization');

    const rawBackendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
    const backendUrl = rawBackendUrl.replace(/\/api\/?$/, '');
    const response = await fetch(`${backendUrl}/api/ai/generate-stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { 'Authorization': authHeader } : {}),
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Backend API error (${response.status}):`, errorText);
      return new Response(JSON.stringify({ error: `Backend error (${response.status}): ${errorText || response.statusText}` }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!response.body) {
      throw new Error('No body in backend response');
    }

    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
