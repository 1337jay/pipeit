'use client';

import { AnimatePresence, motion } from 'motion/react';
import { memo, useCallback, useState } from 'react';
import { useStepState } from '@/lib/use-visual-pipeline';
import type { VisualPipeline } from '@/lib/visual-pipeline';
import { cn } from '@/lib/utils';

interface TransactionStepNodeProps {
  visualPipeline: VisualPipeline;
  stepName: string;
  stepType: 'instruction' | 'transaction';
  isBatched?: boolean;
}

function TransactionStepNodeComponent({
  visualPipeline,
  stepName,
  stepType,
  isBatched = false,
}: TransactionStepNodeProps) {
  const state = useStepState(visualPipeline, stepName);
  const [isHovering, setIsHovering] = useState(false);

  const isInstruction = stepType === 'instruction';
  const isFailed = state.type === 'failed';
  const isConfirmed = state.type === 'confirmed';
  const isExecuting = state.type === 'building' || state.type === 'signing' || state.type === 'sending';

  // Color based on state
  const getColorClasses = () => {
    switch (state.type) {
      case 'idle':
        return 'bg-gray-200 text-gray-600 border-gray-300';
      case 'building':
        return 'bg-yellow-400 text-yellow-900 border-yellow-500 animate-pulse';
      case 'signing':
        return 'bg-orange-400 text-orange-900 border-orange-500 animate-pulse';
      case 'sending':
        return 'bg-blue-400 text-blue-900 border-blue-500 animate-pulse';
      case 'confirmed':
        return 'bg-green-400 text-green-900 border-green-500';
      case 'failed':
        return 'bg-red-400 text-red-900 border-red-500';
      default:
        return 'bg-gray-200 text-gray-600 border-gray-300';
    }
  };

  const handleMouseEnter = useCallback(() => {
    setIsHovering(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
  }, []);

  return (
    <div className="relative flex flex-col items-center">
      <motion.div
        className={cn(
          'relative flex items-center justify-center font-mono text-xs font-medium border-2 transition-all',
          isInstruction ? 'rounded-full w-16 h-16' : 'w-16 h-16 rotate-45',
          getColorClasses(),
          isBatched && 'ring-2 ring-purple-300 ring-offset-2'
        )}
        initial={{ scale: 0 }}
        animate={{
          scale: 1,
          y: state.type === 'sending' ? [0, -5, 0] : 0,
        }}
        transition={{
          duration: 0.3,
          y: state.type === 'sending' ? { repeat: Infinity, duration: 1 } : undefined,
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Content inside node */}
        <div className={cn(isInstruction ? '' : '-rotate-45')}>
          {isExecuting ? (
            <motion.div
              className="w-2 h-2 rounded-full bg-white"
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ repeat: Infinity, duration: 0.8 }}
            />
          ) : isConfirmed ? (
            <span className="text-lg">✓</span>
          ) : isFailed ? (
            <span className="text-lg">✗</span>
          ) : (
            <span className="text-xs">{stepName.slice(0, 3)}</span>
          )}
        </div>
      </motion.div>

      {/* Step name label */}
      <motion.div
        className="mt-2 text-xs font-mono text-gray-500 text-center max-w-[80px] truncate"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {stepName}
      </motion.div>

      {/* Signature tooltip on hover */}
      <AnimatePresence>
        {isHovering && isConfirmed && state.type === 'confirmed' && (
          <motion.div
            className="absolute -top-12 left-1/2 -translate-x-1/2 bg-black/90 text-white px-2 py-1 rounded text-xs font-mono whitespace-nowrap z-10"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {state.signature.slice(0, 8)}...
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black/90" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error bubble */}
      <AnimatePresence>
        {isHovering && isFailed && state.type === 'failed' && (
          <motion.div
            className="absolute -top-20 left-1/2 -translate-x-1/2 bg-red-500 text-white px-3 py-2 rounded-lg text-xs max-w-[200px] z-10 shadow-lg"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="font-semibold mb-1">Error</div>
            <div className="text-red-100">{state.error.message}</div>
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-red-500" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export const TransactionStepNode = memo(TransactionStepNodeComponent) as typeof TransactionStepNodeComponent;

