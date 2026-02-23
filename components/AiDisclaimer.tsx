
import React from 'react';

interface AiDisclaimerProps {
    isDarkMode?: boolean;
}

export const AiDisclaimer: React.FC<AiDisclaimerProps> = ({ isDarkMode = true }) => {
  return (
    <div className={`text-center text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-600'} mt-4 max-w-lg mx-auto leading-relaxed`}>
      AI can make mistakes and be biased even when it appears to be correct and unbiased. You should always use your judgement when using responses from AI and take responsibility for how you use it.
    </div>
  );
};
