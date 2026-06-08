'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { motion } from 'framer-motion'
import { ArrowRight, PieChart, Wallet, TrendingUp, PiggyBank } from 'lucide-react'

export default function DashboardPage() {
  const supabase = createClient()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-[#0b0f19] text-gray-900 dark:text-slate-100 font-sans transition-colors duration-300">
      <Navbar username={user.user_metadata?.username || 'Pengguna'} />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 flex flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto"
        >
          <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-6">
            Kelola Keuanganmu <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-400 dark:from-emerald-400 dark:to-teal-300">
              Lebih Cerdas & Mudah
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-600 dark:text-slate-400 mb-10 leading-relaxed">
            SmartCash adalah asisten keuangan pribadi Anda. Catat pemasukan, pantau pengeluaran, kelola tabungan, dan raih kebebasan finansial dengan mudah menggunakan alat budgeting yang intuitif.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => router.push('/dashboard/app')}
              className="group flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-4 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white rounded-full font-semibold text-lg transition-all shadow-lg hover:shadow-emerald-500/30 cursor-pointer"
            >
              Start Budgeting
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </motion.div>

        {/* Feature Highlights */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-24 w-full"
        >
          <div className="bg-white dark:bg-[#131b2e] p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800/80 flex flex-col items-center text-center hover:shadow-md transition-all">
            <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mb-6">
              <Wallet className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-3">Catat Transaksi</h3>
            <p className="text-gray-500 dark:text-slate-400 leading-relaxed">Rekam setiap pemasukan dan pengeluaran dengan cepat dan akurat kapan saja.</p>
          </div>

          <div className="bg-white dark:bg-[#131b2e] p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800/80 flex flex-col items-center text-center hover:shadow-md transition-all">
            <div className="w-14 h-14 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-6">
              <PieChart className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-3">Analisis Keuangan</h3>
            <p className="text-gray-500 dark:text-slate-400 leading-relaxed">Pahami kebiasaan belanja Anda melalui laporan dan visualisasi data yang jelas.</p>
          </div>

          <div className="bg-white dark:bg-[#131b2e] p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800/80 flex flex-col items-center text-center hover:shadow-md transition-all">
            <div className="w-14 h-14 bg-yellow-50 dark:bg-amber-950/30 text-yellow-600 dark:text-amber-400 rounded-2xl flex items-center justify-center mb-6">
              <PiggyBank className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-3">Catat Tabungan</h3>
            <p className="text-gray-500 dark:text-slate-400 leading-relaxed">Alokasikan dana untuk masa depan dan pantau pertumbuhan tabungan Anda.</p>
          </div>

          <div className="bg-white dark:bg-[#131b2e] p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800/80 flex flex-col items-center text-center hover:shadow-md transition-all">
            <div className="w-14 h-14 bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 rounded-2xl flex items-center justify-center mb-6">
              <TrendingUp className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-3">Capai Target</h3>
            <p className="text-gray-500 dark:text-slate-400 leading-relaxed">Tetapkan anggaran bulanan dan pantau progres untuk mencapai tujuan finansial Anda.</p>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>

  )
}