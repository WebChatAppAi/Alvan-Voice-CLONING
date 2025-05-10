import type { Metadata } from 'next'
import { ThemeProvider } from "@/components/theme-provider"
import './globals.css'
import { Toaster } from "sonner"

export const metadata: Metadata = {
  title: 'Voice Cloning Dashboard',
  description: 'Upload audio samples and generate voice clones',
  generator: 'Next.js',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
        >
          <Toaster position="top-right" richColors closeButton />
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
