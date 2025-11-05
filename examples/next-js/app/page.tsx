'use client';

import { TransactionDemo } from '@/components/transactions';

export default function Home() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
            <main className="container mx-auto px-4 py-6">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-6">
                        <h1 className="text-h2">ConnectorKit Examples</h1>
                        <p className="text-body-l text-muted-foreground mt-1">
                            Test transactions, Kit signers, chain utilities, and connection abstraction
                        </p>
                    </div>
                    <TransactionDemo />
                </div>
            </main>
        </div>
    );
}
