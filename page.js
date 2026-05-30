'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

export default function JoinPage() {
  const params = useParams()
  const router = useRouter()

  useEffect(() => {
    const code = params?.code
    if (code) {
      localStorage.setItem('pending_invite', code)
    }
    router.replace('/')
  }, [params, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="text-2xl font-black bg-gradient-to-r from-[#10F08C] to-[#8B5CF6] bg-clip-text text-transparent">
          IPL Predictor
        </div>
        <div className="text-[#8A92A8] mt-2">Joining group…</div>
      </div>
    </div>
  )
}
