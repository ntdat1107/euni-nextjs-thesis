'use client';

import React from 'react';
import S2PLORenderer from './renderers/S2PLORenderer';
import S5CLORenderer from './renderers/S5CLORenderer';
import S6MatrixRenderer from './renderers/S6MatrixRenderer';

// --- S2_PLO Renderer ---
export function S2_PLO_Renderer({ step, readonly, data, onChange }: { step: any; readonly: boolean; data?: any; onChange?: (data: any) => void }) {
  return <S2PLORenderer data={data} readonly={readonly} onChange={onChange} />;
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
  S2_PLO: S2_PLO_Renderer,
  S5_CLO: S5_CLO_Renderer,
  S6_MATRIX: S6_MATRIX_Renderer,
};

export default StepRenderers;
