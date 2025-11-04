'use client';

import { motion } from 'motion/react';
import { TransactionStepNode } from './transaction-step-node';
import type { VisualPipeline } from '@/lib/visual-pipeline';
import { useStepState } from '@/lib/use-visual-pipeline';

interface BatchGroupProps {
  visualPipeline: VisualPipeline;
  stepNames: string[];
  batchIndex: number;
}

export function BatchGroup({ visualPipeline, stepNames, batchIndex }: BatchGroupProps) {
  // Get signature from first step (all steps in batch share same signature)
  const firstStepState = useStepState(visualPipeline, stepNames[0]);
  const signature = firstStepState.type === 'confirmed' ? firstStepState.signature : null;
  const cost = firstStepState.type === 'confirmed' ? firstStepState.cost : 0;
  const sequentialCost = stepNames.length * 0.000005; // Cost if executed sequentially
  const savings = sequentialCost - cost;

  return (
    <motion.div
      className="relative border-2 border-dashed border-purple-400 rounded-lg p-4 bg-purple-50/50"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Batch header */}
      <div className="absolute -top-3 left-4 bg-purple-100 px-2 py-0.5 rounded text-xs font-mono text-purple-700 border border-purple-300">
        Batch {batchIndex + 1} ({stepNames.length} instructions)
      </div>

      {/* Steps in batch */}
      <div className="flex items-center justify-center gap-4 mt-2">
        {stepNames.map((stepName, index) => {
          const step = visualPipeline.steps.find((s) => s.name === stepName);
          return (
            <div key={stepName} className="flex items-center">
              <TransactionStepNode
                visualPipeline={visualPipeline}
                stepName={stepName}
                stepType={step?.type || 'instruction'}
                isBatched={true}
              />
              {index < stepNames.length - 1 && (
                <motion.div
                  className="w-8 h-0.5 bg-purple-400 mx-2"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: index * 0.1 }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Batch info footer */}
      {signature && (
        <motion.div
          className="mt-4 text-center space-y-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="text-xs font-mono text-gray-600">
            Signature: {signature.slice(0, 8)}...
          </div>
          <div className="text-xs text-green-600 font-medium">
            Saved {savings.toFixed(9)} SOL ({((savings / sequentialCost) * 100).toFixed(0)}%)
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

