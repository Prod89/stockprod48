import { LoginForm } from '@/components/auth/LoginForm'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'เข้าสู่ระบบ — WMS สต็อก',
}

export default function LoginPage() {
  return <LoginForm />
}
