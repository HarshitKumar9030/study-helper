"use client"

import React from 'react'
import { SessionProvider } from 'next-auth/react'
import { ThemeProvider } from 'next-themes'
import { Session } from 'next-auth'

interface ProvidersProps {
  children: React.ReactNode
  session?: Session;
}

const Providers = ({ children, session }: ProvidersProps) => {
  return (
    <SessionProvider session={session}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        {children}
      </ThemeProvider>
    </SessionProvider>
  )
}

export default Providers;