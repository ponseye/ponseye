import { defineChain } from 'viem'

/** Robinhood Chain — Ethereum L2 (Arbitrum Orbit) */
export const robinhoodChain = defineChain({
  id: 4663,
  name: 'Robinhood Chain Mainnet',
  nativeCurrency: { name: 'Robinhood Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: {
      http: [
        'https://robinhood-rpc.publicnode.com',
        'https://robinhood.api.pocket.network',
        'https://rpc.mainnet.chain.robinhood.com',
      ],
    },
  },
  blockExplorers: {
    default: {
      name: 'Blockscout',
      url: 'https://robinhoodchain.blockscout.com',
    },
  },
})

/** Active chain — Robinhood Chain Mainnet (ID: 4663) */
export const activeChain = robinhoodChain