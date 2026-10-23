'use client';

import React from 'react';
import { Modal, Button, Input, QRCode, Divider, Tag } from 'antd';
import { SurveySubmissionItem } from '@/services/surveyFormService';

const { TextArea } = Input;

interface SurveyModalsProps {
  rejectModalOpen: boolean;
  rejectReason: string;
  isSaving: boolean;
  onCloseRejectModal: () => void;
  onChangeRejectReason: (val: string) => void;
  onConfirmReject: () => void;

  qrModalOpen: boolean;
  onCloseQrModal: () => void;
  fullPublicUrl: string;
  formVersion?: number;

  previewSubmission: SurveySubmissionItem | null;
  onClosePreviewSubmission: () => void;
}

export const SurveyModals = React.memo(function SurveyModals({
  rejectModalOpen,
  rejectReason,
  isSaving,
  onCloseRejectModal,
  onChangeRejectReason,
  onConfirmReject,

  qrModalOpen,
  onCloseQrModal,
  fullPublicUrl,
  formVersion = 1,

  previewSubmission,
  onClosePreviewSubmission,
}: SurveyModalsProps) {
  return (
    <>
      {/* Reject Modal */}
      <Modal
        title="Yêu cầu chỉnh sửa thiết kế biểu mẫu"
        open={rejectModalOpen}
        onCancel={onCloseRejectModal}
        onOk={onConfirmReject}
        confirmLoading={isSaving}
        okText="Gửi yêu cầu chỉnh sửa"
        okType="danger"
        cancelText="Quay lại"
        centered
      >
        <div className="py-2 space-y-3">
          <p className="text-xs text-slate-600">
            Vui lòng nhập lý do hoặc ý kiến chỉ đạo cần chỉnh sửa (nội dung câu hỏi, thang đo, nhóm đối tượng...):
          </p>
          <TextArea
            rows={4}
            value={rejectReason}
            onChange={(e) => onChangeRejectReason(e.target.value)}
            placeholder="Nhập nhận xét / lý do yêu cầu chỉnh sửa..."
            className="text-xs"
          />
        </div>
      </Modal>

      {/* QR Code Modal */}
      <Modal
        title={`Mã QR Khảo sát Công khai (v${formVersion})`}
        open={qrModalOpen}
        onCancel={onCloseQrModal}
        footer={[
          <Button key="close" onClick={onCloseQrModal} className="rounded-lg text-xs">
            Đóng
          </Button>,
        ]}
        centered
      >
        <div className="text-center py-5 space-y-3">
          <div className="flex justify-center p-3 bg-white rounded-xl border border-slate-200 inline-block mx-auto shadow-xs">
            <QRCode value={fullPublicUrl || 'https://euni.edu.vn'} size={200} />
          </div>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Quét mã bằng điện thoại để mở trực tiếp trang điền khảo sát trực tuyến Phiên bản v{formVersion}.
          </p>
        </div>
      </Modal>

      {/* Submission Detail Modal */}
      <Modal
        title={`Chi tiết phiếu khảo sát #${previewSubmission?.id || ''}`}
        open={!!previewSubmission}
        onCancel={onClosePreviewSubmission}
        footer={[
          <Button key="close" onClick={onClosePreviewSubmission} className="rounded-lg text-xs">
            Đóng
          </Button>,
        ]}
        width={650}
        centered
      >
        {previewSubmission && (
          <div className="space-y-3 py-2 max-h-[70vh] overflow-y-auto">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs space-y-1">
              <div>
                <strong>Họ tên:</strong> {previewSubmission.respondentName || 'Ẩn danh'}
              </div>
              <div>
                <strong>Email:</strong> {previewSubmission.respondentEmail || 'N/A'}
              </div>
              <div>
                <strong>Đơn vị:</strong> {previewSubmission.organization || 'N/A'} - {previewSubmission.position || ''}
              </div>
              <div>
                <strong>Thời gian:</strong> {new Date(previewSubmission.submittedAt).toLocaleString('vi-VN')}
              </div>
            </div>

            <Divider className="my-2" />

            <div className="space-y-2">
              {previewSubmission.answers?.map((ans, aIdx) => (
                <div key={aIdx} className="p-3 bg-white rounded-lg border border-slate-100 text-xs space-y-1">
                  <div className="font-semibold text-slate-800">
                    {aIdx + 1}. {ans.questionContent}
                  </div>
                  <div className="text-slate-600">
                    {ans.questionType === 'LIKERT_SCALE' && (
                      <Tag color="blue" className="text-xs">
                        Mức đánh giá: {ans.numericValue} / 5
                      </Tag>
                    )}
                    {(ans.questionType === 'SINGLE_CHOICE' || ans.questionType === 'MULTIPLE_CHOICE') && (
                      <div>{ans.selectedOptions?.join(', ') || 'Không chọn'}</div>
                    )}
                    {(ans.questionType === 'SHORT_TEXT' || ans.questionType === 'LONG_TEXT') && (
                      <div>{ans.textValue || 'Không có câu trả lời'}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
});
