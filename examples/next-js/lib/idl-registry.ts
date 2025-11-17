// IDL Registry - Transformed from Solscan format to Anchor format
import {
  IdlProgramRegistry,
  JupiterSwapPlugin,
  KaminoLendingPlugin,
  RaydiumSwapPlugin,
  JUPITER_V6_PROGRAM,
  KAMINO_LENDING_PROGRAM,
  RAYDIUM_CLMM_PROGRAM,
  type IdlInstruction,
} from '@pipeit/tx-idl';
import jupiterIdlJson from './idls/jupiter-idl.json';
import kaminoIdlJson from './idls/kamino-idl.json';
import raydiumIdlJson from './idls/raydium-idl.json';

// Cast JSON imports - they'll be validated at runtime by the parser
const jupiterIdl = jupiterIdlJson as any;
const kaminoIdl = kaminoIdlJson as any;
const raydiumIdl = raydiumIdlJson as any;

// Debug: Check if discriminator exists in imported JSON
const raydiumSwapV2 = raydiumIdl?.instructions?.find((i: any) => i.name === 'swap_v2');
console.log('[IDL Import] Raydium JSON import - swap_v2 discriminator:', {
  exists: !!raydiumSwapV2?.discriminator,
  value: raydiumSwapV2?.discriminator,
  isArray: Array.isArray(raydiumSwapV2?.discriminator),
});

// Singleton registry instance
// Version check to force re-initialization when parser is updated
const PARSER_VERSION = '1.0.6'; // Increment this when parser changes
let registryInstance: InstanceType<typeof IdlProgramRegistry> | null = null;
let registryVersion: string | null = null;

export function getIdlRegistry(): InstanceType<typeof IdlProgramRegistry> {
  // Force re-initialization if parser version changed
  if (registryVersion !== PARSER_VERSION) {
    registryInstance = null;
    registryVersion = PARSER_VERSION;
    console.log('[IDL Registry] Parser version updated, reinitializing registry');
  }
  
  if (!registryInstance) {
    registryInstance = new IdlProgramRegistry();

    // Register plugins for automatic account discovery
    // Configure Jupiter plugin to use Next.js API routes as proxy
    registryInstance.use(new JupiterSwapPlugin({
      quoteApiUrl: '/api/jupiter',
      swapInstructionsUrl: '/api/jupiter/swap-instructions',
    }));
    registryInstance.use(new KaminoLendingPlugin());
    registryInstance.use(new RaydiumSwapPlugin());

    // Register program IDLs
    registryInstance.registerProgramFromJson(JUPITER_V6_PROGRAM, jupiterIdl);
    registryInstance.registerProgramFromJson(KAMINO_LENDING_PROGRAM, kaminoIdl);
    registryInstance.registerProgramFromJson(RAYDIUM_CLMM_PROGRAM, raydiumIdl);
    
    // Debug: Verify discriminator was parsed correctly
    const raydiumInstructions = registryInstance.getInstructions(RAYDIUM_CLMM_PROGRAM);
    const swapV2 = raydiumInstructions.find((i: IdlInstruction) => i.name === 'swap_v2');
    console.log('[IDL Registry] Raydium swap_v2 discriminator:', swapV2?.discriminant);
  }

  return registryInstance;
}

// Known addresses
export const SOL_MINT = 'So11111111111111111111111111111111111111112';
export const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

// Re-export program addresses for convenience
export { JUPITER_V6_PROGRAM, KAMINO_LENDING_PROGRAM, RAYDIUM_CLMM_PROGRAM };

