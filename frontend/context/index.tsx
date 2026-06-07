'use client'

import { wagmiAdapter, projectId } from '@/config'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createAppKit } from '@reown/appkit/react'
import { celo, celoSepolia } from '@reown/appkit/networks'
import React, { type ReactNode } from 'react'
import { cookieToInitialState, WagmiProvider, type Config } from 'wagmi'

const queryClient = new QueryClient()

if (!projectId) {
  throw new Error('Project ID is not defined')
}

const metadata = {
  name: 'Verko',
  description: 'Verko is a verified micro-task marketplace on Celo. Workers earn G$ for completing real-world tasks, verified on-chain.',
  url: 'https://my-verko.vercel.app/',
  icons: ['https://avatars.githubusercontent.com/u/179229932'],
}

createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks: [celo, celoSepolia],
  defaultNetwork: celo,
  metadata,
  features: {
    email: false,
    socials: ['google'],
    emailShowWallets: true,
    analytics: true,
  },
})

export default function ContextProvider({
  children,
  cookies,
}: {
  children: ReactNode
  cookies: string | null
}) {
  const initialState = cookieToInitialState(wagmiAdapter.wagmiConfig as Config, cookies)

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig as Config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}