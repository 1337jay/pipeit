'use client';

import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { PipelineVisualization } from '@/components/pipeline';
import {
  useSimpleTransferPipeline,
  simpleTransferCode,
  useBatchedTransfersPipeline,
  batchedTransfersCode,
  useMixedPipeline,
  mixedPipelineCode,
} from '@/components/pipeline/examples';
import { useGillTransactionSigner, useConnectorClient } from '@solana/connector';
import { createSolanaRpc, createSolanaRpcSubscriptions } from 'gill';
import { ConnectButton } from '@/components/connector';

interface PipelineExampleConfig {
  id: string;
  name: string;
  description: string;
  hook: () => ReturnType<typeof useSimpleTransferPipeline>;
  code: string;
}

const pipelineExamples: PipelineExampleConfig[] = [
  {
    id: 'simple-transfer',
    name: 'Simple Transfer',
    description: 'Single instruction, single transaction - baseline example',
    hook: useSimpleTransferPipeline,
    code: simpleTransferCode,
  },
  {
    id: 'batched-transfers',
    name: 'Batched Transfers',
    description: 'Multiple transfers batched into one atomic transaction',
    hook: useBatchedTransfersPipeline,
    code: batchedTransfersCode,
  },
  {
    id: 'mixed-pipeline',
    name: 'Mixed Pipeline',
    description: 'Instruction and transaction steps - shows when batching breaks',
    hook: useMixedPipeline,
    code: mixedPipelineCode,
  },
];

function PipelineExampleCard({ example }: { example: PipelineExampleConfig }) {
  const [strategy, setStrategy] = useState<'auto' | 'batch' | 'sequential'>('auto');
  const [isExecuting, setIsExecuting] = useState(false);

  const visualPipeline = example.hook();

  const { signer, ready } = useGillTransactionSigner();
  const client = useConnectorClient();

  const handleExecute = async () => {
    if (!visualPipeline || !signer || !client) {
      alert('Please connect your wallet first');
      return;
    }

    setIsExecuting(true);
    visualPipeline.reset();

    try {
      const rpcUrl = client.getRpcUrl();
      if (!rpcUrl) {
        throw new Error('No RPC endpoint configured');
      }

      const rpc = createSolanaRpc(rpcUrl);
      const rpcSubscriptions = createSolanaRpcSubscriptions(rpcUrl.replace('http', 'ws'));

      await visualPipeline.execute({
        signer,
        rpc,
        rpcSubscriptions,
        strategy,
        commitment: 'confirmed',
      });
    } catch (error) {
      console.error('Pipeline execution failed:', error);
      alert(`Execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <section className="py-16 border-b border-sand-200 last:border-b-0">
      <div className="grid grid-cols-12 gap-8">
        {/* Left column: Title and Description */}
        <div className="col-span-4 flex flex-col justify-start px-6">
          <h2 className="text-2xl font-abc-diatype-medium text-gray-900 mb-2">{example.name}</h2>
          <p className="text-sm font-berkeley-mono text-gray-600">{example.description}</p>
        </div>

        {/* Right column: Tabs with Visualization and Code */}
        <div className="col-span-8 px-6">
          <Tabs defaultValue="visualization" className="w-full">
            {/* Strategy buttons and Tabs on same row with justify-between */}
            <div className="flex justify-between items-center mb-4">
              {/* Tabs */}
              <TabsList>
                <TabsTrigger value="visualization">Visualization</TabsTrigger>
                <TabsTrigger value="code">Code</TabsTrigger>
              </TabsList>
            {/* Strategy switcher buttons and Connect Button */}
            <div className="flex flex-row gap-2 flex-nowrap items-center">
                {(['auto', 'batch', 'sequential'] as const).map((s) => (
                  <Button
                    key={s}
                    variant={strategy === s ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setStrategy(s);
                      visualPipeline.reset();
                    }}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </Button>
                ))}
                <div className="h-12 w-px bg-gradient-to-b from-transparent via-sand-800 to-transparent" />
                <ConnectButton />
              </div>
            </div>

            <TabsContent value="visualization" className="">
              <Card className="border-sand-300 bg-sand-100/30 rounded-xl shadow-sm max-h-[420px] min-h-[420px]"
              style={{
                backgroundImage: `repeating-linear-gradient(
                  45deg,
                  transparent,
                  transparent 10px,
                  rgba(233, 231, 222, 0.5) 10px,
                  rgba(233, 231, 222, 0.5) 11px
                )`
              }}
              >
                <CardContent className="">
                  <PipelineVisualization visualPipeline={visualPipeline} strategy={strategy} />

                  {/* Execute button */}
                  <div className="mt-4">
                    <Button
                      onClick={handleExecute}
                      disabled={!ready || isExecuting}
                      className="w-full"
                    >
                      {isExecuting ? 'Executing...' : 'Execute Pipeline'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="code" className="mt-0">
              <Card className="border-sand-300 bg-white rounded-xl shadow-sm max-h-[405px] min-h-[405px] overflow-y-auto">
                <CardContent className="">
                  <SyntaxHighlighter
                    language="typescript"
                    style={oneLight}
                    customStyle={{
                      margin: 0,
                      borderRadius: '0.5rem',
                      fontSize: '0.75rem',
                      lineHeight: '1.25rem',
                    }}
                    showLineNumbers
                  >
                    {example.code}
                  </SyntaxHighlighter>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </section>
  );
}

export default function PlaygroundPage() {
  return (
    <div className="max-w-7xl mx-auto min-h-screen bg-bg1 border-r border-l border-sand-200">
      <main className="container mx-auto">
        <section className="py-16 border-b border-sand-200"
        style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 10px,
            rgba(233, 231, 222, 0.5) 10px,
            rgba(233, 231, 222, 0.5) 11px
          )`
        }}>
          <div className="max-w-7xl mx-auto">
            <h1 className="text-h2 text-gray-900 mb-2 text-center text-pretty">
              PipeIt Playground
            </h1>
            <p className="text-body-xl text-gray-600 text-center max-w-3xl mx-auto">
              Interactive real mainnet examples of multi-step pipelines and atomic transactions
            </p>
          </div>
        </section>

        {pipelineExamples.map((example) => (
          <PipelineExampleCard key={example.id} example={example} />
        ))}
      </main>
    </div>
  );
}

