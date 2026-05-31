import './globals.css'
import { Toaster } from 'sonner'
export const metadata = { title: 'Cric Predictor', description: 'Predict cricket matches, compete with friends' }
export default function RootLayout({ children }) { return (<html lang="en"><body><div className="max-w-[480px] mx-auto relative">{children}</div><Toaster position="top-center" richColors theme="dark"/></body></html>) }
