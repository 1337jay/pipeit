'use client';

import { useConnector } from '@solana/connector';
import { useCluster } from '@solana/connector/react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useState } from 'react';
import { motion } from 'motion/react';
import { WalletModal } from './wallet-modal';
import { Wallet, LogOut, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SolanaClusterId, SolanaCluster } from '@solana/connector';

interface ConnectButtonProps {
    className?: string;
}

const clusterLabels: Record<string, string> = {
    'solana:mainnet': 'Mainnet',
    'solana:devnet': 'Devnet',
    'solana:testnet': 'Testnet',
    'solana:localnet': 'Localnet',
};

export function ConnectButton({ className }: ConnectButtonProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const connector = useConnector();
    const { connected, connecting, selectedWallet, selectedAccount, disconnect, wallets, cluster } = connector;
    const { clusters, setCluster } = useCluster();

    const isMainnet = cluster?.id === 'solana:mainnet';

    const handleClusterChange = async (clusterId: SolanaClusterId) => {
        try {
            await setCluster(clusterId);
        } catch (error) {
            console.error('Cluster change failed:', error);
        }
    };

    if (connecting) {
        return (
            <Button size="sm" disabled className={className}>
                <div className=" h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            </Button>
        );
    }

    if (connected && selectedAccount && selectedWallet) {
        const shortAddress = `${selectedAccount.slice(0, 4)}...${selectedAccount.slice(-4)}`;

        // Get wallet icon from wallets list (has proper icons) or fallback to selectedWallet
        const walletWithIcon = wallets.find(w => w.wallet.name === selectedWallet.name);
        const walletIcon = walletWithIcon?.wallet.icon || selectedWallet.icon;

        return (
            <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className={className}>
                        <Avatar className="h-5 w-5">
                            {walletIcon && <AvatarImage src={walletIcon} alt={selectedWallet.name} />}
                            <AvatarFallback>
                                <Wallet className="h-3 w-3" />
                            </AvatarFallback>
                        </Avatar>
                        <div className="h-8 w-px bg-sand-200" />
                        <motion.div
                            animate={{ rotate: isDropdownOpen ? -90 : 0 }}
                            transition={{ duration: 0.2, ease: 'easeInOut' }}
                        >
                            <ChevronDown className="h-4 w-4 opacity-50" />
                        </motion.div>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" side="right" className="w-72">
                    <DropdownMenuLabel>
                        <div className="flex flex-col space-y-1">
                            <p className="text-xs font-abc-diatype leading-none">
                                <span className="opacity-50">Connected to</span> {selectedWallet.name}
                            </p>
                            <p className="text-body-md font-berkeley-mono text-muted-foreground">{shortAddress}</p>
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <div className="px-2 py-1.5">
                        <p className="text-[11px] font-berkeley-mono text-sand-700 leading-relaxed">
                            Examples execute self-transfers. Network fees apply.
                        </p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-[11px] font-berkeley-mono text-sand-800 uppercase tracking-wide">
                        Network
                    </DropdownMenuLabel>
                    <div className="px-1 pb-1">
                        <div className="flex flex-wrap gap-1">
                            {clusters.map((c: SolanaCluster) => {
                                const isSelected = c.id === cluster?.id;
                                const label = clusterLabels[c.id] || c.label || c.id;

                                return (
                                    <button
                                        key={c.id}
                                        onClick={() => handleClusterChange(c.id as SolanaClusterId)}
                                        className={cn(
                                            'inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-berkeley-mono transition-colors',
                                            isSelected
                                                ? 'border-sand-1500 bg-sand-1500 text-sand-100'
                                                : 'border-sand-200 bg-sand-100 text-sand-900 hover:border-sand-300 hover:bg-sand-200',
                                        )}
                                    >
                                        {label}
                                        {isSelected && <Check className="h-3 w-3" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    {!isMainnet && (
                        <div className="px-2 py-1.5">
                            <p className="text-[11px] font-berkeley-mono text-sand-700 leading-relaxed">
                                <span className="text-amber-600">Note:</span> Some examples only work on mainnet.
                            </p>
                        </div>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        onClick={() => disconnect()}
                        className="cursor-pointer group hover:!bg-red-600/5 transition-all duration-150 ease-in-out"
                    >
                        <LogOut className="mr-2 h-4 w-4 group-hover:text-red-600" />
                        <span className="font-berkeley-mono group-hover:text-red-600">Disconnect</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        );
    }

    return (
        <>
            <Button size="sm" onClick={() => setIsModalOpen(true)} className={className}>
                Connect
            </Button>
            <WalletModal open={isModalOpen} onOpenChange={setIsModalOpen} />
        </>
    );
}
