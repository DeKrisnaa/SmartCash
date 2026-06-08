'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import { LogOut, Sun, Moon } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function Navbar({ username }: { username: string }) {
  const router = useRouter()
  const supabase = createClient()

  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const isDark = document.documentElement.classList.contains('dark')
    setTheme(isDark ? 'dark' : 'light')
  }, [])

  const toggleTheme = () => {
    const isDark = document.documentElement.classList.contains('dark')
    if (isDark) {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
      setTheme('light')
    } else {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
      setTheme('dark')
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <nav className="sticky top-0 z-50 bg-white/80 dark:bg-[#131b2e]/80 backdrop-blur-md border-b border-gray-100 dark:border-slate-800/80 shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/dashboard')}>
            <div className="relative w-10 h-10">
              <Image
                src="/logo_SmartCash-removebg-preview.webp"
                alt="SmartCash Logo"
                fill
                className="object-contain"
              />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-green-500 dark:from-emerald-400 dark:to-green-400">
              SmartCash
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 dark:text-slate-300 font-medium hidden sm:block">{username}</span>
            
            <button
              onClick={toggleTheme}
              className="p-2 bg-gray-50 hover:bg-gray-100 dark:bg-slate-800/60 dark:hover:bg-slate-700/80 text-gray-600 dark:text-slate-300 rounded-xl transition-all cursor-pointer flex items-center justify-center border border-gray-100 dark:border-slate-700/80 w-10 h-10 shrink-0"
              aria-label="Toggle Theme"
            >
              {!mounted ? (
                <div className="w-5 h-5" />
              ) : theme === 'dark' ? (
                <Sun className="w-5 h-5 text-amber-400" />
              ) : (
                <Moon className="w-5 h-5 text-indigo-600" />
              )}
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-xl font-medium transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:block">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}