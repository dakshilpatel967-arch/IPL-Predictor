'use client'
import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
export default function JoinPage() { const { code } = useParams(); const router = useRouter(); useEffect(() => { if (code) { localStorage.setItem('pending_invite', code); router.push('/') } }, [code, router]); return (<div className="min-h-screen flex items-center justify-center"><div className="text-center"><div className="text-xl font-bold">Joining group...</div><div className="text-sm text-gray-400 mt-2">Redirecting...</div></div></div>) }
