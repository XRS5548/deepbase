import React from 'react'
import DashboardClient from './DashboardClient'
import { Toaster } from '@/components/ui/sonner'

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <DashboardClient>{children}</DashboardClient>
      <Toaster />
    </>
  )
}
