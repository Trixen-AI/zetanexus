import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { robinhood, type AppKitNetwork } from '@reown/appkit/networks';
import { fallback, http } from 'viem';
import { ENV, RPC_URLS } from './config';

/**
 * Reown AppKit + wagmi, configured once when the dashboard chunk loads.
 * Robinhood Chain is the only network: settlements happen there and nowhere else.
 * The project id comes from .env (VITE_REOWN_PROJECT_ID); without it the
 * dashboard shows a setup screen instead of a broken modal.
 */

export const walletReady = ENV.reownProjectId.length > 0;

const networks: [AppKitNetwork, ...AppKitNetwork[]] = [robinhood];

export const wagmiAdapter = new WagmiAdapter({
  projectId: ENV.reownProjectId || 'missing-project-id',
  networks,
  transports: { [robinhood.id]: fallback(RPC_URLS.map((url) => http(url))) },
});

if (walletReady) {
  createAppKit({
    adapters: [wagmiAdapter],
    networks,
    defaultNetwork: robinhood,
    projectId: ENV.reownProjectId,
    metadata: {
      name: 'ZRail',
      description: 'Shielded ZEC checkout, settled on Robinhood Chain.',
      url: window.location.origin,
      icons: [`${window.location.origin}/brand/logo-mark-500.png`],
    },
    features: { analytics: false, email: false, socials: false, swaps: false, onramp: false },
    themeMode: 'light',
    themeVariables: {
      '--w3m-accent': '#6e56f8',
      '--w3m-color-mix': '#0d0f12',
      '--w3m-color-mix-strength': 4,
      '--w3m-font-family': '"Space Grotesk Variable", "Space Grotesk", system-ui, sans-serif',
      '--w3m-border-radius-master': '2px',
    },
  });
}
