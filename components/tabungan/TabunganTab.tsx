'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  PiggyBank, Plus, Coins, Trash2, History, X,
  ArrowUpCircle, ArrowDownCircle, Calendar,
  Loader2, CheckCircle2, ChevronRight, Target, Info
} from 'lucide-react'

interface SavingPlan {
  id: string
  user_id: string
  name: string
  target_amount: number
  current_amount: number
  currency: string
  plan_type: string
  plan_amount: number
  created_at: string
}

interface SavingLog {
  id: string
  user_id: string
  saving_id: string
  amount: number
  note: string
  date: string
  created_at: string
}

interface SavingsTabProps {
  user: any
  supabase: any
  savingPlans: SavingPlan[]
  setSavingPlans: React.Dispatch<React.SetStateAction<SavingPlan[]>>
  fetchSavings: () => Promise<void>
  loading: boolean
  onWithdraw?: (amount: number, planName: string) => void
  onDeposit?: (amount: number, planName: string) => void
}

export default function TabunganTab({ user, supabase, savingPlans, setSavingPlans, fetchSavings, loading, onWithdraw, onDeposit }: SavingsTabProps) {
  // Lists and loading states
  const [selectedPlanLogs, setSelectedPlanLogs] = useState<SavingLog[]>([])
  const [loadingLogs, setLoadingLogs] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  // Modal control
  const [activeModal, setActiveModal] = useState<'create' | 'deposit' | 'withdraw' | 'logs' | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<SavingPlan | null>(null)

  // "Create Plan" Form States
  const [planName, setPlanName] = useState('')
  const [planTarget, setPlanTarget] = useState('')
  const [planType, setPlanType] = useState<'flexible' | 'weekly' | 'monthly'>('flexible')
  const [planAmountInput, setPlanAmountInput] = useState('')

  // "Deposit / Withdraw" Form States
  const [logAmount, setLogAmount] = useState('')
  const [logNote, setLogNote] = useState('')
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0])

  // Fetch logs for a specific plan
  const fetchLogs = async (savingId: string) => {
    setLoadingLogs(true)
    try {
      const { data, error } = await supabase
        .from('saving_logs')
        .select('*')
        .eq('saving_id', savingId)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error
      setSelectedPlanLogs(data || [])
    } catch (err) {
      console.error('Error fetching logs:', err)
    } finally {
      setLoadingLogs(false)
    }
  }

  // Format inputs as Rupiah dynamically
  const formatRupiahInput = (value: string, setter: (val: string) => void) => {
    const rawValue = value.replace(/\D/g, '')
    if (rawValue) {
      setter(new Intl.NumberFormat('id-ID').format(Number(rawValue)))
    } else {
      setter('')
    }
  }

  const parseFormattedNumber = (value: string): number => {
    return Number(value.replace(/\D/g, '')) || 0
  }

  // Create Saving Plan
  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault()
    const targetVal = parseFormattedNumber(planTarget)
    const planAmtVal = parseFormattedNumber(planAmountInput)

    if (!planName || targetVal <= 0 || !user) return

    setActionLoading(true)
    try {
      const { data, error } = await supabase
        .from('savings')
        .insert([
          {
            user_id: user.id,
            name: planName,
            target_amount: targetVal,
            current_amount: 0,
            currency: 'IDR',
            plan_type: planType,
            plan_amount: planType === 'flexible' ? 0 : planAmtVal,
          }
        ])
        .select()

      if (error) throw error

      if (data) {
        setSavingPlans([data[0], ...savingPlans])
        // Reset form
        setPlanName('')
        setPlanTarget('')
        setPlanType('flexible')
        setPlanAmountInput('')
        setActiveModal(null)
      }
    } catch (err) {
      console.error('Error creating plan:', err)
      alert('Gagal membuat rencana tabungan.')
    } finally {
      setActionLoading(false)
    }
  }

  // Deposit Money (Menabung)
  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault()
    const amountVal = parseFormattedNumber(logAmount)
    if (amountVal <= 0 || !selectedPlan || !user) return

    setActionLoading(true)
    try {
      // 1. Insert saving log
      const { error: logError } = await supabase
        .from('saving_logs')
        .insert([
          {
            user_id: user.id,
            saving_id: selectedPlan.id,
            amount: amountVal,
            note: logNote || 'Menabung',
            date: logDate,
          }
        ])

      if (logError) throw logError

      // 2. Update current_amount
      const newAmount = selectedPlan.current_amount + amountVal
      const { error: updateError } = await supabase
        .from('savings')
        .update({ current_amount: newAmount })
        .eq('id', selectedPlan.id)

      if (updateError) throw updateError

      // 3. Update local state
      setSavingPlans(
        savingPlans.map(plan =>
          plan.id === selectedPlan.id
            ? { ...plan, current_amount: newAmount }
            : plan
        )
      )

      // 4. Kurangi totalBalance (catat sebagai transaksi expense)
      if (onDeposit) {
        onDeposit(amountVal, selectedPlan.name)
      }

      // Reset
      setLogAmount('')
      setLogNote('')
      setLogDate(new Date().toISOString().split('T')[0])
      setActiveModal(null)
      setSelectedPlan(null)
    } catch (err) {
      console.error('Error depositing money:', err)
      alert('Gagal memproses simpanan tabungan.')
    } finally {
      setActionLoading(false)
    }
  }

  // Withdraw Money (Tarik Tabungan)
  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault()
    const amountVal = parseFormattedNumber(logAmount)
    if (amountVal <= 0 || !selectedPlan || !user) return

    if (amountVal > selectedPlan.current_amount) {
      alert('Nominal penarikan melebihi saldo tabungan saat ini!')
      return
    }

    setActionLoading(true)
    try {
      // 1. Insert negative amount into saving logs
      const { error: logError } = await supabase
        .from('saving_logs')
        .insert([
          {
            user_id: user.id,
            saving_id: selectedPlan.id,
            amount: -amountVal,
            note: logNote || 'Tarik Tabungan',
            date: logDate,
          }
        ])

      if (logError) throw logError

      // 2. Update current_amount
      const newAmount = selectedPlan.current_amount - amountVal
      const { error: updateError } = await supabase
        .from('savings')
        .update({ current_amount: newAmount })
        .eq('id', selectedPlan.id)

      if (updateError) throw updateError

      // 3. Update local state
      setSavingPlans(
        savingPlans.map(plan =>
          plan.id === selectedPlan.id
            ? { ...plan, current_amount: newAmount }
            : plan
        )
      )

      // 4. Kembalikan saldo ke total saldo (catat sebagai transaksi income)
      if (onWithdraw) {
        onWithdraw(amountVal, selectedPlan.name)
      }

      // Reset
      setLogAmount('')
      setLogNote('')
      setLogDate(new Date().toISOString().split('T')[0])
      setActiveModal(null)
      setSelectedPlan(null)
    } catch (err) {
      console.error('Error withdrawing money:', err)
      alert('Gagal memproses penarikan tabungan.')
    } finally {
      setActionLoading(false)
    }
  }

  // Delete Saving Plan
  const handleDeletePlan = async (planId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus rencana tabungan ini? Semua riwayat tabungan ini juga akan dihapus.')) return

    try {
      // Supabase cascade delete should handle the logs if defined, but we delete both just in case
      await supabase.from('saving_logs').delete().eq('saving_id', planId)
      const { error } = await supabase.from('savings').delete().eq('id', planId)

      if (error) throw error

      setSavingPlans(savingPlans.filter(p => p.id !== planId))
    } catch (err) {
      console.error('Error deleting plan:', err)
      alert('Gagal menghapus rencana tabungan.')
    }
  }

  // Helper translations for plan cycles
  const getPlanTypeLabel = (type: string) => {
    switch (type) {
      case 'weekly': return 'Mingguan'
      case 'monthly': return 'Bulanan'
      default: return 'Fleksibel'
    }
  }

  // Calculate global savings metrics
  const totalSaved = savingPlans.reduce((acc, p) => acc + p.current_amount, 0)
  const totalTarget = savingPlans.reduce((acc, p) => acc + p.target_amount, 0)
  const overallProgressPercent = totalTarget > 0 ? Math.min(Math.round((totalSaved / totalTarget) * 100), 100) : 0

  return (
    <div className="space-y-8 font-sans">

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Total Terkumpul */}
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-3xl p-6 text-white shadow-lg shadow-emerald-500/10 flex items-center justify-between relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 w-28 h-28 bg-white/10 rounded-full blur-2xl"></div>
          <div className="space-y-2 relative z-10">
            <p className="text-emerald-100 text-sm font-medium">Total Terkumpul</p>
            <h3 className="text-3xl font-extrabold tracking-tight">
              Rp {new Intl.NumberFormat('id-ID').format(totalSaved)}
            </h3>
            <p className="text-xs text-emerald-100/80">
              Dari {savingPlans.length} rencana tabungan aktif
            </p>
          </div>
          <div className="w-14 h-14 bg-white/10 text-white rounded-2xl flex items-center justify-center relative z-10 backdrop-blur-sm">
            <PiggyBank className="w-8 h-8" />
          </div>
        </div>

        {/* Total Target */}
        <div className="bg-white dark:bg-[#1b2336] border border-gray-100 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm flex items-center justify-between transition-all">
          <div className="space-y-2">
            <p className="text-gray-500 dark:text-slate-400 text-sm font-medium">Akumulasi Target</p>
            <h3 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Rp {new Intl.NumberFormat('id-ID').format(totalTarget)}
            </h3>
            <p className="text-xs text-gray-400 dark:text-slate-400">
              Jumlah dana yang ingin dicapai
            </p>
          </div>
          <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center">
            <Target className="w-8 h-8" />
          </div>
        </div>

        {/* Global Progress */}
        <div className="bg-white dark:bg-[#1b2336] border border-gray-100 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm flex flex-col justify-between transition-all">
          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="text-gray-500 dark:text-slate-400 text-sm font-medium">Total Progres</p>
              <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white mt-1">{overallProgressPercent}%</h3>
            </div>
            <div className="w-12 h-12 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center">
              <Coins className="w-6 h-6" />
            </div>
          </div>
          <div className="w-full bg-gray-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
            <div
              className="bg-amber-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${overallProgressPercent}%` }}
            ></div>
          </div>
        </div>

      </div>

      {/* Main Header / Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Rencana Tabungan Anda</h3>
          <p className="text-sm text-gray-500 dark:text-slate-400">Tetapkan target dan catat tabungan secara konsisten.</p>
        </div>
        <button
          onClick={() => setActiveModal('create')}
          className="flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-semibold text-sm transition-all shadow-md shadow-emerald-500/10 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Buat Rencana Baru
        </button>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center">
          <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
          <p className="text-gray-500 dark:text-slate-400 font-medium">Memuat data tabungan...</p>
        </div>
      ) : savingPlans.length === 0 ? (
        /* Empty State */
        <div className="border-2 border-dashed border-gray-200 dark:border-slate-800/80 rounded-3xl p-12 text-center max-w-lg mx-auto mt-6">
          <div className="w-16 h-16 bg-yellow-50 dark:bg-amber-950/20 text-yellow-600 dark:text-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <PiggyBank className="w-8 h-8" />
          </div>
          <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Belum ada target tabungan</h4>
          <p className="text-gray-500 dark:text-slate-400 text-sm mb-6 max-w-xs mx-auto">
            Mulai kebiasaan baik dengan menetapkan target dana untuk kebutuhan masa depan Anda sekarang juga.
          </p>
          <button
            onClick={() => setActiveModal('create')}
            className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-semibold text-sm transition-all cursor-pointer"
          >
            Mulai Menabung
          </button>
        </div>
      ) : (
        /* Grid list of plans */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {savingPlans.map(plan => {
            const progress = plan.target_amount > 0 ? Math.min(Math.round((plan.current_amount / plan.target_amount) * 100), 100) : 0

            // Premium dynamic gradients depending on completion percentages
            let progressColor = 'from-blue-500 to-indigo-500'
            if (progress >= 80) {
              progressColor = 'from-emerald-500 to-teal-500'
            } else if (progress >= 40) {
              progressColor = 'from-amber-500 to-orange-500'
            }

            return (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                key={plan.id}
                className="bg-white dark:bg-[#1b2336] border border-gray-100 dark:border-slate-800/80 hover:border-gray-200 dark:hover:border-slate-700/80 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Card Head */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-slate-300 text-xs font-semibold rounded-full border border-gray-100 dark:border-slate-700/80">
                        <Calendar className="w-3.5 h-3.5" />
                        {getPlanTypeLabel(plan.plan_type)}
                        {plan.plan_type !== 'flexible' && ` - Rp ${new Intl.NumberFormat('id-ID').format(plan.plan_amount)}`}
                      </span>
                      <h4 className="text-xl font-bold text-gray-900 dark:text-white mt-2.5">{plan.name}</h4>
                    </div>

                    <button
                      onClick={() => handleDeletePlan(plan.id)}
                      className="p-2 text-gray-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                      title="Hapus rencana tabungan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Pricing Progress numbers */}
                  <div className="flex justify-between items-end text-sm mb-2 pt-2">
                    <div>
                      <p className="text-xs text-gray-400 dark:text-slate-400 font-medium">Terkumpul</p>
                      <p className="text-base font-bold text-gray-900 dark:text-slate-200 mt-0.5">
                        Rp {new Intl.NumberFormat('id-ID').format(plan.current_amount)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400 dark:text-slate-400 font-medium">Target</p>
                      <p className="text-base font-bold text-gray-900 dark:text-slate-200 mt-0.5">
                        Rp {new Intl.NumberFormat('id-ID').format(plan.target_amount)}
                      </p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-gray-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden mb-1 relative">
                    <div
                      className={`bg-gradient-to-r ${progressColor} h-full rounded-full transition-all duration-700`}
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>

                  <div className="flex justify-between items-center text-xs text-gray-400 dark:text-slate-400 font-medium mb-6">
                    <span>Progres</span>
                    <span>{progress}%</span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="grid grid-cols-3 gap-2.5 pt-2 border-t border-gray-50 dark:border-slate-800/80">
                  <button
                    onClick={() => {
                      setSelectedPlan(plan)
                      setActiveModal('deposit')
                    }}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-emerald-50 dark:bg-emerald-950/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    <ArrowUpCircle className="w-4 h-4" />
                    Tabung
                  </button>
                  <button
                    onClick={() => {
                      setSelectedPlan(plan)
                      setActiveModal('withdraw')
                    }}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-700 dark:text-red-400 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    <ArrowDownCircle className="w-4 h-4" />
                    Tarik
                  </button>
                  <button
                    onClick={() => {
                      setSelectedPlan(plan)
                      fetchLogs(plan.id)
                      setActiveModal('logs')
                    }}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    <History className="w-4 h-4" />
                    Riwayat
                  </button>
                </div>

              </motion.div>
            )
          })}
        </div>
      )}

      {/* Overlay Modals container */}
      <AnimatePresence>
        {activeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.98 }}
              className="bg-white dark:bg-[#131b2e] rounded-3xl shadow-xl w-full max-w-md max-h-[85vh] overflow-y-auto border border-gray-100 dark:border-slate-800/80 flex flex-col transition-all"
            >

              {/* Modal Head */}
              <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-slate-800/80">
                <h4 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  {activeModal === 'create' && <><PiggyBank className="w-5 h-5 text-emerald-600 dark:text-emerald-450" /> Buat Target Tabungan</>}
                  {activeModal === 'deposit' && <><ArrowUpCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-450" /> Simpan Uang Tabungan</>}
                  {activeModal === 'withdraw' && <><ArrowDownCircle className="w-5 h-5 text-red-600 dark:text-red-400" /> Tarik Uang Tabungan</>}
                  {activeModal === 'logs' && <><History className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> Riwayat Transaksi</>}
                </h4>
                <button
                  onClick={() => {
                    setActiveModal(null)
                    setSelectedPlan(null)
                    setSelectedPlanLogs([])
                  }}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5 text-gray-400 hover:text-gray-600 dark:text-slate-400 dark:hover:text-slate-300" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 flex-1 text-gray-900 dark:text-slate-100">

                {/* 1. CREATE MODAL FORM */}
                {activeModal === 'create' && (
                  <form onSubmit={handleCreatePlan} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Nama Target / Rencana</label>
                      <input
                        type="text"
                        required
                        value={planName}
                        onChange={(e) => setPlanName(e.target.value)}
                        placeholder="Contoh: Beli Laptop Baru, Liburan Akhir Tahun"
                        className="block w-full px-4 py-3 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50 dark:bg-[#1b2336] outline-none text-gray-900 dark:text-slate-100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Target Dana</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <span className="text-gray-500 dark:text-slate-400 font-semibold text-sm">Rp</span>
                        </div>
                        <input
                          type="text"
                          required
                          value={planTarget}
                          onChange={(e) => formatRupiahInput(e.target.value, setPlanTarget)}
                          placeholder="0"
                          className="block w-full pl-12 pr-4 py-3 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50 dark:bg-[#1b2336] outline-none text-gray-900 dark:text-slate-100 font-semibold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Metode Menabung</label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['flexible', 'weekly', 'monthly'] as const).map(type => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setPlanType(type)}
                            className={`py-2 px-3 text-xs font-semibold rounded-xl border text-center transition-all cursor-pointer ${planType === type
                              ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800'
                              : 'bg-white dark:bg-[#1b2336] text-gray-500 dark:text-slate-400 border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800'
                              }`}
                          >
                            {getPlanTypeLabel(type)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {planType !== 'flexible' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-1"
                      >
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                          Nominal per {planType === 'weekly' ? 'Minggu' : 'Bulan'}
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <span className="text-gray-500 dark:text-slate-450 font-semibold text-sm">Rp</span>
                          </div>
                          <input
                            type="text"
                            required
                            value={planAmountInput}
                            onChange={(e) => formatRupiahInput(e.target.value, setPlanAmountInput)}
                            placeholder="0"
                            className="block w-full pl-12 pr-4 py-3 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50 dark:bg-[#1b2336] outline-none text-gray-900 dark:text-slate-100 font-semibold"
                          />
                        </div>
                      </motion.div>
                    )}

                    <div className="pt-4">
                      <button
                        type="submit"
                        disabled={actionLoading}
                        className="w-full flex items-center justify-center gap-2 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all disabled:opacity-75 cursor-pointer"
                      >
                        {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Simpan Target'}
                      </button>
                    </div>
                  </form>
                )}

                {/* 2. DEPOSIT MODAL FORM */}
                {activeModal === 'deposit' && selectedPlan && (
                  <form onSubmit={handleDeposit} className="space-y-4">
                    <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl p-4 mb-2 flex items-start gap-3">
                      <Info className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-emerald-800 dark:text-emerald-400 font-medium">Target: {selectedPlan.name}</p>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                          Saldo Terkumpul saat ini: <strong>Rp {new Intl.NumberFormat('id-ID').format(selectedPlan.current_amount)}</strong>
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Nominal Setoran</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <span className="text-gray-500 dark:text-slate-400 font-semibold text-sm">Rp</span>
                        </div>
                        <input
                          type="text"
                          required
                          value={logAmount}
                          onChange={(e) => formatRupiahInput(e.target.value, setLogAmount)}
                          placeholder="0"
                          autoFocus
                          className="block w-full pl-12 pr-4 py-3 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50 dark:bg-[#1b2336] outline-none text-gray-900 dark:text-slate-100 font-bold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Tanggal</label>
                      <input
                        type="date"
                        required
                        value={logDate}
                        onChange={(e) => setLogDate(e.target.value)}
                        className="block w-full px-4 py-3 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50 dark:bg-[#1b2336] outline-none text-gray-900 dark:text-slate-100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Catatan Setoran</label>
                      <input
                        type="text"
                        value={logNote}
                        onChange={(e) => setLogNote(e.target.value)}
                        placeholder="Contoh: Dari sisa gaji bulanan, tabungan harian"
                        className="block w-full px-4 py-3 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50 dark:bg-[#1b2336] outline-none text-gray-900 dark:text-slate-100"
                      />
                    </div>

                    <div className="pt-4">
                      <button
                        type="submit"
                        disabled={actionLoading}
                        className="w-full flex items-center justify-center gap-2 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all disabled:opacity-75 cursor-pointer"
                      >
                        {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Setor Tabungan'}
                      </button>
                    </div>
                  </form>
                )}

                {/* 3. WITHDRAW MODAL FORM */}
                {activeModal === 'withdraw' && selectedPlan && (
                  <form onSubmit={handleWithdraw} className="space-y-4">
                    <div className="bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-2xl p-4 mb-2 flex items-start gap-3">
                      <Info className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-red-800 dark:text-red-400 font-medium">Target: {selectedPlan.name}</p>
                        <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
                          Saldo Maksimal yang dapat ditarik: <strong>Rp {new Intl.NumberFormat('id-ID').format(selectedPlan.current_amount)}</strong>
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Nominal Penarikan</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <span className="text-gray-500 dark:text-slate-400 font-semibold text-sm">Rp</span>
                        </div>
                        <input
                          type="text"
                          required
                          value={logAmount}
                          onChange={(e) => formatRupiahInput(e.target.value, setLogAmount)}
                          placeholder="0"
                          autoFocus
                          className="block w-full pl-12 pr-4 py-3 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-red-500 focus:border-red-500 bg-gray-50 dark:bg-[#1b2336] outline-none text-gray-900 dark:text-slate-100 font-bold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Tanggal</label>
                      <input
                        type="date"
                        required
                        value={logDate}
                        onChange={(e) => setLogDate(e.target.value)}
                        className="block w-full px-4 py-3 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-red-500 focus:border-red-500 bg-gray-50 dark:bg-[#1b2336] outline-none text-gray-900 dark:text-slate-100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Tujuan / Catatan Penarikan</label>
                      <input
                        type="text"
                        value={logNote}
                        onChange={(e) => setLogNote(e.target.value)}
                        placeholder="Contoh: Membeli barang, ditarik karena kebutuhan darurat"
                        className="block w-full px-4 py-3 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-red-500 focus:border-red-500 bg-gray-50 dark:bg-[#1b2336] outline-none text-gray-900 dark:text-slate-100"
                      />
                    </div>

                    <div className="pt-4">
                      <button
                        type="submit"
                        disabled={actionLoading}
                        className="w-full flex items-center justify-center gap-2 py-3.5 bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-500 text-white rounded-xl font-bold transition-all disabled:opacity-75 cursor-pointer"
                      >
                        {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Tarik Dana'}
                      </button>
                    </div>
                  </form>
                )}

                {/* 4. TRANSACTION LOGS LEDGER MODAL */}
                {activeModal === 'logs' && selectedPlan && (
                  <div className="space-y-4">
                    <div className="text-center pb-2">
                      <p className="text-sm font-semibold text-gray-500 dark:text-slate-400">Total Terkumpul saat ini</p>
                      <h4 className="text-2xl font-extrabold text-gray-900 dark:text-white mt-1">
                        Rp {new Intl.NumberFormat('id-ID').format(selectedPlan.current_amount)}
                      </h4>
                    </div>

                    {loadingLogs ? (
                      <div className="py-12 flex flex-col items-center justify-center">
                        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-3" />
                        <p className="text-gray-400 text-xs font-semibold">Mengambil riwayat transaksi...</p>
                      </div>
                    ) : selectedPlanLogs.length === 0 ? (
                      <div className="py-12 text-center">
                        <p className="text-gray-400 dark:text-slate-400 font-medium">Belum ada riwayat transaksi tabungan ini.</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-1 no-scrollbar">
                        {selectedPlanLogs.map(log => {
                          const isDeposit = log.amount > 0
                          const absoluteAmount = Math.abs(log.amount)

                          return (
                            <div
                              key={log.id}
                              className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all hover:bg-gray-50/50 dark:hover:bg-slate-800/40 ${
                                isDeposit
                                  ? 'border-emerald-100 dark:border-emerald-950 bg-emerald-50/10 dark:bg-emerald-950/10'
                                  : 'border-red-100 dark:border-red-950 bg-red-50/10 dark:bg-red-950/10'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                                  isDeposit
                                    ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400'
                                    : 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400'
                                }`}>
                                  {isDeposit ? <ArrowUpCircle className="w-5 h-5" /> : <ArrowDownCircle className="w-5 h-5" />}
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-gray-900 dark:text-slate-205 leading-tight">
                                    {log.note || (isDeposit ? 'Simpanan Tabungan' : 'Penarikan Tabungan')}
                                  </p>
                                  <span className="text-xs text-gray-400 dark:text-slate-400 font-medium mt-0.5 inline-block">
                                    {new Date(log.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                  </span>
                                </div>
                              </div>
                              <span className={`text-sm font-bold ${isDeposit ? 'text-emerald-650 dark:text-emerald-400' : 'text-red-650 dark:text-red-400'}`}>
                                {isDeposit ? '+' : '-'} Rp {new Intl.NumberFormat('id-ID').format(absoluteAmount)}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}

              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}
