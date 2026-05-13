// Mock master steps data (shared across workflow modules)
export const MASTER_STEPS_DATA = [
  { id: '1', code: 'STEP_DANG_KY', name: 'Đăng ký hồ sơ', screenCode: 'REGISTRATION_FORM' },
  { id: '2', code: 'STEP_THAM_DINH', name: 'Thẩm định hồ sơ', screenCode: 'REVIEW_FORM' },
  { id: '3', code: 'STEP_PHE_DUYET', name: 'Phê duyệt', screenCode: 'APPROVAL_FORM' },
  { id: '4', code: 'STEP_BO_SUNG', name: 'Yêu cầu bổ sung', screenCode: 'REVISION_FORM' },
  { id: '5', code: 'STEP_BAN_HANH', name: 'Ban hành kết quả', screenCode: 'RESULT_NOTICE' }
];
