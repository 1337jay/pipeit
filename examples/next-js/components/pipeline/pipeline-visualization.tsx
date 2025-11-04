'use client';

import { motion } from 'motion/react';
import { useMemo } from 'react';
import { TransactionStepNode } from './transaction-step-node';
import { BatchGroup } from './batch-group';
import type { VisualPipeline } from '@/lib/visual-pipeline';
import { usePipelineState } from '@/lib/use-visual-pipeline';

interface PipelineVisualizationProps {
  visualPipeline: VisualPipeline;
  strategy?: 'auto' | 'batch' | 'sequential';
}

export function PipelineVisualization({
  visualPipeline,
  strategy = 'auto',
}: PipelineVisualizationProps) {
  const pipelineState = usePipelineState(visualPipeline);

  // Determine which steps are batched together (for 'auto' and 'batch' strategies)
  const batchGroups = useMemo(() => {
    if (strategy === 'sequential') {
      // No batching in sequential mode
      return [];
    }

    // Group consecutive instruction steps into batches
    const groups: string[][] = [];
    let currentBatch: string[] = [];

    visualPipeline.steps.forEach((step) => {
      if (step.type === 'instruction') {
        currentBatch.push(step.name);
      } else {
        // Transaction step breaks the batch
        if (currentBatch.length > 0) {
          groups.push([...currentBatch]);
          currentBatch = [];
        }
        // Transaction steps are not batched
      }
    });

    // Add final batch if exists
    if (currentBatch.length > 0) {
      groups.push(currentBatch);
    }

    return groups;
  }, [visualPipeline.steps, strategy]);

  // Build render items (either batch groups or individual steps)
  const renderItems = useMemo(() => {
    const items: Array<{ type: 'batch'; stepNames: string[]; batchIndex: number } | { type: 'step'; stepName: string; stepType: 'instruction' | 'transaction' }> = [];
    let processedSteps = new Set<string>();

    visualPipeline.steps.forEach((step) => {
      // Skip if already processed as part of a batch
      if (processedSteps.has(step.name)) return;

      // Check if step is in a batch
      const batchIndex = batchGroups.findIndex((group) => group.includes(step.name));
      const isFirstInBatch = batchIndex >= 0 && batchGroups[batchIndex]?.[0] === step.name;

      if (isFirstInBatch && batchIndex >= 0) {
        // Add batch group
        items.push({
          type: 'batch',
          stepNames: batchGroups[batchIndex],
          batchIndex,
        });
        // Mark all steps in batch as processed
        batchGroups[batchIndex].forEach((name) => processedSteps.add(name));
      } else {
        // Add individual step
        items.push({
          type: 'step',
          stepName: step.name,
          stepType: step.type,
        });
        processedSteps.add(step.name);
      }
    });

    return items;
  }, [visualPipeline.steps, batchGroups]);

  return (
    <div className="w-full overflow-x-auto py-8">
      <div className="flex flex-col items-center gap-8 min-w-max px-8">
        {/* Render items */}
        {renderItems.map((item, index) => (
          <div key={index} className="flex items-center">
            {/* Arrow from previous item */}
            {index > 0 && (
              <motion.div
                className="w-12 h-0.5 bg-gray-300 mx-4"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: index * 0.1 }}
              />
            )}

            {/* Render batch group or individual step */}
            {item.type === 'batch' ? (
              <BatchGroup
                visualPipeline={visualPipeline}
                stepNames={item.stepNames}
                batchIndex={item.batchIndex}
              />
            ) : (
              <TransactionStepNode
                visualPipeline={visualPipeline}
                stepName={item.stepName}
                stepType={item.stepType}
                isBatched={false}
              />
            )}
          </div>
        ))}

        {/* Pipeline state indicator */}
        <motion.div
          className="mt-4 text-sm font-mono text-gray-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Status: {pipelineState}
        </motion.div>
      </div>
    </div>
  );
}

