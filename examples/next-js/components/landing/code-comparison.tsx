'use client';

import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { CodeBlock } from '@/components/code/code-block';

interface CodeComparisonProps {
    beforeTitle: string;
    beforeDescription?: string;
    beforeCode: string;
    afterTitle: string;
    afterDescription?: string;
    afterCode: string;
}

export function CodeComparison({
    beforeTitle,
    beforeDescription,
    beforeCode,
    afterTitle,
    afterDescription,
    afterCode,
}: CodeComparisonProps) {
    return (
        <section
            className="py-16 border-t border-sand-200"
            style={{
                backgroundImage: `repeating-linear-gradient(
              45deg,
              transparent,
              transparent 10px,
              rgba(233, 231, 222, 0.5) 10px,
              rgba(233, 231, 222, 0.5) 11px
            )`,
            }}
        >
            <div className="max-w-7xl mx-auto">
                <h2 className="text-h2 text-gray-900 mb-2 text-center">
                    Write less boilerplate, keep your code simple.
                </h2>
                <p className="text-body-xl text-gray-600 mb-12 text-center max-w-2xl mx-auto">
                    PipeIt simplifies Solana Kit's API and adds opinionated features like automatic retry, priority
                    fees, smart defaults, and more.
                </p>
                <div className="bg-white grid grid-cols-1 lg:grid-cols-2 border-t border-b border-sand-200">
                    <div className="bg-[var(--color-bg1)] p-6">
                        <div className="mb-4">
                            <h3 className="text-body-lg font-abc-diatype font-bold text-gray-900">{beforeTitle}</h3>
                            {beforeDescription && (
                                <p className="text-xs font-berkeley-mono text-gray-600 mt-1">{beforeDescription}</p>
                            )}
                        </div>
                        <CodeBlock
                            code={beforeCode}
                            style={oneLight}
                            showLineNumbers
                            customStyle={{
                                margin: 0,
                                borderRadius: '0.5rem',
                                fontSize: '0.75rem',
                                lineHeight: '1.25rem',
                            }}
                        />
                    </div>
                    <div className="bg-[var(--color-bg1)] border-l border-sand-300 p-6">
                        <div className="mb-4">
                            <h3 className="text-body-lg font-abc-diatype font-bold text-gray-900">{afterTitle}</h3>
                            {afterDescription && (
                                <p className="text-xs font-berkeley-mono text-gray-600 mt-1">{afterDescription}</p>
                            )}
                        </div>
                        <CodeBlock
                            code={afterCode}
                            style={oneLight}
                            showLineNumbers
                            customStyle={{
                                margin: 0,
                                borderRadius: '0.5rem',
                                fontSize: '0.75rem',
                                lineHeight: '1.25rem',
                            }}
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}
