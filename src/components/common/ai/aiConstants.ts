export const getDefaultPrompts = (type?: string): string[] => {
  switch (type?.toUpperCase()) {
    case 'S2_ALL':
    case 'PO_PLO_MATRIX':
    case 'STEP2_ALL':
      return [
        'Soạn trọn bộ Mục tiêu (PO), Chuẩn đầu ra (PLO & PI) và Ma trận tương quan theo chuẩn AUN-QA',
        'Đề xuất toàn diện khung PO - PLO 4 nhóm chuẩn kiểm định và ma trận đối sánh đầy đủ',
        'Tối ưu hóa mục tiêu nghề nghiệp dài hạn gắn liền chỉ số đo lường PI và ma trận tương thích',
      ];
    case 'S5_ALL':
    case 'STEP5_ALL':
      return [
        'Đề xuất trọn bộ Đề cương: Mô tả học phần, Mục tiêu (CO), Chuẩn đầu ra (CLO) theo Bloom và Ma trận ánh xạ PI',
        'Tối ưu hóa toàn diện Mục tiêu CO và Chuẩn đầu ra CLO theo chuẩn kiểm định AUN-QA',
        'Đề xuất trọn vẹn CO, CLO từ cấp độ Bloom 3-5 và liên kết trực tiếp vào các PI của CTĐT',
      ];
    case 'PO':
    case 'PEO':
      return [
        'Soạn Mục tiêu chung & các PO cụ thể cho chương trình đào tạo chuẩn OBE',
        'Bổ sung PO về năng lực thiết kế, quản lý dự án & đạo đức nghề nghiệp',
        'Tối ưu PO định hướng phát triển sự nghiệp 3-5 năm sau tốt nghiệp theo chuẩn kiểm định AUN-QA',
      ];
    case 'PLO':
      return [
        'Soạn bộ PLO chương trình đào tạo chuẩn kiểm định AUN-QA / MOET',
        'Bổ sung các chỉ số hiệu quả PI đo lường cho từng PLO',
        'Đề xuất PLO theo 4 nhóm: Kiến thức, Kỹ năng, Mức tự chủ và Phẩm chất nghề nghiệp',
      ];
    case 'CO':
      return [
        'Đề xuất bộ Mục tiêu học phần (CO) gồm Kiến thức, Kỹ năng và Mức độ tự chủ/trách nhiệm theo Thông tư 17',
        'Tối ưu CO theo thang đo Bloom và chuẩn kiểm định chất lượng',
        'Bổ sung mục tiêu học phần về năng lực làm việc nhóm và giải quyết vấn đề thực tiễn',
      ];
    case 'CLO':
      return [
        'Soạn bộ 3-6 Chuẩn đầu ra (CLO) đo lường được theo thang đo Bloom từ cấp độ 3 đến 5',
        'Đề xuất CLO chuẩn kỹ năng chuyên môn, thực hành và giải quyết vấn đề thực tiễn',
        'Tối ưu hóa CLO theo chuẩn kiểm định chất lượng AUN-QA và thang đo năng lực',
      ];
    case 'CLO_PLO_MATRIX':
    case 'CLO_PI_MATRIX':
      return [
        'Phân tích ngữ nghĩa nội dung CLO và đề xuất ma trận đối sánh vào các PI phù hợp nhất của CTĐT',
        'Tối ưu hóa phân bổ ma trận đóng góp để mỗi CLO đều tham gia đạt được ít nhất một PI',
      ];
    case 'COURSE_DESCRIPTION':
      return [
        'Soạn mô tả tổng quan học phần hấp dẫn & chuẩn học thuật đại học',
        'Tóm tắt mục tiêu, vai trò và giá trị cốt lõi sinh viên tích lũy được',
      ];
    case 'FACILITIES':
    case 'FACILITIES_REQUIREMENTS':
      return [
        'Đề xuất cấu hình phòng máy tính, hệ điều hành, công cụ lập trình và phần cứng phục vụ thực hành cho học phần',
        'Liệt kê chi tiết phần mềm mã nguồn mở và môi trường phát triển (IDE/SDK) cần thiết cho môn học',
        'Tối ưu hóa yêu cầu phòng thực hành và thiết bị đo kiểm/mô phỏng phù hợp với các chuẩn đầu ra CLO',
      ];
    case 'PO_PI_MATRIX':
    case 'MATRIX':
    case 'MATRIX_PO_PI':
      return [
        'Kiểm tra tính hợp lệ của dữ liệu PO, PLO, PI và đề xuất ma trận tích hợp chuẩn OBE',
        'Đối sánh ngữ nghĩa và gợi ý các tích chọn PO ↔ PI phù hợp nhất',
        'Tối ưu hóa phân bổ ma trận đóng góp để không có PI mồ côi',
      ];
    case 'SURVEY_QUESTIONS':
    case 'SURVEY':
    case 'KHAO_SAT':
    case 'KHAO_SAT_CAU_HOI':
    case 'S1_ALL':
      return [
        'Đề xuất bộ câu hỏi khảo sát Doanh nghiệp & Nhà tuyển dụng về nhu cầu nhân lực và kiến thức/kỹ năng cần thiết',
        'Đề xuất bộ câu hỏi khảo sát Cựu sinh viên về mức độ đáp ứng của CTĐT với thực tế công việc',
        'Đề xuất bộ câu hỏi khảo sát Sinh viên về chất lượng giảng dạy, cơ sở vật chất và trải nghiệm học tập',
        'Đề xuất khảo sát Chuyên gia & Giảng viên về tính cập nhật và khung kiến thức của CTĐT theo chuẩn AUN-QA',
      ];
    default:
      return [
        'Soạn thảo nội dung học thuật chi tiết và đo lường được',
        'Tối ưu chuẩn hóa văn phong sư phạm theo chuẩn MOET',
      ];
  }
};
