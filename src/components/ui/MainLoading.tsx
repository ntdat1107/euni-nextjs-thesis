'use client';

import React from 'react';
import { useIsFetching } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

const MainLoading = () => {
  const isFetching = useIsFetching();
  const [shouldShow, setShouldShow] = React.useState(false);

  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isFetching > 0) {
      // Delay showing the loader to avoid flashing on fast requests
      timer = setTimeout(() => setShouldShow(true), 200);
    } else {
      setShouldShow(false);
    }
    return () => clearTimeout(timer);
  }, [isFetching]);

  if (!shouldShow) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-[2px] transition-all duration-150 animate-in fade-in">
      <div className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-white shadow-xl border border-slate-100">
        <div className="relative">
          <Loader2 className="w-10 h-10 text-brand-600 animate-spin" />
          <div className="absolute inset-0 w-10 h-10 rounded-full border-4 border-brand-100 opacity-20"></div>
        </div>
        <span className="text-sm font-bold text-slate-600 tracking-tight">Đang tải dữ liệu...</span>
      </div>
    </div>
  );
};

export default MainLoading;
