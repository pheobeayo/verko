'use client'

import { wagmiAdapter, projectId } from '@/config'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createAppKit } from '@reown/appkit/react'
import { celo} from '@reown/appkit/networks'
import React, { type ReactNode } from 'react'
import { cookieToInitialState, WagmiProvider, type Config } from 'wagmi'
import { IdentityProvider } from './IdentityContext'

const queryClient = new QueryClient()

if (!projectId) {
  throw new Error('Project ID is not defined')
}

const metadata = {
  name: 'Verko',
  description: 'Verified micro-task marketplace on Celo. Workers earn G$ for completing real-world tasks.',
  url: 'https://verko.app',
  icons: ['https://avatars.githubusercontent.com/u/179229932'],
}

createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks: [celo],
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
        <IdentityProvider>
          {children}
        </IdentityProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}