import './globals.css'
import { Toaster } from 'sonner'

export const metadata = {
  title: 'IPL Predictor — Predict. Compete. Brag.',
  description: 'Predict IPL matches, compete with friends, climb the leaderboard.',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0A0E1A',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-[#0A0E1A] text-[#F4F6FB] min-h-screen">
        <div className="mx-auto max-w-[480px] min-h-screen relative">
          {children}
        </div>
        <Toaster position="top-center" theme="dark" toastOptions={{ style: { background: '#1B2138', border: '1px solid #232a44', color: '#F4F6FB' } }} />
      </body>
    </html>
  )
}
