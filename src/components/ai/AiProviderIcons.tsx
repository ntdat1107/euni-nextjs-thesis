import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  size?: number;
}

/**
 * Official Google Gemini 4-Pointed Sparkle Star Icon
 */
export function GoogleGeminiIcon({ className = '', size = 20, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <defs>
        <linearGradient id="gemini-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1A73E8" />
          <stop offset="50%" stopColor="#8AB4F8" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>
      </defs>
      <path
        d="M12 2C12 7.52285 7.52285 12 2 12C7.52285 12 12 16.4771 12 22C12 16.4771 16.4771 12 22 12C16.4771 12 12 7.52285 12 2Z"
        fill="url(#gemini-grad)"
      />
      <circle cx="12" cy="12" r="1.5" fill="#FFFFFF" opacity="0.8" />
    </svg>
  );
}

/**
 * Official OpenAI Spiral Hexagonal Rosette Icon
 */
export function OpenAiIcon({ className = '', size = 20, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <path
        d="M20.57 9.34A7.22 7.22 0 0 0 19.9 5.8a7.28 7.28 0 0 0-5.46-3.72 7.37 7.37 0 0 0-6.17 1.83 7.24 7.24 0 0 0-4.08 4.3 7.28 7.28 0 0 0-.25 6.55 7.22 7.22 0 0 0 2.45 2.87v2.32a2.33 2.33 0 0 0 1.16 2.02 2.37 2.37 0 0 0 2.33 0l3.82-2.2v-2.7l-3.32 1.92-1.92-1.11a5.04 5.04 0 0 1-.22-4.45 4.97 4.97 0 0 1 2.8-2.94 5.05 5.05 0 0 1 4.24-.13l1.92-1.11-1.92-1.11a5.07 5.07 0 0 0-4.23-.05 5 5 0 0 0-2.83 2.91 5.08 5.08 0 0 0 .17 4.5l-1.92 1.1a7.24 7.24 0 0 1-.24-6.52 7.2 7.2 0 0 1 4.07-4.32 7.33 7.33 0 0 1 6.13-1.84 7.25 7.25 0 0 1 5.43 3.7 7.18 7.18 0 0 1 .67 3.53 7.2 7.2 0 0 1-.44 2.5l2.06 1.19a7.2 7.2 0 0 0 .43-2.52z"
        fill="#10A37F"
      />
      <path
        d="M17.43 14.66a5.04 5.04 0 0 1-.22 4.45 4.97 4.97 0 0 1-2.8 2.94 5.05 5.05 0 0 1-4.24.13l-1.92 1.11 1.92 1.11a5.07 5.07 0 0 0 4.23.05 5 5 0 0 0 2.83-2.91 5.08 5.08 0 0 0-.17-4.5l1.92-1.1a7.24 7.24 0 0 1 .24 6.52 7.2 7.2 0 0 1-4.07 4.32 7.33 7.33 0 0 1-6.13 1.84 7.25 7.25 0 0 1-5.43-3.7 7.18 7.18 0 0 1-.67-3.53 7.2 7.2 0 0 1 .44-2.5l-2.06-1.19a7.2 7.2 0 0 0-.43 2.52 7.22 7.22 0 0 0 .67 3.54 7.28 7.28 0 0 0 5.46 3.72 7.37 7.37 0 0 0 6.17-1.83 7.24 7.24 0 0 0 4.08-4.3 7.28 7.28 0 0 0 .25-6.55 7.22 7.22 0 0 0-2.45-2.87v-2.32a2.33 2.33 0 0 0-1.16-2.02 2.37 2.37 0 0 0-2.33 0l-3.82 2.2v2.7l3.32-1.92 1.92 1.11z"
        fill="#10A37F"
      />
    </svg>
  );
}

/**
 * Official Anthropic Claude Sunburst Icon
 */
export function AnthropicClaudeIcon({ className = '', size = 20, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M13.62 3.27a.75.75 0 0 0-.84-.27l-5.6 2.05a.75.75 0 0 0-.48.7v4.6c0 .28.16.54.41.67l4.08 2.04v5.39a.75.75 0 0 0 .37.65l5.2 3.03a.75.75 0 0 0 1.13-.65v-6.07a.75.75 0 0 0-.38-.65l-4.14-2.41 3.53-3.53a.75.75 0 0 0 .22-.53V3.75a.75.75 0 0 0-.75-.75h-.35a.75.75 0 0 0-.4.12l-2.01 1.25-.48-1.1z"
        fill="#D97757"
      />
      <circle cx="8" cy="16" r="3" fill="#D97757" opacity="0.9" />
    </svg>
  );
}

/**
 * Official DeepSeek Whale & Starburst Icon
 */
export function DeepSeekIcon({ className = '', size = 20, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <defs>
        <linearGradient id="deepseek-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0066FF" />
          <stop offset="100%" stopColor="#00C4FF" />
        </linearGradient>
      </defs>
      <path
        d="M21.5 13.5C21.5 17.6421 17.6421 21 12.5 21C7.35786 21 3.5 17.6421 3.5 13.5C3.5 9.35786 7.35786 6 12.5 6C14.2 6 15.8 6.4 17.1 7.1C18.6 5.5 20.6 4.8 21 5C21.4 5.2 21 7.5 19.8 9.3C20.9 10.5 21.5 11.9 21.5 13.5Z"
        fill="url(#deepseek-grad)"
      />
      <circle cx="9" cy="12" r="1.5" fill="#FFFFFF" />
      <path
        d="M13 14C14.5 14 16 13 16 13"
        stroke="#FFFFFF"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Custom / Local LLM (Ollama, vLLM, On-Premise) Icon
 */
export function CustomAiIcon({ className = '', size = 20, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <rect x="3" y="4" width="18" height="16" rx="4" fill="#F8FAFC" stroke="#64748B" strokeWidth="1.5" />
      <path d="M7 10L10 13L7 16" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13 16H17" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
      <circle cx="18" cy="7" r="1.5" fill="#10B981" />
    </svg>
  );
}

export function getProviderIcon(provider?: string, size = 20) {
  switch (provider?.toUpperCase()) {
    case 'GEMINI':
      return <GoogleGeminiIcon size={size} />;
    case 'OPENAI':
      return <OpenAiIcon size={size} />;
    case 'ANTHROPIC':
      return <AnthropicClaudeIcon size={size} />;
    case 'DEEPSEEK':
      return <DeepSeekIcon size={size} />;
    case 'CUSTOM':
    default:
      return <CustomAiIcon size={size} />;
  }
}
