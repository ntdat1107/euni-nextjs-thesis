import { useState, useRef, useEffect, useCallback } from 'react';

interface UseAiStreamOptions {
  onCompleted?: () => void;
}

export const useAiStream = (options?: UseAiStreamOptions) => {
  const [streamedText, setStreamedText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasCompletedStream, setHasCompletedStream] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const clearStream = useCallback(() => {
    setStreamedText('');
    setIsGenerating(false);
    setHasCompletedStream(false);
    setErrorMsg(null);
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startStream = useCallback(async (response: Response) => {
    if (!response.body) throw new Error('ReadableStream not supported');
    setIsGenerating(true);
    setStreamedText('');
    setErrorMsg(null);
    setHasCompletedStream(false);

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';
    let buffer = '';
    let charQueue = '';
    let displayedLength = 0;
    let streamFinished = false;

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      if (displayedLength < charQueue.length) {
        const diff = charQueue.length - displayedLength;
        displayedLength = Math.min(displayedLength + (diff > 200 ? 12 : diff > 80 ? 6 : 3), charQueue.length);
        setStreamedText(charQueue.slice(0, displayedLength));
      } else if (streamFinished) {
        if (timerRef.current) clearInterval(timerRef.current);
        setStreamedText(charQueue);
        setHasCompletedStream(true);
        setIsGenerating(false);
        options?.onCompleted?.();
      }
    }, 15);

    try {
      while (true) {
        const { done, value: chunk } = await reader.read();
        if (done) break;
        buffer += decoder.decode(chunk, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (line.trim().startsWith('data:')) fullText += line.slice(line.indexOf('data:') + 5);
          else if (line.trim() && !line.trim().startsWith(':')) fullText += line;
        }
        charQueue = fullText;
      }
      if (buffer.trim()) fullText += buffer.startsWith('data:') ? buffer.slice(5) : buffer;
      charQueue = fullText;
      streamFinished = true;
    } catch (err: any) {
      console.error('AI Stream read error:', err);
      setErrorMsg('Không thể kết nối đến AI service hoặc lỗi xác thực khóa API.');
      setIsGenerating(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [options]);

  return {
    streamedText,
    isGenerating,
    setIsGenerating,
    hasCompletedStream,
    errorMsg,
    setErrorMsg,
    clearStream,
    startStream,
  };
};
