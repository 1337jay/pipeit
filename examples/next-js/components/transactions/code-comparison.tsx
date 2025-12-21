'use client';

import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CodeBlock } from '@/components/code/code-block';

interface CodeComparisonProps {
    title: string;
    code: string;
}

export function CodeComparison({ title, code }: CodeComparisonProps) {
    return (
        <Card className="">
            <CardHeader className="pb-3">
                <CardTitle className="text-body-md font-berkeley-mono">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <CodeBlock
                    code={code}
                    style={vscDarkPlus}
                    showLineNumbers
                    customStyle={{
                        margin: 0,
                        borderRadius: '0.5rem',
                        fontSize: '0.75rem',
                        lineHeight: '1.25rem',
                    }}
                />
            </CardContent>
        </Card>
    );
}
