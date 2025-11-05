'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { pipelinesManifest } from '@/lib/pipelines-manifest';

export default function PipelinesPage() {
  const sections = pipelinesManifest.reduce(
    (acc, example) => {
      if (!acc[example.section]) {
        acc[example.section] = [];
      }
      acc[example.section].push(example);
      return acc;
    },
    {} as Record<string, typeof pipelinesManifest>
  );

  const sectionTitles: Record<string, string> = {
    basics: 'Basics',
    tokens: 'Token Operations',
    nfts: 'NFT Operations',
    advanced: 'Advanced',
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-h2 mb-2">Pipeline Examples</h1>
          <p className="text-body-xl text-muted-foreground">
            Interactive visualizations of transaction orchestration with automatic batching
          </p>
        </div>

        {Object.entries(sections).map(([section, examples]) => (
          <section key={section} className="mb-12">
            <h2 className="text-title-4 mb-4">{sectionTitles[section]}</h2>
            <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4">
              {examples.map((example) => (
                <Link key={example.id} href={`/pipelines/${example.id}`} className="flex-shrink-0">
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full w-64">
                    <CardHeader>
                      <CardTitle className="text-title-5">{example.name}</CardTitle>
                      <CardDescription className="text-body-md">{example.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-body-md text-muted-foreground">
                        View example →
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}



