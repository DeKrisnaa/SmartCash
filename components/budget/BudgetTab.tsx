'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calculator, CalendarDays, Info, Save, Loader2, PiggyBank,
  CheckCircle2, X, ArrowDownCircle
} from 'lucide-react'

interface BudgetTabProps {
  user: any
  supabase: any
  incomeInput: string
  handleIncomeChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  startDate: string
  setStartDate: (date: string) => void
  endDate: string
  setEndDate: (date: string) => void
  dailyBudget: number
  daysDiff: number
  isValidPeriod: boolean
  isSavingBudget: boolean
  handleSaveBudget: () => Promise<void>
  selectedDate: string
  selectedDateExpenses: number
  transferredBudgetDates: string[]
  setTransferredBudgetDates: React.Dispatch<React.SetStateAction<string[]>>
  transactions: any[]
  setTransactions: React.Dispatch<React.SetStateAction<any[]>>
  savingPlans: any[]
  setSavingPlans: React.Dispatch<React.SetStateAction<any[]>>
  getOrCreateDailySession: (userId: string, dateStr: string) => Promise<string>
}

export default function BudgetTab({
  user,
  supabase,
  incomeInput,
  handleIncomeChange,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  dailyBudget,
  daysDiff,
  isValidPeriod,
  isSavingBudget,
  handleSaveBudget,
  selectedDate,
  selectedDateExpenses,
  transferredBudgetDates,
  setTransferredBudgetDates,
  transactions,
  setTransactions,
  savingPlans,
  setSavingPlans,
  getOrCreateDailySession
}: BudgetTabProps) {
  // Local states for Rollover Transfer
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false)
  const [transferTargetId, setTransferTargetId] = useState('')
  const [isTransferring, setIsTransferring] = useState(false)

  const handleExecuteTransfer = async () => {
    const surplus = dailyBudget - selectedDateExpenses
    if (surplus <= 0 || !transferTargetId || !user) return

    const selectedPlan = savingPlans.find(p => p.id === transferTargetId)
    if (!selectedPlan) return

    setIsTransferring(true)
    
    // Dapatkan atau buat daily session terlebih dahulu
    let sessionId: string | null = null
    try {
      sessionId = await getOrCreateDailySession(user.id, selectedDate)
    } catch (err: any) {
      console.warn('Gagal mendapatkan daily_session untuk transfer, melanjutkan tanpa session_id:', err.message || err)
    }

    try {
      const { data: txData, error: txError } = await supabase
        .from('transactions')
        .insert([
          {
            user_id: user.id,
            amount: surplus,
            type: 'expense',
            category: 'lainnya',
            description: `Transfer Sisa Budget ke Tabungan: ${selectedPlan.name}`,
            date: selectedDate,
            session_id: sessionId,
          }
        ])
        .select()

      if (txError) throw txError

      const { error: logError } = await supabase
        .from('saving_logs')
        .insert([
          {
            user_id: user.id,
            saving_id: selectedPlan.id,
            amount: surplus,
            note: 'Transfer Otomatis Sisa Budget Harian',
            date: selectedDate,
          }
        ])

      if (logError) throw logError

      const newAmount = selectedPlan.current_amount + surplus
      const { error: updateError } = await supabase
        .from('savings')
        .update({ current_amount: newAmount })
        .eq('id', selectedPlan.id)

      if (updateError) throw updateError

      const updatedDates = [...transferredBudgetDates, selectedDate]
      setTransferredBudgetDates(updatedDates)
      localStorage.setItem('smartcash_transferred_budget_dates', JSON.stringify(updatedDates))

      setTransactions([txData[0], ...transactions])
      setSavingPlans(savingPlans.map(p => p.id === selectedPlan.id ? { ...p, current_amount: newAmount } : p))

      setIsTransferModalOpen(false)
      setTransferTargetId('')
      
      alert('Berhasil! Sisa budget harian Anda telah otomatis ditransfer ke tabungan.')
    } catch (err) {
      console.error('Error executing transfer:', err)
      alert('Gagal melakukan pemindahan tabungan. Silakan coba lagi.')
    } finally {
      setIsTransferring(false)
    }
  }

  const numericIncome = Number(incomeInput.replace(/\D/g, '')) || 0

  return (
    <div className="flex flex-col lg:flex-row gap-8 max-w-6xl mx-auto w-full mt-4 items-start animate-fade-in">
      
      {/* KIRI: Pengaturan Budget */}
      <div className="w-full lg:w-5/12 space-y-6">
        <div className="bg-white dark:bg-[#1b2336] border border-gray-100 dark:border-slate-800/80 rounded-3xl p-6 md:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-500 dark:text-indigo-400 rounded-xl flex items-center justify-center">
              <Calculator className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Hitung Budget Harian</h3>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                Saldo / Anggaran Anda
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-gray-500 dark:text-slate-400 font-semibold text-sm">Rp</span>
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Masukkan saldo Anda..."
                  value={incomeInput}
                  onChange={handleIncomeChange}
                  className="block w-full pl-12 pr-4 py-3.5 text-base text-gray-900 dark:text-white font-semibold border border-gray-200 dark:border-slate-700 rounded-2xl bg-gray-50 dark:bg-[#121927] focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow outline-none"
                />
              </div>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-1.5">Masukkan total saldo atau gaji yang ingin Anda kelola.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  Mulai
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value)
                    localStorage.setItem('smartcash_budget_start', e.target.value)
                  }}
                  className="block w-full px-3 py-2.5 text-sm border-gray-200 dark:border-slate-700/80 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50 dark:bg-[#121927] outline-none text-gray-700 dark:text-slate-200 font-medium"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  Selesai
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value)
                    localStorage.setItem('smartcash_budget_end', e.target.value)
                  }}
                  className="block w-full px-3 py-2.5 text-sm border-gray-200 dark:border-slate-700/80 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50 dark:bg-[#121927] outline-none text-gray-700 dark:text-slate-200 font-medium"
                />
              </div>
            </div>

            <div className={`flex items-center gap-2 text-xs p-3 rounded-xl border ${isValidPeriod ? 'bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-750 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/30' : 'bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900/30'}`}>
              <CalendarDays className={`w-3.5 h-3.5 ${isValidPeriod ? 'text-indigo-500' : 'text-red-500'}`} />
              <span className="font-semibold">
                {isValidPeriod 
                  ? <>Periode ini memiliki <strong>{daysDiff} hari</strong>.</>
                  : <strong>Tanggal selesai harus setelah tanggal mulai.</strong>}
              </span>
            </div>

            <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-900/30 rounded-2xl p-4 flex items-start gap-2.5 mt-4">
              <Info className="w-5 h-5 text-indigo-500 dark:text-indigo-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-indigo-900 dark:text-indigo-300">
                  Cara Perhitungan Budget Harian
                </p>
                <p className="text-[11px] text-indigo-700/90 dark:text-indigo-400/95 leading-relaxed">
                  Masukkan saldo atau gaji Anda, lalu tentukan periode pengelolaan. Budget harian dihitung dari <strong>saldo ÷ jumlah hari</strong>. Simpan ke database agar tersedia di semua perangkat.
                </p>
              </div>
            </div>

            {/* Tombol Simpan Budget */}
            <button
              onClick={handleSaveBudget}
              disabled={isSavingBudget || !numericIncome}
              className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:from-gray-300 disabled:to-gray-300 dark:disabled:from-slate-700 dark:disabled:to-slate-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all duration-200 disabled:cursor-not-allowed disabled:shadow-none cursor-pointer"
            >
              {isSavingBudget ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Simpan Saldo ke Database</span>
                </>
              )}
            </button>
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-6 md:p-8 text-white shadow-xl shadow-emerald-500/10 text-center relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-24 h-24 bg-white opacity-10 rounded-full blur-2xl"></div>
          
          <p className="text-emerald-100 font-medium text-xs mb-1 relative z-10">Batas Anggaran Harian</p>
          <h3 className="text-3xl md:text-4xl font-extrabold tracking-tight relative z-10">
            Rp {dailyBudget.toLocaleString('id-ID')}
          </h3>
          <p className="text-[11px] text-emerald-100/80 mt-3 max-w-xs mx-auto relative z-10">
            Budget harian = saldo Anda dibagi jumlah hari dalam periode yang dipilih.
          </p>
        </motion.div>
      </div>

      {/* KANAN: Status Laporan & Asisten Tabungan Harian */}
      <div className="w-full lg:w-7/12 space-y-6">
        {dailyBudget === 0 ? (
          <div className="bg-white dark:bg-[#1b2336] border border-gray-100 dark:border-slate-800/80 rounded-3xl p-8 text-center flex flex-col items-center justify-center min-h-[300px]">
            <div className="w-14 h-14 bg-gray-50 dark:bg-slate-800/60 text-gray-400 dark:text-slate-500 rounded-2xl flex items-center justify-center mb-4">
              <Calculator className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-gray-900 dark:text-white">Analisis & Asisten Belum Aktif</h4>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 max-w-xs leading-relaxed">
              Silakan masukkan saldo Anda dan atur rentang tanggal di panel sebelah kiri untuk melihat laporan pengeluaran harian, visual penggunaan budget, dan mengaktifkan asisten rollover tabungan.
            </p>
          </div>
        ) : (
          <>
            {/* Laporan Harian */}
            <div className="bg-white dark:bg-[#1b2336] border border-gray-100 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-50 dark:border-slate-800/80 pb-4">
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white text-base">Laporan Pengeluaran Harian</h4>
                  <p className="text-xs text-gray-500 dark:text-slate-400">Analisis budget vs pengeluaran Anda pada tanggal terpilih.</p>
                </div>
                <span className="text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 px-3 py-1 rounded-lg border border-indigo-100/50 dark:border-indigo-900/30 w-fit shrink-0">
                  {new Date(selectedDate).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-0.5">
                  <p className="text-gray-400 dark:text-slate-500 text-[10px] font-bold tracking-wider uppercase">Batas Harian</p>
                  <p className="text-sm font-extrabold text-gray-800 dark:text-slate-200">
                    Rp {dailyBudget.toLocaleString('id-ID')}
                  </p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-gray-400 dark:text-slate-500 text-[10px] font-bold tracking-wider uppercase">Belanja</p>
                  <p className={`text-sm font-extrabold ${selectedDateExpenses > dailyBudget ? 'text-red-600 dark:text-red-400' : 'text-gray-800 dark:text-slate-200'}`}>
                    Rp {selectedDateExpenses.toLocaleString('id-ID')}
                  </p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-gray-400 dark:text-slate-500 text-[10px] font-bold tracking-wider uppercase">Sisa</p>
                  <p className={`text-sm font-extrabold ${dailyBudget - selectedDateExpenses < 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    Rp {(dailyBudget - selectedDateExpenses).toLocaleString('id-ID')}
                  </p>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-gray-600 dark:text-slate-300">Penggunaan Anggaran Harian</span>
                  <span className={selectedDateExpenses > dailyBudget ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}>
                    {Math.min(Math.round((selectedDateExpenses / dailyBudget) * 100), 100)}% Terpakai
                  </span>
                </div>
                <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden relative">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      selectedDateExpenses > dailyBudget 
                        ? 'bg-gradient-to-r from-red-500 to-rose-600' 
                        : selectedDateExpenses / dailyBudget >= 0.8
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                          : 'bg-gradient-to-r from-emerald-500 to-teal-500'
                    }`}
                    style={{ width: `${Math.min((selectedDateExpenses / dailyBudget) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Asisten Tabungan Harian */}
            <div className="bg-white dark:bg-[#1b2336] border border-gray-100 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm transition-all">
              <h4 className="font-bold text-gray-900 dark:text-white text-base mb-4 flex items-center gap-2">
                <PiggyBank className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                Asisten Tabungan Harian
              </h4>

              <div className="space-y-4">
                {selectedDateExpenses > dailyBudget ? (
                  <div className="bg-red-50/50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-2xl p-4 space-y-1">
                    <p className="text-xs font-bold text-red-800 dark:text-red-400">
                      Batas Anggaran Harian Terlampaui
                    </p>
                    <p className="text-[11px] text-red-600/90 dark:text-red-400/90 leading-relaxed">
                      Anda melebihi budget harian sebesar Rp {(selectedDateExpenses - dailyBudget).toLocaleString('id-ID')}. Tidak ada sisa uang yang bisa ditabung hari ini. Kurangi pengeluaran non-esensial ya!
                    </p>
                  </div>
                ) : transferredBudgetDates.includes(selectedDate) ? (
                  <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl p-4 flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-emerald-800 dark:text-emerald-405">
                        Sisa Budget Berhasil Ditabung!
                      </p>
                      <p className="text-[11px] text-emerald-600/90 dark:text-emerald-400/90 leading-relaxed">
                        Surplus hari ini sebesar Rp {(dailyBudget - selectedDateExpenses).toLocaleString('id-ID')} telah sukses dimasukkan ke tabungan Anda.
                      </p>
                    </div>
                    <span className="shrink-0 px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-[10px] font-extrabold rounded-full flex items-center gap-1 border border-transparent dark:border-emerald-900/30">
                      <CheckCircle2 className="w-3 h-3" /> SUDAH DITABUNG
                    </span>
                  </div>
                ) : dailyBudget - selectedDateExpenses > 0 ? (
                  <div className="bg-emerald-50/30 dark:bg-emerald-950/10 border border-emerald-100/50 dark:border-emerald-900/20 rounded-2xl p-5 space-y-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-6 -mr-6 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl"></div>
                    <div className="space-y-1 relative z-10">
                      <div className="inline-flex px-2 py-0.5 bg-emerald-100/60 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold rounded-full mb-1">
                        SURPLUS ANGGARAN
                      </div>
                      <h5 className="text-sm font-bold text-gray-900 dark:text-white">
                        Ada Sisa Budget Sebesar Rp {(dailyBudget - selectedDateExpenses).toLocaleString('id-ID')}!
                      </h5>
                      <p className="text-[11px] text-gray-500 dark:text-slate-400 leading-relaxed">
                        Pengeluaran Anda pada hari terpilih di bawah batas. Pindahkan sisa uang ini ke rencana tabungan pilihan Anda sekarang sebelum terpakai untuk hal lain.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsTransferModalOpen(true)}
                      className="group w-full relative flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-bold text-xs transition-all shadow-md shadow-emerald-500/10 cursor-pointer"
                    >
                      <PiggyBank className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      Pindahkan Sisa Budget ke Tabungan
                    </button>
                  </div>
                ) : (
                  <div className="bg-gray-50 dark:bg-[#121927] border border-gray-100 dark:border-slate-800/80 rounded-2xl p-4 text-center">
                    <p className="text-xs font-semibold text-gray-700 dark:text-slate-300">Pengeluaran Pas dengan Budget</p>
                    <p className="text-[11px] text-gray-400 dark:text-slate-400 mt-1">
                      Belanja Anda pada hari terpilih tepat sama dengan budget. Pertahankan kedisiplinan ini!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal Rollover Transfer */}
      <AnimatePresence>
        {isTransferModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.98 }}
              className="bg-white dark:bg-[#131b2e] rounded-3xl shadow-xl w-full max-w-md overflow-hidden border border-gray-100 dark:border-slate-800/80 flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-slate-800/80">
                <h4 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                  <PiggyBank className="w-5 h-5 text-emerald-600 dark:text-emerald-450" />
                  Pindahkan Surplus Budget
                </h4>
                <button
                  onClick={() => {
                    setIsTransferModalOpen(false)
                    setTransferTargetId('')
                  }}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5 text-gray-450 dark:text-slate-450" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">
                  Sisa budget harian Anda pada <strong>{new Date(selectedDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</strong> sebesar <strong>Rp {(dailyBudget - selectedDateExpenses).toLocaleString('id-ID')}</strong> akan dipindahkan.
                </p>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-2">
                    Pilih Target Rencana Tabungan
                  </label>
                  {savingPlans.length === 0 ? (
                    <div className="p-4 text-center text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-dashed border-amber-100 dark:border-amber-900/30">
                      Anda belum membuat Rencana Tabungan. Buat terlebih dahulu di tab **Tabungan**!
                    </div>
                  ) : (
                    <select
                      value={transferTargetId}
                      onChange={(e) => setTransferTargetId(e.target.value)}
                      className="block w-full px-4 py-3 border border-gray-200 dark:border-slate-700/80 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50 dark:bg-[#121927] outline-none text-gray-900 dark:text-slate-100 font-medium text-sm"
                    >
                      <option className="dark:bg-[#131b2e] dark:text-slate-200" value="">-- Pilih Rencana Tabungan --</option>
                      {savingPlans.map(plan => (
                        <option key={plan.id} className="dark:bg-[#131b2e] dark:text-slate-200" value={plan.id}>
                          {plan.name} (Terkumpul: Rp {plan.current_amount.toLocaleString('id-ID')} / Target: Rp {plan.target_amount.toLocaleString('id-ID')})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleExecuteTransfer}
                    disabled={isTransferring || !transferTargetId}
                    className="w-full flex items-center justify-center gap-2.5 py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 dark:disabled:bg-slate-800 disabled:text-gray-400 dark:disabled:text-slate-500 text-white rounded-xl font-bold text-xs transition-all cursor-pointer"
                  >
                    {isTransferring ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Memindahkan Dana...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Konfirmasi & Pindahkan</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}
