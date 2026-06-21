'use client'
 
import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { motion } from 'framer-motion'
import { ArrowRight, Calculator, ArrowRightLeft, PiggyBank, LayoutDashboard } from 'lucide-react'
 
export default function DashboardPage() {
  const supabase = createClient()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
 
  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
 
      if (!user) {
        router.push('/login')
      } else {
        setUser(user)
      }
 
      setLoading(false)
    }
 
    getUser()
  }, [router, supabase])
 
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0b0f19]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    )
  }
 
  if (!user) return null
 
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-[#0b0f19] text-gray-900 dark:text-slate-100 font-sans transition-colors duration-300 relative overflow-hidden">
      {/* Ambient Glow Backgrounds */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] pointer-events-none overflow-hidden -z-10 opacity-70">
        <div className="absolute -top-[150px] left-1/4 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] rounded-full bg-emerald-400/20 blur-[80px] sm:blur-[120px] dark:bg-emerald-500/10"></div>
        <div className="absolute -top-[100px] right-1/4 w-[250px] sm:w-[400px] h-[250px] sm:h-[400px] rounded-full bg-teal-400/20 blur-[70px] sm:blur-[100px] dark:bg-teal-500/10"></div>
      </div>

      <Navbar username={user.user_metadata?.username || 'Pengguna'} />
 
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 flex flex-col items-center justify-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto flex flex-col items-center"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-100/60 dark:border-emerald-900/30 text-xs font-bold mb-6 tracking-wide uppercase shadow-sm"
          >
            🚀 Asisten Finansial Pribadi
          </motion.div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-6 leading-tight">
            Kelola Keuanganmu <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-400 dark:from-emerald-400 dark:to-teal-300">
              Lebih Cerdas & Mudah
            </span>
          </h1>
 
          <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-slate-400 mb-10 leading-relaxed max-w-2xl">
            SmartCash adalah asisten keuangan pribadi Anda. Catat pemasukan, pantau pengeluaran, kelola tabungan, dan raih kebebasan finansial dengan mudah menggunakan alat budgeting yang intuitif.
          </p>
 
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
            <button
              onClick={() => router.push('/dashboard/app')}
              className="group flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-4 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white rounded-full font-bold text-lg transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5 cursor-pointer"
            >
              Start Budgeting
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
            </button>
          </div>
        </motion.div>
 
        {/* Feature Highlights */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 mt-16 md:mt-24 w-full px-2 sm:px-0"
        >
          {/* Card 1: SmartCash Budgeting */}
          <div className="bg-white/60 dark:bg-[#131b2e]/60 backdrop-blur-md p-6 sm:p-8 rounded-3xl shadow-sm border border-white/40 dark:border-slate-800/80 flex flex-col items-center text-center hover:-translate-y-2 hover:shadow-xl hover:shadow-emerald-500/5 dark:hover:shadow-emerald-500/2 hover:border-emerald-300 dark:hover:border-emerald-500/40 transition-all duration-300 group">
            <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-inner">
              <Calculator className="w-7 h-7" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-slate-100 mb-3">SmartCash Budgeting</h3>
            <p className="text-xs sm:text-sm text-gray-505 dark:text-slate-400 leading-relaxed">
              Atur anggaran harian Anda secara otomatis berdasarkan total saldo dan rentang waktu periode. Asisten memantau pengeluaran agar tetap aman.
            </p>
          </div>
 
          {/* Card 2: Catat Transaksi */}
          <div className="bg-white/60 dark:bg-[#131b2e]/60 backdrop-blur-md p-6 sm:p-8 rounded-3xl shadow-sm border border-white/40 dark:border-slate-800/80 flex flex-col items-center text-center hover:-translate-y-2 hover:shadow-xl hover:shadow-emerald-500/5 dark:hover:shadow-emerald-500/2 hover:border-emerald-300 dark:hover:border-emerald-500/40 transition-all duration-300 group">
            <div className="w-14 h-14 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-inner">
              <ArrowRightLeft className="w-7 h-7" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-slate-100 mb-3">Catat Transaksi</h3>
            <p className="text-xs sm:text-sm text-gray-505 dark:text-slate-400 leading-relaxed">
              Rekam pengeluaran, pemasukan, hingga pinjaman (utang/piutang) dengan cepat. Kategorikan transaksi agar rapi dan mudah dilacak.
            </p>
          </div>
 
          {/* Card 3: Tabungan & Impian */}
          <div className="bg-white/60 dark:bg-[#131b2e]/60 backdrop-blur-md p-6 sm:p-8 rounded-3xl shadow-sm border border-white/40 dark:border-slate-800/80 flex flex-col items-center text-center hover:-translate-y-2 hover:shadow-xl hover:shadow-emerald-500/5 dark:hover:shadow-emerald-500/2 hover:border-emerald-300 dark:hover:border-emerald-500/40 transition-all duration-300 group">
            <div className="w-14 h-14 bg-yellow-50 dark:bg-amber-950/30 text-yellow-600 dark:text-amber-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-inner">
              <PiggyBank className="w-7 h-7" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-slate-100 mb-3">Tabungan & Impian</h3>
            <p className="text-xs sm:text-sm text-gray-505 dark:text-slate-400 leading-relaxed">
              Rencanakan tabungan masa depan dan setor secara bertahap. Pindahkan surplus sisa budget harian secara otomatis lewat fitur Rollover.
            </p>
          </div>
 
          {/* Card 4: Ringkasan & Analisis */}
          <div className="bg-white/60 dark:bg-[#131b2e]/60 backdrop-blur-md p-6 sm:p-8 rounded-3xl shadow-sm border border-white/40 dark:border-slate-800/80 flex flex-col items-center text-center hover:-translate-y-2 hover:shadow-xl hover:shadow-emerald-500/5 dark:hover:shadow-emerald-500/2 hover:border-emerald-300 dark:hover:border-emerald-500/40 transition-all duration-300 group">
            <div className="w-14 h-14 bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-inner">
              <LayoutDashboard className="w-7 h-7" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-slate-100 mb-3">Ringkasan & Analisis</h3>
            <p className="text-xs sm:text-sm text-gray-505 dark:text-slate-400 leading-relaxed">
              Visualisasikan keuangan Anda melalui grafik pie bulanan yang dinamis. Analisis kategori belanja untuk kebiasaan finansial yang lebih baik.
            </p>
          </div>
        </motion.div>
      </main>
 
      <Footer />
    </div>
  )
}