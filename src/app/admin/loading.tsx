'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="w-full h-[60vh] flex items-center justify-center bg-white/50 backdrop-blur-sm rounded-2xl border border-slate-100 shadow-sm animate-in fade-in duration-500">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <Loader2 className="w-12 h-12 text-brand-600 animate-spin" />
          <div className="absolute inset-0 w-12 h-12 rounded-full border-4 border-brand-100 opacity-20"></div>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-lg font-bold text-slate-700 tracking-tight">Đang chuẩn bị dữ liệu...</span>
          <span className="text-sm text-slate-400">Vui lòng đợi trong giây lát</span>
        </div>
      </div>
    </div>
  );
}
