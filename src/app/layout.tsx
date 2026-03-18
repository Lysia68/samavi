import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Fydelys — Studio Manager",
  description: "Gérez votre studio de yoga et bien-être",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}
