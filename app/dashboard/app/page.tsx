'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, ArrowRightLeft, PiggyBank, Target, Wallet,
  Calculator, CalendarDays, Loader2, ArrowDownCircle,
  ChevronLeft, ChevronRight, X, Coffee, ShoppingBag, Bus,
  Home, Briefcase, MoreHorizontal
} from 'lucide-react'

// Import feature-specific tab components
import BudgetTab from '@/components/budget/BudgetTab'
import TransaksiTab from '@/components/transaksi/TransaksiTab'
import TabunganTab from '@/components/tabungan/TabunganTab'
import RingkasanTab from '@/components/ringkasan/RingkasanTab'

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

const CATEGORIES = [
  { id: 'makanan', label: 'Makanan & Minuman', icon: Coffee, color: 'text-orange-500', bg: 'bg-orange-50', darkBg: 'dark:bg-orange-950/20 dark:text-orange-400' },
  { id: 'belanja', label: 'Belanja', icon: ShoppingBag, color: 'text-purple-500', bg: 'bg-purple-50', darkBg: 'dark:bg-purple-950/20 dark:text-purple-400' },
  { id: 'transportasi', label: 'Transportasi', icon: Bus, color: 'text-blue-500', bg: 'bg-blue-50', darkBg: 'dark:bg-blue-950/20 dark:text-blue-400' },
  { id: 'sewa', label: 'Sewa Kost/Apt', icon: Home, color: 'text-rose-500', bg: 'bg-rose-50', darkBg: 'dark:bg-rose-950/20 dark:text-rose-400' },
  { id: 'gaji', label: 'Gaji', icon: Briefcase, color: 'text-emerald-500', bg: 'bg-emerald-50', darkBg: 'dark:bg-emerald-950/20 dark:text-emerald-400' },
  { id: 'lainnya', label: 'Lainnya', icon: MoreHorizontal, color: 'text-gray-500', bg: 'bg-gray-50', darkBg: 'dark:bg-slate-800/40 dark:text-slate-400' },
]

const tabs = [
  { id: 'budget', label: 'Budget Anda', icon: Calculator },
  { id: 'transactions', label: 'Transaksi', icon: ArrowRightLeft },
  { id: 'savings', label: 'Tabungan', icon: PiggyBank },
  { id: 'overview', label: 'Ringkasan', icon: LayoutDashboard },
]

