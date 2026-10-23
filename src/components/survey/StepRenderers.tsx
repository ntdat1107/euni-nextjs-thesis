'use client';

import React, { forwardRef } from 'react';
import S1SurveyBuilderRenderer, { S1SurveyBuilderRef, S1SurveyBuilderRendererProps } from './renderers/S1SurveyBuilderRenderer';
import S2PLORenderer, { S2PLORef } from './renderers/S2PLORenderer';
import S3StructureCourseRenderer from './renderers/S3StructureCourseRenderer';
import S5CLORenderer from './renderers/S5CLORenderer';
import S6MatrixRenderer from './renderers/S6MatrixRenderer';

export type { S1SurveyBuilderRef, S1SurveyBuilderRendererProps };

// --- S1_KHAO_SAT_NHU_CAU Renderer ---
export const S1_KHAO_SAT_NHU_CAU_Renderer = forwardRef<
  S1SurveyBuilderRef,
  S1SurveyBuilderRendererProps
>(({ step, readonly, data, onChange, onRefreshStep, onFormLoaded }, ref) => {
  return (
    <S1SurveyBuilderRenderer
      ref={ref}
      step={step}
      readonly={readonly}
      data={data}
      onChange={onChange}
      onRefreshStep={onRefreshStep}
      onFormLoaded={onFormLoaded}
    />
  );
});
S1_KHAO_SAT_NHU_CAU_Renderer.displayName = 'S1_KHAO_SAT_NHU_CAU_Renderer';

// --- S2_PLO Renderer ---
export const S2_PLO_Renderer = forwardRef<S2PLORef, { step?: any; readonly: boolean; data?: any; onChange?: (data: any) => void }>(
  ({ readonly, data, onChange }, ref) => {
    return <S2PLORenderer ref={ref} data={data} readonly={readonly} onChange={onChange} />;
  }
);
S2_PLO_Renderer.displayName = 'S2_PLO_Renderer';

// --- S3_XacDinhCauTruc_KhoiLuongKienThuc Renderer ---
export function S3_XacDinhCauTruc_KhoiLuongKienThuc_Renderer({ step, campaign, readonly, data, onChange }: { step: any; campaign?: any; readonly: boolean; data?: any; onChange?: (data: any) => void }) {
  return <S3StructureCourseRenderer step={step} campaign={campaign} readonly={readonly} data={data} onChange={onChange} />;
}

// --- S5_CLO Renderer ---
export function S5_CLO_Renderer({ step, readonly, data, onChange }: { step: any; readonly: boolean; data?: any; onChange?: (data: any) => void }) {
  return <S5CLORenderer data={data} readonly={readonly} onChange={onChange} />;
}

// --- S6_MATRIX Renderer ---
export function S6_MATRIX_Renderer({ step, readonly, data, onChange }: { step: any; readonly: boolean; data?: any; onChange?: (data: any) => void }) {
  return <S6MatrixRenderer data={data} readonly={readonly} onChange={onChange} />;
}

// Mapping object for easy lookup in the main page
export const StepRenderers: Record<string, React.FC<any>> = {
  S1_KHAO_SAT_NHU_CAU: S1_KHAO_SAT_NHU_CAU_Renderer,
  S2_PLO: S2_PLO_Renderer,
  S3_XacDinhCauTruc_KhoiLuongKienThuc: S3_XacDinhCauTruc_KhoiLuongKienThuc_Renderer,
  S3_STRUCTURE: S3_XacDinhCauTruc_KhoiLuongKienThuc_Renderer,
  S5_CLO: S5_CLO_Renderer,
  S6_MATRIX: S6_MATRIX_Renderer,
};

export default StepRenderers;
