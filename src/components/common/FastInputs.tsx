'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from 'antd';
import type { InputProps } from 'antd';
import type { TextAreaProps } from 'antd/es/input';

const { TextArea } = Input;

export interface FastInputProps extends Omit<InputProps, 'onChange'> {
  value?: string;
  onImmediateChange?: (val: string) => void;
  onDebouncedChange?: (val: string) => void;
  debounceMs?: number;
}

export const FastInput = React.memo(function FastInput({
  value = '',
  onImmediateChange,
  onDebouncedChange,
  debounceMs = 250,
  onBlur,
  ...props
}: FastInputProps) {
  const [localVal, setLocalVal] = useState(value);
  const isFocusedRef = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isFocusedRef.current) {
      setLocalVal(value);
    }
  }, [value]);

  const flush = useCallback(
    (val: string) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      onDebouncedChange?.(val);
    },
    [onDebouncedChange]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalVal(val);
    onImmediateChange?.(val);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      onDebouncedChange?.(val);
    }, debounceMs);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    isFocusedRef.current = false;
    flush(e.target.value);
    onBlur?.(e);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    isFocusedRef.current = true;
    props.onFocus?.(e);
  };

  return (
    <Input
      {...props}
      value={localVal}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
    />
  );
});

export interface FastTextAreaProps extends Omit<TextAreaProps, 'onChange'> {
  value?: string;
  onImmediateChange?: (val: string) => void;
  onDebouncedChange?: (val: string) => void;
  debounceMs?: number;
}

export const FastTextArea = React.memo(function FastTextArea({
  value = '',
  onImmediateChange,
  onDebouncedChange,
  debounceMs = 250,
  onBlur,
  ...props
}: FastTextAreaProps) {
  const [localVal, setLocalVal] = useState(value);
  const isFocusedRef = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isFocusedRef.current) {
      setLocalVal(value);
    }
  }, [value]);

  const flush = useCallback(
    (val: string) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      onDebouncedChange?.(val);
    },
    [onDebouncedChange]
  );

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setLocalVal(val);
    onImmediateChange?.(val);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      onDebouncedChange?.(val);
    }, debounceMs);
  };

  const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    isFocusedRef.current = false;
    flush(e.target.value);
    onBlur?.(e);
  };

  const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    isFocusedRef.current = true;
    props.onFocus?.(e);
  };

  return (
    <TextArea
      {...props}
      value={localVal}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
    />
  );
});
