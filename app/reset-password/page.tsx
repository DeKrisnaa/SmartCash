'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import { Lock, ArrowRight, Loader2, Eye, EyeOff, CheckCircle } from 'lucide-react'
import { motion } from 'framer-motion'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [success, setSuccess] = useState(false)
  const [isVerifying, setIsVerifying] = useState(true)

  const code = searchParams.get('code')

  useEffect(() => {
    // Jika ada kode PKCE di URL, lakukan pertukaran kode untuk sesi di client-side
    // Ini menangani kasus jika redirect URL langsung mengarah ke halaman ini tanpa lewat callback API
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        setIsVerifying(false)
        if (error) {
          setErrorMsg('Tautan reset password sudah tidak valid atau kedaluwarsa. Silakan ajukan kembali.')
        }
      })
    } else {
      // Periksa apakah user sudah memiliki sesi aktif (misal lewat callback API)
      supabase.auth.getSession().then(({ data: { session } }) => {
        setIsVerifying(false)
        if (!session) {
          setErrorMsg('Akses ditolak. Anda memerlukan sesi aktif atau tautan reset untuk mengakses halaman ini.')
        }
      })
    }
  }, [code, supabase])

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    
    if (password.length < 6) {
      setErrorMsg('Password minimal harus 6 karakter.')
      return
    }

    if (password !== confirmPassword) {
      setErrorMsg('Konfirmasi password tidak cocok.')
      return
    }

    setIsLoading(true)
    setErrorMsg('')

    const { error } = await supabase.auth.updateUser({
      password: password,
    })

    if (error) {
      setErrorMsg(error.message)
      setIsLoading(false)
    } else {
      setSuccess(true)
      setIsLoading(false)
      // Keluar setelah ganti password agar login ulang secara bersih dengan sandi baru
      await supabase.auth.signOut()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 dark:from-[#0b0f19] dark:to-[#112420] p-4 transition-colors duration-300">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white dark:bg-[#131b2e] rounded-3xl shadow-xl dark:shadow-slate-950/50 border border-transparent dark:border-slate-800/80 overflow-hidden"
      >
        <div className="p-8">
          <div className="flex justify-center mb-6">
            <div className="relative w-40 h-40">
              <Image
                src="/logo_SmartCash-removebg-preview.webp"
                alt="SmartCash Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Reset Password</h1>
            <p className="text-gray-500 dark:text-slate-400 text-sm">
              {success ? 'Password successfully reset' : 'Enter your new password below'}
            </p>
          </div>

          {isVerifying ? (
            <div className="flex flex-col items-center justify-center py-6 space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600 dark:text-emerald-400" />
              <p className="text-sm text-gray-500 dark:text-slate-400">Memverifikasi tautan reset password...</p>
            </div>
          ) : success ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6 text-center"
            >
              <div className="flex justify-center">
                <CheckCircle className="w-16 h-16 text-emerald-500" />
              </div>
              <p className="text-gray-600 dark:text-slate-300 text-sm">
                Password Anda telah berhasil diperbarui! Silakan masuk kembali dengan password baru Anda.
              </p>
              <button
                onClick={() => router.push('/login')}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors cursor-pointer"
              >
                Go to Sign In
                <ArrowRight className="ml-2 w-4 h-4" />
              </button>
            </motion.div>
          ) : (
            <>
              {errorMsg && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-red-50 dark:bg-red-950/20 text-red-500 dark:text-red-400 p-3 rounded-lg text-sm mb-6 text-center border border-red-100 dark:border-red-950/30"
                >
                  {errorMsg}
                </motion.div>
              )}

              {/* Tampilkan form ganti password jika tidak ada error kritis mengenai tautan/sesi */}
              {(!errorMsg || errorMsg.includes('Konfirmasi') || errorMsg.includes('minimal')) && (
                <form onSubmit={handleResetPassword} className="space-y-5">
                  <div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400 dark:text-slate-500" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="New Password"
                        required
                        className="block w-full pl-10 pr-10 py-3 border border-gray-200 dark:border-slate-700/80 rounded-xl text-gray-900 dark:text-slate-100 bg-white dark:bg-[#1b2336] placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 focus:outline-none cursor-pointer"
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400 dark:text-slate-500" />
                      </div>
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Confirm New Password"
                        required
                        className="block w-full pl-10 pr-10 py-3 border border-gray-200 dark:border-slate-700/80 rounded-xl text-gray-900 dark:text-slate-100 bg-white dark:bg-[#1b2336] placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 focus:outline-none cursor-pointer"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors disabled:opacity-70 cursor-pointer"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        Update Password
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {errorMsg && !(errorMsg.includes('Konfirmasi') || errorMsg.includes('minimal')) && (
                <div className="text-center pt-4">
                  <button
                    onClick={() => router.push('/login')}
                    className="font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                  >
                    Kembali ke Login
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 dark:from-[#0b0f19] dark:to-[#112420] p-4">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 dark:text-emerald-400" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  )
}
