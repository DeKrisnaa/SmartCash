'use client'

import { motion } from 'framer-motion'
import {
  Info, ChevronLeft, ChevronRight, ArrowUpCircle,
  ArrowDownCircle, PiggyBank
} from 'lucide-react'

interface Transaction {
  id: string
  user_id: string
  amount: number
  type: string
  category: string
  description: string
  date: string
  created_at: string
  session_id?: string | null
  scope?: 'daily' | 'monthly' | null
  person_name?: string | null
  loan_status?: 'none' | 'ongoing' | 'paid' | null
  note?: string | null
}

interface RingkasanTabProps {
  transactions: Transaction[]
  summaryMonth: number
  setSummaryMonth: React.Dispatch<React.SetStateAction<number>>
  summaryYear: number
  setSummaryYear: React.Dispatch<React.SetStateAction<number>>
  hoveredSlice: string | null
  setHoveredSlice: (val: string | null) => void
  CATEGORIES: any[]
  setActiveTab: (tabId: string) => void
}

const parseDateOnly = (dateStr: string) => {
  if (!dateStr) return ''
  return dateStr.split('T')[0]
}

export default function RingkasanTab({
  transactions,
  summaryMonth,
  setSummaryMonth,
  summaryYear,
  setSummaryYear,
  hoveredSlice,
  setHoveredSlice,
  CATEGORIES,
  setActiveTab
}: RingkasanTabProps) {
  const today = new Date()
  const INDONESIAN_MONTHS = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ]

  const summaryMonthStr = String(summaryMonth).padStart(2, '0')
  const targetPrefix = `${summaryYear}-${summaryMonthStr}`

  // Filter all transactions for the selected month
  const monthlyTxs = transactions.filter(t => {
    const dateStr = parseDateOnly(t.date)
    return dateStr.startsWith(targetPrefix)
  })

  // Calculate totals
  let monthlyIncome = 0
  let monthlyExpense = 0
  let monthlySavingsDeposit = 0
  let monthlySavingsWithdrawal = 0

  monthlyTxs.forEach(t => {
    const desc = t.description?.toLowerCase() || ''
    const isSavingDeposit = t.type === 'expense' && (desc.includes('menabung') || desc.includes('transfer sisa budget'))
    const isSavingWithdrawal = t.type === 'income' && desc.includes('tarik tabungan')

    if (isSavingDeposit) {
      monthlySavingsDeposit += t.amount
    } else if (isSavingWithdrawal) {
      monthlySavingsWithdrawal += t.amount
    } else if (t.type === 'income') {
      monthlyIncome += t.amount
    } else if (t.type === 'expense') {
      monthlyExpense += t.amount
    }
  })

  const netMonthlySavings = monthlySavingsDeposit - monthlySavingsWithdrawal
  
  // Direct absolute values for comparative pie chart
  const chartSavings = Math.max(0, netMonthlySavings)
  const chartIncome = monthlyIncome
  const chartExpense = monthlyExpense

  const totalChartValue = chartIncome + chartExpense + chartSavings

  // Percentage calculations
  const pctIncome = totalChartValue > 0 ? (chartIncome / totalChartValue) * 100 : 0
  const pctExpense = totalChartValue > 0 ? (chartExpense / totalChartValue) * 100 : 0
  const pctSavings = totalChartValue > 0 ? (chartSavings / totalChartValue) * 100 : 0

  // SVG Circle Config
  const r = 50
  const C = 2 * Math.PI * r // ~314.159

  // SVG Slices Offset
  const incomeStrokeLength = (pctIncome / 100) * C
  const expenseStrokeLength = (pctExpense / 100) * C
  const savingsStrokeLength = (pctSavings / 100) * C

  const incomeOffset = 0
  const expenseOffset = -incomeStrokeLength
  const savingsOffset = -(incomeStrokeLength + expenseStrokeLength)

  // Switch month helpers
  const handlePrevMonth = () => {
    if (summaryMonth === 1) {
      setSummaryMonth(12)
      setSummaryYear(prev => prev - 1)
    } else {
      setSummaryMonth(prev => prev - 1)
    }
  }

  const handleNextMonth = () => {
    if (summaryMonth === 12) {
      setSummaryMonth(1)
      setSummaryYear(prev => prev + 1)
    } else {
      setSummaryMonth(prev => prev + 1)
    }
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto w-full py-4">
      {/* Overview Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Ringkasan Finansial Anda
          </h2>
          <p className="text-gray-500 dark:text-slate-400 mt-1">
            Selamat datang kembali! Berikut adalah ikhtisar kondisi finansial Anda secara keseluruhan.
          </p>
        </div>
        <div className="text-sm font-semibold bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 px-4 py-2 rounded-xl border border-indigo-100/50 dark:border-indigo-900/30 w-fit">
          Status Aktif
        </div>
      </div>

      {/* Laporan Ringkasan Bulanan */}
      <div className="bg-white dark:bg-[#1b2336] border border-gray-100 dark:border-slate-800/80 rounded-3xl p-6 md:p-8 shadow-sm space-y-6 animate-fade-in transition-all">
        {/* Summary Header & Month Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-50 dark:border-slate-800/50 pb-5">
          <div>
            <h3 className="font-extrabold text-gray-900 dark:text-white text-xl">
              Laporan Ringkasan Bulanan
            </h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
              Grafik alokasi pemasukan, pengeluaran, dan tabungan Anda.
            </p>
          </div>

          {/* Month Selector Controls */}
          <div className="flex items-center gap-2 self-start sm:self-center bg-gray-50 dark:bg-[#121927] p-1.5 rounded-2xl border border-gray-100 dark:border-slate-800/50">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-xl text-gray-505 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white transition-all cursor-pointer"
              title="Bulan Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <span className="text-xs font-extrabold text-gray-800 dark:text-slate-200 px-3 min-w-[110px] text-center">
              {INDONESIAN_MONTHS[summaryMonth - 1]} {summaryYear}
            </span>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-xl text-gray-505 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white transition-all cursor-pointer"
              title="Bulan Berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Interactive Chart & Details Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Pie Chart Column (Left) */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center relative py-4">
            {totalChartValue === 0 ? (
              <div className="w-[260px] h-[260px] rounded-full border-4 border-dashed border-gray-200 dark:border-slate-850 flex flex-col items-center justify-center text-center p-6 transition-all">
                <Info className="w-10 h-10 text-gray-400 dark:text-slate-500 mb-2" />
                <span className="text-sm font-bold text-gray-500 dark:text-slate-400">Tidak ada data</span>
                <span className="text-[10px] text-gray-400 dark:text-slate-500 mt-1 max-w-[180px]">Catat transaksi atau tabungan untuk bulan ini</span>
              </div>
            ) : (
              <div className="relative w-[280px] h-[280px] flex items-center justify-center transition-all duration-300">
                {/* SVG Donut/Pie Chart */}
                <svg
                  width="100%"
                  height="100%"
                  viewBox="0 0 160 160"
                  className="transform -rotate-90 select-none"
                >
                  {/* Base circle background */}
                  <circle
                    cx="80"
                    cy="80"
                    r={r}
                    fill="transparent"
                    stroke="currentColor"
                    className="text-gray-50 dark:text-[#131b2e]/50"
                    strokeWidth="16"
                  />

                  {/* Slice: Pemasukan */}
                  {pctIncome > 0 && (
                    <circle
                      cx="80"
                      cy="80"
                      r={r}
                      fill="transparent"
                      stroke="#10b981" // Emerald-500
                      strokeWidth={hoveredSlice === 'income' ? '20' : '16'}
                      strokeDasharray={`${incomeStrokeLength} ${C - incomeStrokeLength}`}
                      strokeDashoffset={incomeOffset}
                      strokeLinecap="round"
                      onMouseEnter={() => setHoveredSlice('income')}
                      onMouseLeave={() => setHoveredSlice(null)}
                      className="transition-all duration-200 cursor-pointer"
                    />
                  )}

                  {/* Slice: Pengeluaran */}
                  {pctExpense > 0 && (
                    <circle
                      cx="80"
                      cy="80"
                      r={r}
                      fill="transparent"
                      stroke="#f43f5e" // Rose-500
                      strokeWidth={hoveredSlice === 'expense' ? '20' : '16'}
                      strokeDasharray={`${expenseStrokeLength} ${C - expenseStrokeLength}`}
                      strokeDashoffset={expenseOffset}
                      strokeLinecap="round"
                      onMouseEnter={() => setHoveredSlice('expense')}
                      onMouseLeave={() => setHoveredSlice(null)}
                      className="transition-all duration-200 cursor-pointer"
                    />
                  )}

                  {/* Slice: Tabungan */}
                  {pctSavings > 0 && (
                    <circle
                      cx="80"
                      cy="80"
                      r={r}
                      fill="transparent"
                      stroke="#f59e0b" // Amber-500
                      strokeWidth={hoveredSlice === 'savings' ? '20' : '16'}
                      strokeDasharray={`${savingsStrokeLength} ${C - savingsStrokeLength}`}
                      strokeDashoffset={savingsOffset}
                      strokeLinecap="round"
                      onMouseEnter={() => setHoveredSlice('savings')}
                      onMouseLeave={() => setHoveredSlice(null)}
                      className="transition-all duration-200 cursor-pointer"
                    />
                  )}
                </svg>

                {/* Central Indicator Box */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-6">
                  {hoveredSlice === 'income' && (
                    <>
                      <span className="text-xs font-bold text-emerald-605 dark:text-emerald-400 uppercase tracking-wider">Pemasukan</span>
                      <span className="text-lg font-extrabold text-gray-900 dark:text-white mt-1">
                        Rp {new Intl.NumberFormat('id-ID').format(chartIncome)}
                      </span>
                      <span className="text-[10px] text-gray-400 dark:text-slate-400 font-semibold mt-0.5">{Math.round(pctIncome)}% dari total</span>
                    </>
                  )}
                  {hoveredSlice === 'expense' && (
                    <>
                      <span className="text-xs font-bold text-rose-500 dark:text-rose-400 uppercase tracking-wider">Pengeluaran</span>
                      <span className="text-lg font-extrabold text-gray-900 dark:text-white mt-1">
                        Rp {new Intl.NumberFormat('id-ID').format(chartExpense)}
                      </span>
                      <span className="text-[10px] text-gray-400 dark:text-slate-400 font-semibold mt-0.5">{Math.round(pctExpense)}% dari total</span>
                    </>
                  )}
                  {hoveredSlice === 'savings' && (
                    <>
                      <span className="text-xs font-bold text-amber-500 dark:text-amber-450 uppercase tracking-wider">Tabungan Net</span>
                      <span className="text-lg font-extrabold text-gray-900 dark:text-white mt-1">
                        Rp {new Intl.NumberFormat('id-ID').format(chartSavings)}
                      </span>
                      <span className="text-[10px] text-gray-400 dark:text-slate-400 font-semibold mt-0.5">{Math.round(pctSavings)}% dari total</span>
                    </>
                  )}
                  {!hoveredSlice && (
                    <>
                      <span className="text-[10px] font-extrabold text-gray-450 dark:text-slate-500 uppercase tracking-wider">Selisih Bulanan</span>
                      <span className={`text-xl font-extrabold mt-1 ${monthlyIncome - monthlyExpense >= 0 ? 'text-emerald-650 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`}>
                        {monthlyIncome - monthlyExpense < 0 ? '-' : ''}Rp {new Intl.NumberFormat('id-ID').format(Math.abs(monthlyIncome - monthlyExpense))}
                      </span>
                      <span className="text-[10px] text-gray-405 dark:text-slate-550 font-semibold mt-0.5">Real Selisih</span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Stats Legend Panel (Right) */}
          <div className="lg:col-span-7 space-y-4">
            <h4 className="text-xs font-bold text-gray-400 dark:text-slate-400 uppercase tracking-widest mb-2">Legend & Detail Kontribusi</h4>
            
            {/* Card: Pemasukan */}
            <div 
              onMouseEnter={() => setHoveredSlice('income')}
              onMouseLeave={() => setHoveredSlice(null)}
              className={`p-4 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                hoveredSlice === 'income' 
                  ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50 scale-[1.02]' 
                  : 'bg-gray-50/50 dark:bg-[#121927]/40 border-gray-100 dark:border-slate-800/80 hover:bg-gray-50 dark:hover:bg-[#121927]/80'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100/70 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center shrink-0">
                  <ArrowUpCircle className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-gray-500 dark:text-slate-400">Total Pemasukan</span>
                  <h5 className="text-base font-extrabold text-gray-900 dark:text-white leading-tight mt-0.5">
                    Rp {new Intl.NumberFormat('id-ID').format(monthlyIncome)}
                  </h5>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-extrabold text-emerald-605 dark:text-emerald-400">
                  {Math.round(pctIncome)}%
                </span>
                <p className="text-[10px] text-gray-400 dark:text-slate-500 font-semibold mt-0.5">Dari akumulasi</p>
              </div>
            </div>

            {/* Card: Pengeluaran */}
            <div 
              onMouseEnter={() => setHoveredSlice('expense')}
              onMouseLeave={() => setHoveredSlice(null)}
              className={`p-4 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                hoveredSlice === 'expense' 
                  ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50 scale-[1.02]' 
                  : 'bg-gray-50/50 dark:bg-[#121927]/40 border-gray-100 dark:border-slate-800/80 hover:bg-gray-50 dark:hover:bg-[#121927]/80'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-rose-100/70 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-xl flex items-center justify-center shrink-0">
                  <ArrowDownCircle className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-gray-500 dark:text-slate-400">Total Pengeluaran</span>
                  <h5 className="text-base font-extrabold text-gray-900 dark:text-white leading-tight mt-0.5">
                    Rp {new Intl.NumberFormat('id-ID').format(monthlyExpense)}
                  </h5>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-extrabold text-rose-500 dark:text-rose-400">
                  {Math.round(pctExpense)}%
                </span>
                <p className="text-[10px] text-gray-400 dark:text-slate-500 font-semibold mt-0.5">Dari akumulasi</p>
              </div>
            </div>

            {/* Card: Tabungan */}
            <div 
              onMouseEnter={() => setHoveredSlice('savings')}
              onMouseLeave={() => setHoveredSlice(null)}
              className={`p-4 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                hoveredSlice === 'savings' 
                  ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50 scale-[1.02]' 
                  : 'bg-gray-50/50 dark:bg-[#121927]/40 border-gray-100 dark:border-slate-800/80 hover:bg-gray-50 dark:hover:bg-[#121927]/80'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100/70 dark:bg-amber-950/20 text-amber-500 dark:text-amber-450 rounded-xl flex items-center justify-center shrink-0">
                  <PiggyBank className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-gray-500 dark:text-slate-400">Tabungan Bulanan (Net)</span>
                  <h5 className="text-base font-extrabold text-gray-900 dark:text-white leading-tight mt-0.5">
                    {netMonthlySavings < 0 ? '-' : ''}Rp {new Intl.NumberFormat('id-ID').format(Math.abs(netMonthlySavings))}
                  </h5>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-extrabold text-amber-500 dark:text-amber-455">
                  {Math.round(pctSavings)}%
                </span>
                <p className="text-[10px] text-gray-400 dark:text-slate-500 font-semibold mt-0.5">Dari akumulasi</p>
              </div>
            </div>
          </div>
        </div>

        {/* List of transactions for selected month */}
        <div className="pt-4 border-t border-gray-50 dark:border-slate-800/50 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="text-sm font-extrabold text-gray-900 dark:text-white">
                Riwayat Transaksi Bulan Ini
              </h4>
              <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5">
                Menampilkan {monthlyTxs.length} transaksi di {INDONESIAN_MONTHS[summaryMonth - 1]} {summaryYear}
              </p>
            </div>
          </div>

          {monthlyTxs.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-400 dark:text-slate-505 bg-gray-50/50 dark:bg-[#121927]/20 rounded-2xl border border-dashed border-gray-100 dark:border-slate-800/80">
              Belum ada transaksi di bulan ini.
            </div>
          ) : (
            <div className="max-h-[250px] overflow-y-auto pr-1 space-y-2.5 custom-scrollbar">
              {monthlyTxs.map(t => {
                const isSavingsLog = t.description?.toLowerCase().includes('menabung') || t.description?.toLowerCase().includes('transfer sisa budget') || t.description?.toLowerCase().includes('tarik tabungan')
                const displayCategory = isSavingsLog ? 'tabungan' : t.category
                
                const catData = CATEGORIES.find(c => c.id === displayCategory) || 
                                (displayCategory === 'tabungan' 
                                  ? { id: 'tabungan', label: 'Tabungan', icon: PiggyBank, color: 'text-amber-500', bg: 'bg-amber-50', darkBg: 'dark:bg-amber-950/20 dark:text-amber-400' }
                                  : CATEGORIES[CATEGORIES.length - 1])
                
                const Icon = catData.icon
                const isRealExpense = t.type === 'expense'

                return (
                  <div 
                    key={t.id} 
                    className="flex items-center justify-between p-3 bg-gray-50/30 hover:bg-gray-50/70 dark:bg-[#121927]/20 dark:hover:bg-[#121927]/40 border border-gray-100/50 dark:border-slate-800/50 rounded-xl transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${catData.bg} ${catData.color} ${catData.darkBg || ''}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-955 dark:text-slate-100 leading-snug">
                          {t.description || catData.label}
                        </p>
                        <p className="text-[9px] text-gray-400 dark:text-slate-500 font-semibold mt-0.5">
                          {new Date(t.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} • {catData.label}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs font-extrabold ${isRealExpense ? 'text-rose-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {isRealExpense ? '-' : '+'} Rp {new Intl.NumberFormat('id-ID').format(t.amount)}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quick Tips / Encouraging Section */}
      <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 dark:from-indigo-950 dark:to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-white/10 dark:bg-white/5 rounded-full blur-2xl"></div>
        <div className="space-y-2 text-center md:text-left relative z-10">
          <h4 className="text-xl font-bold">Asisten Finansial Cerdas</h4>
          <p className="text-sm text-indigo-100 dark:text-indigo-200 max-w-xl leading-relaxed">
            SmartCash membantu Anda melacak budget harian secara instan. Buka tab "Budget Anda" untuk mengonfigurasi batas anggaran harian Anda, mencatat pengeluaran di tab "Transaksi", dan mentransfer sisa uang harian ke "Tabungan"!
          </p>
        </div>
        <button
          onClick={() => setActiveTab('budget')}
          className="shrink-0 bg-white hover:bg-gray-100 dark:bg-indigo-900 dark:hover:bg-indigo-800 dark:text-indigo-200 px-6 py-3 rounded-2xl font-bold text-sm transition-all shadow-md cursor-pointer border border-transparent dark:border-indigo-800/80 text-black"
        >
          Atur Budget Sekarang
        </button>
      </div>
    </div>
  )
}
