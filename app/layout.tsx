import type { Metadata } from "next"
import { Kalam, Patrick_Hand } from "next/font/google"
import "./globals.css"
import { cn } from "@/lib/utils"
import NextTopLoader from "nextjs-toploader"
import { ThemeProvider } from "@/components/theme-provider"

const kalam = Kalam({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-heading",
})

const patrickHand = Patrick_Hand({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-body",
})

export const metadata: Metadata = {
  title: "PlacementDepartment",
  description: "Streamline your campus placement process with hand-crafted efficiency",
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className={cn("h-full", "antialiased", kalam.variable, patrickHand.variable)}>
      <body className="min-h-full flex flex-col font-body">
        <NextTopLoader color="#ff4d4d" />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
