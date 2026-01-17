import type React from "react"
import type { Metadata, Viewport } from "next"
import { DM_Sans, JetBrains_Mono } from "next/font/google"
import { Providers } from "@/components/providers"
import "./globals.css"

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
})

export const metadata: Metadata = {
  title: "Contabilidad Hogar",
  description: "Gestión de gastos del hogar, análisis de deuda y seguimiento financiero personal",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Contabilidad",
  },
  formatDetection: {
    telephone: false,
  },
}

export const viewport: Viewport = {
  themeColor: "#007AFF",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(registration) {
                      console.log('Service Worker registrado con scope:', registration.scope);
                    },
                    function(err) {
                      console.log('Service Worker falló:', err);
                    }
                  );
                });
              }
            `,
          }}
        />
      </head>
      <body
        className={`${dmSans.className} ${jetbrainsMono.variable} font-sans antialiased warm-gradient min-h-screen`}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
