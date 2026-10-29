import type { Metadata } from 'next'
import '../globals.css'

export const metadata: Metadata = {
  title: 'پنل مدیریت دبیرستان سوره',
  description: 'داشبورد مدیریت وب‌سایت دبیرستان سوره (Soreh High School)',
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children
}
