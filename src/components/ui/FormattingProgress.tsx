import { TextLoop } from '@/components/core/text-loop';
import { motion, AnimatePresence } from 'framer-motion';

export type FormattingStep = 
  | 'analyzing'
  | 'summary'
  | 'toc'
  | 'content';

interface FormattingProgressProps {
  currentStep: FormattingStep;
}

const steps = {
  analyzing: 'Analyzing document structure...',
  summary: 'Creating summary...',
  toc: 'Generating table of contents...',
  content: 'Formatting content and headings...'
};

export function FormattingProgress({ currentStep }: FormattingProgressProps) {
  return (
    <div className="flex items-center gap-2 text-[#505258] w-full">
      <div className="w-5 h-5 shrink-0">
        <svg className="animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
      <div className="text-[14px] font-medium font-['Inter var'] flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {steps[currentStep]}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
} 