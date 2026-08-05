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
    const { prompt, action } = await req.json();

    const textToStream = LOREM_HTML_PARAGRAPHS.join('\n');
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        // Break text into small chunks to simulate real streaming speed
        const chunkSize = 15;
        for (let i = 0; i < textToStream.length; i += chunkSize) {
          const chunk = textToStream.slice(i, i + chunkSize);
          controller.enqueue(encoder.encode(chunk));
          // Small delay between chunks
          await new Promise((resolve) => setTimeout(resolve, 40));
        }
        controller.close();
      },
    });

    return new Response(stream, {
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
