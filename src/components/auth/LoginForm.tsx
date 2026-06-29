'use client'

import { useState } from 'react'
import { login } from '@/actions/auth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export function LoginForm() {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)
    setError(null)
    try {
      const result = await login(formData)
      if (result?.error) {
        setError(result.error)
      }
    } catch {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-slate-950">
      {/* Background gradient effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-500/20 rounded-full blur-[100px]" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-violet-500/20 rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/25">
            <svg className="w-9 h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">WMS สต็อก</h1>
          <p className="text-sm text-white/50 mt-1">ระบบจัดการคลังสินค้า</p>
        </div>

        {/* Login Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
          <form action={handleSubmit} className="space-y-4">
            <Input
              name="email"
              type="email"
              label="อีเมล"
              placeholder="your@email.com"
              autoComplete="email"
              required
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              }
            />
            <Input
              name="password"
              type="password"
              label="รหัสผ่าน"
              placeholder="••••••••"
              autoComplete="current-password"
              required
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              }
            />

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-sm text-red-400 flex items-center gap-2">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            <Button type="submit" isLoading={isLoading} className="w-full" size="lg">
              เข้าสู่ระบบ
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-white/30 mt-6">
          WMS สต็อก v1.0 — ระบบจัดการคลังสินค้า
        </p>
      </div>
    </div>
  )
}