const getLocalDateString = (d: Date = new Date()) => {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const date = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${date}`
}

const parseDateOnly = (dateStr: string) => {
  if (!dateStr) return ''
  return dateStr.split('T')[0]
}

export default function BudgetingAppPage() {
  const supabase = createClient()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState(tabs[0].id)
  
  // Navigasi Tanggal Harian Global
  const [selectedDate, setSelectedDate] = useState<string>(getLocalDateString())

  // Get or Create Daily Session helper
  const getOrCreateDailySession = async (userId: string, dateStr: string) => {
    const { data: existing, error } = await supabase
      .from('daily_sessions')
      .select('id')
      .eq('user_id', userId)
      .eq('date', dateStr)
      .maybeSingle()

    if (error) {
      console.warn('Warning: Gagal mengecek daily_sessions, mencoba membuat baru:', error.message)
    }

    if (existing) {
      return existing.id
    }

    const { data: inserted, error: insertError } = await supabase
      .from('daily_sessions')
      .insert({
        user_id: userId,
        date: dateStr
      })
      .select('id')
      .single()

    if (insertError) {
      console.error('Error saat membuat daily_sessions:', insertError.message)
      throw insertError
    }

    return inserted.id
  }

  // Transaction Feature States
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loadingTransactions, setLoadingTransactions] = useState(false)
  const [txAmount, setTxAmount] = useState('')
  const [txType, setTxType] = useState<'income' | 'expense'>('expense')
  const [txCategory, setTxCategory] = useState(CATEGORIES[0].id)
  const [txDescription, setTxDescription] = useState('')
  const [txDate, setTxDate] = useState(getLocalDateString())
  const [txScope, setTxScope] = useState<'daily' | 'monthly'>('daily')
  const [isLoanMode, setIsLoanMode] = useState(false)
  const [txLoanStatus, setTxLoanStatus] = useState<'pinjam' | 'memberi_pinjaman' | 'bayar_utang' | 'piutang_kembali' | ''>('')
  const [txPersonName, setTxPersonName] = useState('')

  const totalBalance = transactions.reduce((acc, tx) => {
    if (tx.type === 'income') return acc + tx.amount
    if (tx.type === 'expense') return acc - tx.amount
    return acc
  }, 0)

  // Sinkronisasi tanggal form dengan tanggal navigasi terpilih
  useEffect(() => {
    setTxDate(selectedDate)
  }, [selectedDate])

  // State untuk melacak accordion riwayat tanggal yang terbuka
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({})

  const toggleDateExpand = (dateStr: string) => {
    setExpandedDates(prev => ({
      ...prev,
      [dateStr]: !prev[dateStr]
    }))
  }

  const [isSubmittingTx, setIsSubmittingTx] = useState(false)
  const [editingTxId, setEditingTxId] = useState<string | null>(null)

  // Global Savings State
  const [savingPlans, setSavingPlans] = useState<any[]>([])
  const [loadingSavings, setLoadingSavings] = useState(true)

  // Rollover/Surplus Transferred Dates State
  const [transferredBudgetDates, setTransferredBudgetDates] = useState<string[]>([])

  // Modal & Notification States
  const [overBudgetAlert, setOverBudgetAlert] = useState<{
    isOpen: boolean
    date: string
    limit: number
    expense: number
  } | null>(null)

  // Budget Feature States
  const today = new Date()
  const defaultEndDate = new Date(today.getFullYear(), today.getMonth() + 1, 0)

  const [incomeInput, setIncomeInput] = useState<string>('')
  const [startDate, setStartDate] = useState<string>(today.toISOString().split('T')[0])
  const [endDate, setEndDate] = useState<string>(defaultEndDate.toISOString().split('T')[0])
  const [isSavingBudget, setIsSavingBudget] = useState(false)

  // Ringkasan Bulanan Feature States
  const [summaryMonth, setSummaryMonth] = useState<number>(today.getMonth() + 1)
  const [summaryYear, setSummaryYear] = useState<number>(today.getFullYear())
  const [hoveredSlice, setHoveredSlice] = useState<string | null>(null)

  // Hydration-safe localStorage loads
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedIncome = localStorage.getItem('smartcash_budget_income')
      const storedStart = localStorage.getItem('smartcash_budget_start')
      const storedEnd = localStorage.getItem('smartcash_budget_end')
      const storedTransferred = localStorage.getItem('smartcash_transferred_budget_dates')
      
      if (storedIncome) setIncomeInput(storedIncome)
      if (storedStart) setStartDate(storedStart)
      if (storedEnd) setEndDate(storedEnd)
      if (storedTransferred) {
        try {
          setTransferredBudgetDates(JSON.parse(storedTransferred))
        } catch (e) {
          console.error(e)
        }
      }
    }
  }, [])

  // Process income
  const numericIncome = Number(incomeInput.replace(/\D/g, '')) || 0

  const handleIncomeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '')
    let formatted = ''
    if (rawValue) {
      formatted = new Intl.NumberFormat('id-ID').format(Number(rawValue))
    }
    setIncomeInput(formatted)
    localStorage.setItem('smartcash_budget_income', formatted)
  }

  // Calculate days difference
  let daysDiff = 0
  if (startDate && endDate) {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = end.getTime() - start.getTime()
    daysDiff = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
  }

  const isValidPeriod = daysDiff > 0
  const dailyBudget = isValidPeriod && numericIncome > 0 ? Math.floor(numericIncome / daysDiff) : 0

  const fetchBudgetGlobal = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (!error && data) {
        const formatted = new Intl.NumberFormat('id-ID').format(data.monthly_budget)
        setIncomeInput(formatted)
        localStorage.setItem('smartcash_budget_income', formatted)
      }
    } catch (e) {
      console.error('Error fetching budget from database:', e)
    }
  }

  const handleSaveBudget = async () => {
    if (!user) return
    setIsSavingBudget(true)
    const numericIncome = Number(incomeInput.replace(/\D/g, '')) || 0

    try {
      const { data: existing, error: selectError } = await supabase
        .from('budgets')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (selectError) throw selectError

      if (existing) {
        const { error: updateError } = await supabase
          .from('budgets')
          .update({ monthly_budget: numericIncome })
          .eq('id', existing.id)

        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase
          .from('budgets')
          .insert({
            user_id: user.id,
            monthly_budget: numericIncome
          })

        if (insertError) throw insertError
      }

      localStorage.setItem('smartcash_budget_income', incomeInput)
      alert('Budget bulanan berhasil disimpan ke database!')
    } catch (e) {
      console.error('Error saving budget:', e)
      alert('Gagal menyimpan budget ke database. Silakan coba lagi.')
    } finally {
      setIsSavingBudget(false)
    }
  }

  // Saat tarik tabungan: masukkan transaksi income baru agar totalBalance naik
  const handleAddBalanceFromWithdrawal = async (amount: number, planName: string) => {
    if (!user) return
    const today = getLocalDateString()
    let sessionId: string | null = null
    try {
      sessionId = await getOrCreateDailySession(user.id, today)
    } catch (err) {
      console.warn('Gagal mendapatkan daily_session:', err)
    }

    const { data, error } = await supabase
      .from('transactions')
      .insert([{
        user_id: user.id,
        amount: amount,
        type: 'income',
        category: 'lainnya',
        description: `Tarik Tabungan - ${planName}`,
        date: today,
        session_id: sessionId,
        scope: 'daily',
        loan_status: 'none',
      }])
      .select()

    if (!error && data) {
      setTransactions(prev => [data[0], ...prev])
    } else {
      console.error('Gagal mencatat penarikan tabungan sebagai transaksi:', error)
    }
  }

  // Saat menabung: masukkan transaksi expense baru agar totalBalance berkurang
  const handleDeductBalanceForDeposit = async (amount: number, planName: string) => {
    if (!user) return
    const today = getLocalDateString()
    let sessionId: string | null = null
    try {
      sessionId = await getOrCreateDailySession(user.id, today)
    } catch (err) {
      console.warn('Gagal mendapatkan daily_session:', err)
    }

    const { data, error } = await supabase
      .from('transactions')
      .insert([{
        user_id: user.id,
        amount: amount,
        type: 'expense',
        category: 'lainnya',
        description: `Menabung - ${planName}`,
        date: today,
        session_id: sessionId,
        scope: 'daily',
        loan_status: 'none',
      }])
      .select()

    if (!error && data) {
      setTransactions(prev => [data[0], ...prev])
    } else {
      console.error('Gagal mencatat setoran tabungan sebagai transaksi:', error)
    }
  }

  const fetchSavingsGlobal = async () => {
    if (!user) return
    setLoadingSavings(true)
    try {
      const { data, error } = await supabase
        .from('savings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (!error && data) {
        setSavingPlans(data)
      }
    } catch (e) {
      console.error('Error fetching savings global:', e)
    } finally {
      setLoadingSavings(false)
    }
  }

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

  useEffect(() => {
    if (user) {
      fetchTransactions()
      fetchSavingsGlobal()
      fetchBudgetGlobal(user.id)
    }
  }, [user, supabase])

  const fetchTransactions = async () => {
    if (!user) return
    setLoadingTransactions(true)
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })

    if (!error && data) {
      setTransactions(data)
    }
    setLoadingTransactions(false)
  }

  const handleTxAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '')
    if (rawValue) {
      setTxAmount(new Intl.NumberFormat('id-ID').format(Number(rawValue)))
    } else {
      setTxAmount('')
    }
  }

  const getLoanDescription = (status: string, person: string) => {
    if (status === 'pinjam') return `Meminjam uang dari ${person}`
    if (status === 'memberi_pinjaman') return `Memberikan pinjaman kepada ${person}`
    if (status === 'bayar_utang') return `Membayar utang kepada ${person}`
    if (status === 'piutang_kembali') return `Menerima pengembalian piutang dari ${person}`
    return ''
  }

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!txAmount || !txCategory || !txDate || !user) return

    if (isLoanMode && (!txLoanStatus || !txPersonName.trim())) {
      alert('Harap pilih status pinjaman dan masukkan nama orang!')
      return
    }

    setIsSubmittingTx(true)
    const numericAmount = Number(txAmount.replace(/\D/g, ''))

    let sessionId: string | null = null
    try {
      sessionId = await getOrCreateDailySession(user.id, txDate)
    } catch (err: any) {
      console.warn('Gagal mendapatkan daily_session, melanjutkan tanpa session_id:', err.message || err)
    }

    const calculatedType = isLoanMode 
      ? (txLoanStatus === 'pinjam' || txLoanStatus === 'piutang_kembali' ? 'income' : 'expense')
      : txType
    const calculatedCategory = isLoanMode ? 'lainnya' : txCategory
    const calculatedDescription = isLoanMode ? getLoanDescription(txLoanStatus, txPersonName) : txDescription
    const calculatedScope = isLoanMode ? 'daily' : txScope

    if (editingTxId) {
      const { data, error } = await supabase
        .from('transactions')
        .update({
          amount: numericAmount,
          type: calculatedType,
          category: calculatedCategory,
          description: calculatedDescription,
          date: txDate,
          session_id: sessionId,
          scope: calculatedScope,
          person_name: isLoanMode ? txPersonName : null,
          loan_status: isLoanMode
            ? (txLoanStatus === 'bayar_utang' || txLoanStatus === 'piutang_kembali' ? 'paid' : 'ongoing')
            : 'none',
          note: isLoanMode ? txDescription : null,
        })
        .eq('id', editingTxId)
        .select()

      if (!error && data) {
        if (!isLoanMode && calculatedType === 'expense' && calculatedScope === 'daily' && dailyBudget > 0) {
          const otherExpenses = transactions
            .filter(t => t.id !== editingTxId && parseDateOnly(t.date) === txDate && t.type === 'expense' && t.scope !== 'monthly' && (!t.loan_status || t.loan_status === 'none'))
            .reduce((acc, t) => acc + t.amount, 0)
          const totalExpensesForDate = otherExpenses + numericAmount
          if (totalExpensesForDate > dailyBudget) {
            setOverBudgetAlert({
              isOpen: true,
              date: txDate,
              limit: dailyBudget,
              expense: totalExpensesForDate
            })
          }
        }

        setTransactions(transactions.map(t => t.id === editingTxId ? data[0] : t))
        handleCancelEdit()
      } else {
        console.error('Update error:', error)
        alert('Gagal memperbarui transaksi: ' + (error?.message || 'Eror tidak diketahui'))
      }
    } else {
      const { data, error } = await supabase
        .from('transactions')
        .insert([
          {
            user_id: user.id,
            amount: numericAmount,
            type: calculatedType,
            category: calculatedCategory,
            description: calculatedDescription,
            date: txDate,
            session_id: sessionId,
            scope: calculatedScope,
            person_name: isLoanMode ? txPersonName : null,
            loan_status: isLoanMode
              ? (txLoanStatus === 'bayar_utang' || txLoanStatus === 'piutang_kembali' ? 'paid' : 'ongoing')
              : 'none',
            note: isLoanMode ? txDescription : null,
          },
        ])
        .select()

      if (!error && data) {
        if (!isLoanMode && calculatedType === 'expense' && calculatedScope === 'daily' && dailyBudget > 0) {
          const totalExpensesForDate = transactions
            .filter(t => parseDateOnly(t.date) === txDate && t.type === 'expense' && t.scope !== 'monthly' && (!t.loan_status || t.loan_status === 'none'))
            .reduce((acc, t) => acc + t.amount, 0) + numericAmount
          if (totalExpensesForDate > dailyBudget) {
            setOverBudgetAlert({
              isOpen: true,
              date: txDate,
              limit: dailyBudget,
              expense: totalExpensesForDate
            })
          }
        }

        setTransactions([data[0], ...transactions])
        setTxAmount('')
        setTxDescription('')
        setTxPersonName('')
        setTxLoanStatus('')
        setIsLoanMode(false)
      } else {
        console.error('Insert error:', error)
        alert('Gagal menyimpan transaksi: ' + (error?.message || 'Eror tidak diketahui'))
      }
    }
    setIsSubmittingTx(false)
  }

  const handleEditClick = (tx: Transaction) => {
    setEditingTxId(tx.id)
    setTxType(tx.type as 'income' | 'expense')
    setTxAmount(new Intl.NumberFormat('id-ID').format(tx.amount))
    setTxCategory(tx.category)
    setTxDescription(tx.description || '')
    setTxDate(tx.date)
    setTxScope(tx.scope || 'daily')
    if (tx.loan_status && tx.loan_status !== 'none') {
      setIsLoanMode(true)
      const uiStatus =
        tx.loan_status === 'ongoing'
          ? (tx.type === 'income' ? 'pinjam' : 'memberi_pinjaman')
          : (tx.type === 'expense' ? 'bayar_utang' : 'piutang_kembali')
      setTxLoanStatus(uiStatus as any)
      setTxPersonName(tx.person_name || '')
      setTxDescription(tx.note || tx.description || '')
    } else {
      setIsLoanMode(false)
      setTxLoanStatus('')
      setTxPersonName('')
    }
  }

  const handleCancelEdit = () => {
    setEditingTxId(null)
    setTxAmount('')
    setTxDescription('')
    setTxType('expense')
    setTxCategory(CATEGORIES[0].id)
    setTxDate(getLocalDateString())
    setTxScope('daily')
    setIsLoanMode(false)
    setTxLoanStatus('')
    setTxPersonName('')
  }

  const handleDeleteTransaction = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) return
    
    const { error } = await supabase.from('transactions').delete().eq('id', id)
    if (!error) {
      setTransactions(transactions.filter(t => t.id !== id))
    } else {
      alert('Gagal menghapus transaksi.')
      console.error('Delete error:', error)
    }
  }

  const handleDeleteAllTransactions = async () => {
    if (transactions.length === 0 || !user) return
    if (!confirm('Apakah Anda yakin ingin menghapus SEMUA transaksi? Tindakan ini tidak dapat dibatalkan.')) return
    
    const { error } = await supabase.from('transactions').delete().eq('user_id', user.id)
    if (!error) {
      setTransactions([])
    } else {
      alert('Gagal menghapus semua transaksi.')
      console.error('Delete all error:', error)
    }
  }

  const selectedDateExpenses = transactions
    .filter(t => parseDateOnly(t.date) === selectedDate && t.type === 'expense' && t.scope !== 'monthly' && (!t.loan_status || t.loan_status === 'none'))
    .reduce((acc, t) => acc + t.amount, 0)

  const getFriendlyDateLabel = (dateStr: string) => {
    const today = getLocalDateString()
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = getLocalDateString(yesterday)

    if (dateStr === today) {
      return 'Hari Ini'
    } else if (dateStr === yesterdayStr) {
      return 'Kemarin'
    } else {
      return new Date(dateStr).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0b0f19]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-[#0b0f19] text-gray-900 dark:text-slate-100 font-sans transition-colors duration-300">
      <Navbar username={user.user_metadata?.username || 'Pengguna'} />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Budgeting Workspace
            </h1>
            <p className="text-gray-500 dark:text-slate-400 mt-1">
              Kelola keuanganmu dalam satu tempat yang terintegrasi.
            </p>
          </div>
          
          <div className="flex items-center gap-3 bg-white dark:bg-[#131b2e] p-2 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800/80">
            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
            <div className="pr-4">
              <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">Total Saldo</p>
              <p className={`text-lg font-bold ${totalBalance < 0 ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>
                {totalBalance < 0 ? '-' : ''}Rp {new Intl.NumberFormat('id-ID').format(Math.abs(totalBalance))}
              </p>
            </div>
          </div>
        </div>

        {/* Date Navigator Bar */}
        <div className="bg-white dark:bg-[#131b2e] p-4 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800/80 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => {
                const prev = new Date(selectedDate)
                prev.setDate(prev.getDate() - 1)
                setSelectedDate(getLocalDateString(prev))
              }}
              className="p-2.5 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700/80 text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer shrink-0"
              title="Hari Sebelumnya"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 tracking-wider">Navigasi Harian</span>
              <span className="text-base font-extrabold text-gray-900 dark:text-white leading-tight">
                {new Date(selectedDate).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
            
            <button
              onClick={() => {
                const next = new Date(selectedDate)
                next.setDate(next.getDate() + 1)
                setSelectedDate(getLocalDateString(next))
              }}
              className="p-2.5 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700/80 text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer shrink-0"
              title="Hari Berikutnya"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {selectedDate !== getLocalDateString() && (
              <button
                onClick={() => setSelectedDate(getLocalDateString())}
                className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:hover:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <CalendarDays className="w-4 h-4" />
                Kembali ke Hari Ini
              </button>
            )}
            
            <div className="relative">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="block px-3 py-2 text-xs border border-gray-200 dark:border-slate-700/80 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50 dark:bg-[#1b2336] outline-none text-gray-700 dark:text-slate-200 font-bold"
              />
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white dark:bg-[#131b2e] p-2 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800/80 mb-8 overflow-x-auto no-scrollbar transition-all">
          <div className="flex space-x-2 min-w-max">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-colors duration-200 cursor-pointer ${
                    isActive 
                      ? 'text-emerald-700 dark:text-emerald-400' 
                      : 'text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800/30'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="active-tab"
                      className="absolute inset-0 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl"
                      initial={false}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                  <span className="relative flex items-center gap-2">
                    <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-slate-500'}`} />
                    {tab.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white dark:bg-[#131b2e] rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800/80 min-h-[500px] p-6 lg:p-10 relative overflow-hidden transition-all">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {activeTab === 'overview' && (
                <RingkasanTab
                  transactions={transactions}
                  summaryMonth={summaryMonth}
                  setSummaryMonth={setSummaryMonth}
                  summaryYear={summaryYear}
                  setSummaryYear={setSummaryYear}
                  hoveredSlice={hoveredSlice}
                  setHoveredSlice={setHoveredSlice}
                  CATEGORIES={CATEGORIES}
                  setActiveTab={setActiveTab}
                />
              )}

              {activeTab === 'transactions' && (
                <TransaksiTab
                  editingTxId={editingTxId}
                  handleAddTransaction={handleAddTransaction}
                  isLoanMode={isLoanMode}
                  setIsLoanMode={setIsLoanMode}
                  txLoanStatus={txLoanStatus}
                  setTxLoanStatus={setTxLoanStatus}
                  txType={txType}
                  setTxType={setTxType}
                  txAmount={txAmount}
                  handleTxAmountChange={handleTxAmountChange}
                  txCategory={txCategory}
                  setTxCategory={setTxCategory}
                  txScope={txScope}
                  setTxScope={setTxScope}
                  txPersonName={txPersonName}
                  setTxPersonName={setTxPersonName}
                  txDescription={txDescription}
                  setTxDescription={setTxDescription}
                  txDate={txDate}
                  setTxDate={setTxDate}
                  CATEGORIES={CATEGORIES}
                  transactions={transactions}
                  loadingTransactions={loadingTransactions}
                  handleDeleteAllTransactions={handleDeleteAllTransactions}
                  expandedDates={expandedDates}
                  toggleDateExpand={toggleDateExpand}
                  dailyBudget={dailyBudget}
                  getFriendlyDateLabel={getFriendlyDateLabel}
                  handleEditClick={handleEditClick}
                  handleDeleteTransaction={handleDeleteTransaction}
                  isSubmittingTx={isSubmittingTx}
                  handleCancelEdit={handleCancelEdit}
                />
              )}

              {activeTab === 'savings' && (
                <TabunganTab 
                  user={user} 
                  supabase={supabase} 
                  savingPlans={savingPlans} 
                  setSavingPlans={setSavingPlans} 
                  fetchSavings={fetchSavingsGlobal} 
                  loading={loadingSavings}
                  onWithdraw={handleAddBalanceFromWithdrawal}
                  onDeposit={handleDeductBalanceForDeposit}
                />
              )}
              
              {activeTab === 'budget' && (
                <BudgetTab
                  user={user}
                  supabase={supabase}
                  incomeInput={incomeInput}
                  handleIncomeChange={handleIncomeChange}
                  startDate={startDate}
                  setStartDate={setStartDate}
                  endDate={endDate}
                  setEndDate={setEndDate}
                  dailyBudget={dailyBudget}
                  daysDiff={daysDiff}
                  isValidPeriod={isValidPeriod}
                  isSavingBudget={isSavingBudget}
                  handleSaveBudget={handleSaveBudget}
                  selectedDate={selectedDate}
                  selectedDateExpenses={selectedDateExpenses}
                  transferredBudgetDates={transferredBudgetDates}
                  setTransferredBudgetDates={setTransferredBudgetDates}
                  transactions={transactions}
                  setTransactions={setTransactions}
                  savingPlans={savingPlans}
                  setSavingPlans={setSavingPlans}
                  getOrCreateDailySession={getOrCreateDailySession}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Global Over-Budget Alert Modal */}
      <AnimatePresence>
        {overBudgetAlert && overBudgetAlert.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="bg-white dark:bg-[#131b2e] rounded-3xl shadow-2xl w-full max-w-md border border-gray-100 dark:border-slate-800/80 overflow-hidden flex flex-col relative"
            >
              <div className="bg-red-600 text-white px-6 py-8 text-center relative overflow-hidden flex flex-col items-center justify-center">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-3.5 backdrop-blur-sm">
                  <ArrowDownCircle className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-extrabold tracking-tight">⚠️ Batas Anggaran Terlampaui!</h3>
                <p className="text-xs text-red-100 mt-1 max-w-[280px] mx-auto font-medium">
                  Pengeluaran Anda pada hari ini telah melewati batas budget harian yang ditetapkan.
                </p>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-3 bg-gray-50 dark:bg-[#1b2336] rounded-2xl border border-gray-100 dark:border-slate-800/80">
                    <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider block">Batas Harian</span>
                    <span className="text-base font-extrabold text-gray-800 dark:text-slate-200 mt-0.5 block">
                      Rp {overBudgetAlert.limit.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="p-3 bg-red-50/55 dark:bg-red-950/20 rounded-2xl border border-red-100/50 dark:border-red-900/30">
                    <span className="text-[10px] font-bold text-red-500 dark:text-red-400 uppercase tracking-wider block">Total Belanja</span>
                    <span className="text-base font-extrabold text-red-600 dark:text-red-400 mt-0.5 block">
                      Rp {overBudgetAlert.expense.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-2xl flex items-start gap-2.5">
                  <div className="text-xs text-amber-800 dark:text-amber-400 font-medium leading-relaxed">
                    <strong>Rekomendasi Cerdas:</strong> Kurangi pengeluaran untuk sisa hari ini atau Anda dapat menyesuaikan budget bulanan Anda di tab <strong>Budget Anda</strong> untuk menaikkan limit harian.
                  </div>
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    onClick={() => {
                      setOverBudgetAlert(null)
                      setActiveTab('budget')
                    }}
                    className="flex-1 py-3 bg-indigo-55 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition-colors cursor-pointer text-center"
                  >
                    Sesuaikan Budget
                  </button>
                  <button
                    onClick={() => setOverBudgetAlert(null)}
                    className="flex-1 py-3 bg-gray-150 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 rounded-xl font-bold text-xs transition-colors cursor-pointer text-center"
                  >
                    Saya Mengerti
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
