'use client'

import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowDownCircle, ArrowUpCircle, CalendarDays, Save, ArrowRightLeft,
  Trash2, Loader2, ChevronUp, ChevronDown, Edit2, PiggyBank
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

interface TransaksiTabProps {
  editingTxId: string | null
  handleAddTransaction: (e: React.FormEvent) => Promise<void>
  isLoanMode: boolean
  setIsLoanMode: (val: boolean) => void
  txLoanStatus: string
  setTxLoanStatus: (val: any) => void
  txType: 'income' | 'expense'
  setTxType: (val: 'income' | 'expense') => void
  txAmount: string
  handleTxAmountChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  txCategory: string
  setTxCategory: (val: string) => void
  txScope: 'daily' | 'monthly'
  setTxScope: (val: 'daily' | 'monthly') => void
  txPersonName: string
  setTxPersonName: (val: string) => void
  txDescription: string
  setTxDescription: (val: string) => void
  txDate: string
  setTxDate: (val: string) => void
  CATEGORIES: any[]
  transactions: Transaction[]
  loadingTransactions: boolean
  handleDeleteAllTransactions: () => Promise<void>
  expandedDates: Record<string, boolean>
  toggleDateExpand: (dateStr: string) => void
  dailyBudget: number
  getFriendlyDateLabel: (dateStr: string) => string
  handleEditClick: (tx: Transaction) => void
  handleDeleteTransaction: (id: string) => Promise<void>
  isSubmittingTx: boolean
  handleCancelEdit: () => void
}

const parseDateOnly = (dateStr: string) => {
  if (!dateStr) return ''
  return dateStr.split('T')[0]
}

export default function TransaksiTab({
  editingTxId,
  handleAddTransaction,
  isLoanMode,
  setIsLoanMode,
  txLoanStatus,
  setTxLoanStatus,
  txType,
  setTxType,
  txAmount,
  handleTxAmountChange,
  txCategory,
  setTxCategory,
  txScope,
  setTxScope,
  txPersonName,
  setTxPersonName,
  txDescription,
  setTxDescription,
  txDate,
  setTxDate,
  CATEGORIES,
  transactions,
  loadingTransactions,
  handleDeleteAllTransactions,
  expandedDates,
  toggleDateExpand,
  dailyBudget,
  getFriendlyDateLabel,
  handleEditClick,
  handleDeleteTransaction,
  isSubmittingTx,
  handleCancelEdit
}: TransaksiTabProps) {
  return (
    <div className="flex flex-col lg:flex-row gap-8 h-full">
      {/* Form Kiri */}
      <div className="w-full lg:w-1/3 bg-white dark:bg-[#1b2336] border border-gray-100 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm h-fit transition-all">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
          {editingTxId ? 'Edit Transaksi' : 'Tambah Transaksi'}
        </h3>
        <form onSubmit={handleAddTransaction} className="space-y-5">
          
          {/* Toggle Mode: Biasa vs Pinjam */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5 font-bold">Jenis Transaksi</label>
            <div className="flex p-1 bg-gray-100 dark:bg-slate-800 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setIsLoanMode(false)
                  setTxLoanStatus('')
                }}
                className={`flex-1 flex justify-center items-center gap-1.5 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  !isLoanMode 
                    ? 'bg-white dark:bg-[#131b2e] text-emerald-700 dark:text-emerald-400 shadow-sm font-extrabold' 
                    : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'
                }`}
              >
                Transaksi Biasa
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsLoanMode(true)
                  if (!txLoanStatus) setTxLoanStatus('pinjam')
                }}
                className={`flex-1 flex justify-center items-center gap-1.5 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isLoanMode 
                    ? 'bg-white dark:bg-[#131b2e] text-amber-700 dark:text-amber-450 shadow-sm font-extrabold' 
                    : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'
                }`}
              >
                Pinjam / Meminjam
              </button>
            </div>
          </div>

          {!isLoanMode ? (
            <>
              {/* Toggle Type */}
              <div className="flex p-1 bg-gray-100 dark:bg-slate-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => setTxType('expense')}
                  className={`flex-1 flex justify-center items-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                    txType === 'expense' 
                      ? 'bg-white dark:bg-[#131b2e] text-red-650 dark:text-red-400 shadow-sm' 
                      : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'
                  }`}
                >
                  <ArrowDownCircle className="w-4 h-4" /> Pengeluaran
                </button>
                <button
                  type="button"
                  onClick={() => setTxType('income')}
                  className={`flex-1 flex justify-center items-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                    txType === 'income' 
                      ? 'bg-white dark:bg-[#131b2e] text-emerald-600 dark:text-emerald-400 shadow-sm' 
                      : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'
                  }`}
                >
                  <ArrowUpCircle className="w-4 h-4" /> Pemasukan
                </button>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1 font-bold">Nominal</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-gray-500 dark:text-slate-400 font-semibold">Rp</span>
                  </div>
                  <input
                    type="text"
                    required
                    value={txAmount}
                    onChange={handleTxAmountChange}
                    className="block w-full pl-12 pr-4 py-3 border border-gray-200 dark:border-slate-700/80 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50 dark:bg-[#121927] outline-none transition-shadow text-gray-900 dark:text-slate-100 font-semibold"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1 font-bold">Kategori</label>
                <select
                  value={txCategory}
                  onChange={(e) => setTxCategory(e.target.value)}
                  className="block w-full px-4 py-3 border border-gray-200 dark:border-slate-700/80 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50 dark:bg-[#121927] outline-none text-gray-900 dark:text-slate-100 font-medium"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat.id} className="dark:bg-[#131b2e] dark:text-slate-200" value={cat.id}>{cat.label}</option>
                  ))}
                </select>
              </div>

              {/* Scope (Cakupan Transaksi) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5 font-bold">Tipe Pengeluaran / Cakupan</label>
                <div className="flex p-1 bg-gray-100 dark:bg-slate-800 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setTxScope('daily')}
                    className={`flex-1 flex justify-center items-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      txScope === 'daily' 
                        ? 'bg-white dark:bg-[#131b2e] text-emerald-700 dark:text-emerald-400 shadow-sm font-extrabold' 
                        : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'
                    }`}
                  >
                    <CalendarDays className="w-3.5 h-3.5" /> Harian (Budget)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTxScope('monthly')}
                    className={`flex-1 flex justify-center items-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      txScope === 'monthly' 
                        ? 'bg-white dark:bg-[#131b2e] text-indigo-700 dark:text-indigo-400 shadow-sm font-extrabold' 
                        : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'
                    }`}
                  >
                    <Save className="w-3.5 h-3.5" /> Bulanan (Monthly)
                  </button>
                </div>
                <p className="text-[10px] text-gray-400 dark:text-slate-400 mt-1">
                  *Transaksi bulanan tidak dihitung ke limit budget harian.
                </p>
              </div>
            </>
          ) : (
            <>
              {/* Status Pinjaman */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1 font-bold">Status Pinjaman / Alur Uang</label>
                <select
                  value={txLoanStatus}
                  onChange={(e) => setTxLoanStatus(e.target.value as any)}
                  className="block w-full px-4 py-3 border border-gray-200 dark:border-slate-700/80 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50 dark:bg-[#121927] outline-none text-gray-900 dark:text-slate-100 font-medium text-sm"
                >
                  <option className="dark:bg-[#131b2e] dark:text-slate-200" value="pinjam">Saya Pinjam Uang (Pemasukan / + Saldo)</option>
                  <option className="dark:bg-[#131b2e] dark:text-slate-200" value="memberi_pinjaman">Saya Memberi Pinjaman (Pengeluaran / - Saldo)</option>
                  <option className="dark:bg-[#131b2e] dark:text-slate-200" value="bayar_utang">Saya Bayar Utang (Pengeluaran / - Saldo)</option>
                  <option className="dark:bg-[#131b2e] dark:text-slate-200" value="piutang_kembali">Uang Pinjaman Dikembalikan (Pemasukan / + Saldo)</option>
                </select>
              </div>

              {/* Nama Orang */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1 font-bold">Nama Orang (Pemberi / Penerima)</label>
                <input
                  type="text"
                  required
                  value={txPersonName}
                  onChange={(e) => setTxPersonName(e.target.value)}
                  className="block w-full px-4 py-3 border border-gray-200 dark:border-slate-700/80 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50 dark:bg-[#121927] outline-none text-gray-900 dark:text-slate-100 font-medium text-sm"
                  placeholder="Masukkan nama orang..."
                />
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1 font-bold">Nominal Pinjaman</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-gray-500 dark:text-slate-400 font-semibold">Rp</span>
                  </div>
                  <input
                    type="text"
                    required
                    value={txAmount}
                    onChange={handleTxAmountChange}
                    className="block w-full pl-12 pr-4 py-3 border border-gray-200 dark:border-slate-700/80 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50 dark:bg-[#121927] outline-none transition-shadow text-gray-900 dark:text-slate-100 font-bold"
                    placeholder="0"
                  />
                </div>
              </div>
            </>
          )}

          {/* Date Picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1 font-bold">Tanggal</label>
            <input
              type="date"
              required
              value={txDate}
              onChange={(e) => setTxDate(e.target.value)}
              className="block w-full px-4 py-3 border border-gray-200 dark:border-slate-700/80 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50 dark:bg-[#121927] outline-none text-gray-900 dark:text-slate-100 font-medium"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1 font-bold">Catatan / Deskripsi</label>
            <textarea
              value={txDescription}
              onChange={(e) => setTxDescription(e.target.value)}
              className="block w-full px-4 py-3 border border-gray-200 dark:border-slate-700/80 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50 dark:bg-[#121927] outline-none transition-shadow text-gray-900 dark:text-slate-100 text-sm font-medium"
              placeholder={isLoanMode ? "Keterangan tambahan utang..." : "Contoh: Makan siang nasi goreng..."}
              rows={2}
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            {editingTxId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="flex-1 py-3 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 rounded-xl font-bold text-sm transition-all hover:bg-gray-200 dark:hover:bg-slate-700 cursor-pointer"
              >
                Batal
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmittingTx}
              className="flex-1 flex justify-center items-center gap-2 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-bold text-sm transition-all hover:shadow-lg shadow-emerald-500/10 cursor-pointer"
            >
              {isSubmittingTx ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                editingTxId ? 'Simpan' : 'Tambah'
              )}
            </button>
          </div>

        </form>
      </div>

      {/* Bagian Kanan */}
      <div className="w-full lg:w-2/3 flex flex-col gap-8">
        
        {/* Bagian 1: Daftar Transaksi Hari Ini */}
        <div className="bg-white dark:bg-[#1b2336] border border-gray-100 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm transition-all flex flex-col max-h-[360px]">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-50 dark:border-slate-800/80">
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">Transaksi Hari Terpilih</h3>
              <p className="text-[10px] text-gray-400 dark:text-slate-400">
                Menampilkan daftar keuangan Anda pada tanggal navigasi terpilih.
              </p>
            </div>
            <span className="text-[10px] font-extrabold bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 px-2.5 py-1 rounded-lg border border-indigo-100/50 dark:border-indigo-900/30">
              {new Date(txDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 no-scrollbar min-h-[150px]">
            {loadingTransactions ? (
              <div className="h-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
              </div>
            ) : transactions.filter(t => parseDateOnly(t.date) === txDate).length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-6">
                <p className="text-xs font-semibold text-gray-500 dark:text-slate-400">Belum ada transaksi di tanggal ini</p>
                <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-1">Gunakan form di sebelah kiri untuk menambah catatan.</p>
              </div>
            ) : (
              transactions
                .filter(t => parseDateOnly(t.date) === txDate)
                .map((tx) => {
                  const isSavingsLog = tx.description?.toLowerCase().includes('menabung') || tx.description?.toLowerCase().includes('transfer sisa budget') || tx.description?.toLowerCase().includes('tarik tabungan')
                  const displayCategory = isSavingsLog ? 'tabungan' : tx.category
                  
                  const catData = CATEGORIES.find(c => c.id === displayCategory) || 
                                  (displayCategory === 'tabungan' 
                                    ? { id: 'tabungan', label: 'Tabungan', icon: PiggyBank, color: 'text-amber-500', bg: 'bg-amber-50', darkBg: 'dark:bg-amber-950/20 dark:text-amber-400' }
                                    : CATEGORIES[CATEGORIES.length - 1])
                  
                  const Icon = catData.icon
                  const isExpense = tx.type === 'expense'

                  return (
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      key={tx.id}
                      className="group flex items-center justify-between p-3 bg-gray-50/50 hover:bg-gray-50 dark:bg-[#121927]/20 dark:hover:bg-[#121927]/40 border border-gray-100/50 dark:border-slate-800/50 rounded-2xl transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${catData.bg} ${catData.color} ${catData.darkBg || ''} shrink-0`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-slate-100 leading-snug">
                            {tx.description || catData.label}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] text-gray-400 dark:text-slate-400 font-semibold">{catData.label}</span>
                            <span className="text-gray-300 dark:text-slate-700">•</span>
                            {(tx.loan_status && tx.loan_status !== 'none') ? (
                              (() => {
                                const virtualStatus =
                                  tx.loan_status === 'ongoing'
                                    ? (tx.type === 'income' ? 'pinjam' : 'memberi_pinjaman')
                                    : (tx.type === 'expense' ? 'bayar_utang' : 'piutang_kembali')
                                
                                return (
                                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold border ${
                                    virtualStatus === 'pinjam'
                                      ? 'bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-900/30'
                                      : virtualStatus === 'piutang_kembali'
                                        ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30'
                                        : virtualStatus === 'memberi_pinjaman'
                                          ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-900/30'
                                          : 'bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border-rose-100 dark:border-rose-900/30'
                                  }`}>
                                    {virtualStatus === 'pinjam' && `Utang dari ${tx.person_name}`}
                                    {virtualStatus === 'piutang_kembali' && `Piutang Kembali dari ${tx.person_name}`}
                                    {virtualStatus === 'memberi_pinjaman' && `Piutang ke ${tx.person_name}`}
                                    {virtualStatus === 'bayar_utang' && `Bayar Utang ke ${tx.person_name}`}
                                  </span>
                                )
                              })()
                            ) : (
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold border ${
                                tx.scope === 'monthly'
                                  ? 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/30'
                                  : 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30'
                              }`}>
                                {tx.scope === 'monthly' ? 'Bulanan' : 'Harian'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`font-bold text-base shrink-0 ${isExpense ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                          {isExpense ? '-' : '+'} Rp {new Intl.NumberFormat('id-ID').format(tx.amount)}
                        </span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEditClick(tx)}
                            className="p-1.5 text-gray-400 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-lg transition-colors cursor-pointer"
                            title="Edit transaksi"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteTransaction(tx.id)}
                            className="p-1.5 text-gray-400 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer"
                            title="Hapus transaksi"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )
                })
            )}
          </div>
        </div>

        {/* Bagian 2: Riwayat Transaksi Harian Terkelompok (Grouped Accordion) */}
        <div className="bg-white dark:bg-[#1b2336] border border-gray-100 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm flex-1 transition-all">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-50 dark:border-slate-800/80">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Riwayat Transaksi Harian</h3>
              <p className="text-xs text-gray-400 dark:text-slate-400 mt-0.5">
                Semua riwayat transaksi yang tersimpan rapi dan dikelompokkan per hari.
              </p>
            </div>
            {transactions.length > 0 && (
              <button
                onClick={handleDeleteAllTransactions}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                Hapus Semua
              </button>
            )}
          </div>

          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1 no-scrollbar">
            {loadingTransactions ? (
              <div className="h-40 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 bg-gray-100 dark:bg-slate-800/60 text-gray-400 dark:text-slate-500 rounded-2xl flex items-center justify-center mb-3">
                  <ArrowRightLeft className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-gray-500 dark:text-slate-300">Belum ada riwayat keuangan</p>
                <p className="text-xs text-gray-400 dark:text-slate-400 mt-1">Simpan transaksi harian pertama Anda untuk memulai.</p>
              </div>
            ) : (
              (() => {
                const grouped = transactions.reduce((acc, tx) => {
                  const dStr = parseDateOnly(tx.date)
                  if (!acc[dStr]) acc[dStr] = []
                  acc[dStr].push(tx)
                  return acc
                }, {} as Record<string, Transaction[]>)

                const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a))

                return sortedDates.map((dateStr) => {
                  const dayTxs = grouped[dateStr]
                  const isExpanded = !!expandedDates[dateStr]
                  
                  const dayIncome = dayTxs.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0)
                  const dayExpenses = dayTxs.filter(t => t.type === 'expense' && t.scope !== 'monthly' && (!t.loan_status || t.loan_status === 'none')).reduce((acc, t) => acc + t.amount, 0)
                  const totalDayExpenses = dayTxs.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0)
                  const surplus = dailyBudget - dayExpenses
                  const budgetPercent = dailyBudget > 0 ? Math.min(Math.round((dayExpenses / dailyBudget) * 100), 100) : 0

                  // Premium status styling
                  let progressColor = 'bg-emerald-500'
                  if (dayExpenses > dailyBudget && dailyBudget > 0) {
                    progressColor = 'bg-red-500'
                  } else if (budgetPercent >= 80) {
                    progressColor = 'bg-amber-500'
                  }

                  return (
                    <div key={dateStr} className="border border-gray-100 dark:border-slate-800/60 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all bg-white dark:bg-[#131b2e]">
                      {/* Accordion Header */}
                      <div 
                        onClick={() => toggleDateExpand(dateStr)}
                        className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer bg-gray-50/50 dark:bg-[#1b2336]/40 hover:bg-gray-50 dark:hover:bg-[#1b2336]/70 transition-colors select-none"
                      >
                        <div className="flex items-center gap-3">
                          <div className="text-gray-400 dark:text-slate-500">
                            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-extrabold text-gray-900 dark:text-white leading-snug">
                              {getFriendlyDateLabel(dateStr)}
                            </span>
                            <span className="text-[10px] text-gray-400 dark:text-slate-400 mt-0.5">
                              {dayTxs.length} transaksi
                            </span>
                          </div>
                        </div>

                        {/* Stats Summary */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                          {dayIncome > 0 && (
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">
                              +{new Intl.NumberFormat('id-ID').format(dayIncome)}
                            </span>
                          )}
                          {totalDayExpenses > 0 && (
                            <span className="font-bold text-red-600 dark:text-red-400">
                              -{new Intl.NumberFormat('id-ID').format(totalDayExpenses)}
                            </span>
                          )}
                          {dailyBudget > 0 && (
                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold border ${
                              dayExpenses > dailyBudget 
                                ? 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border-red-100 dark:border-red-900/30' 
                                : 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30'
                            }`}>
                              {dayExpenses > dailyBudget 
                                ? `Over budget: Rp ${new Intl.NumberFormat('id-ID').format(dayExpenses - dailyBudget)}` 
                                : `Sisa budget: Rp ${new Intl.NumberFormat('id-ID').format(surplus)}`
                              }
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Accordion Progress Bar */}
                      {dailyBudget > 0 && (
                        <div className="w-full bg-gray-100 dark:bg-slate-800 h-1.5 relative overflow-hidden">
                          <div 
                            className={`h-full ${progressColor} transition-all duration-500`}
                            style={{ width: `${budgetPercent}%` }}
                          />
                        </div>
                      )}

                      {/* Accordion Content */}
                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="border-t border-gray-50 dark:border-slate-800/50 p-4 bg-white dark:bg-[#131b2e] divide-y divide-gray-50 dark:divide-slate-800/55 space-y-3"
                          >
                            <div className="pb-3 flex justify-between items-center text-xs">
                              <span className="text-gray-400 dark:text-slate-400">Daftar Transaksi:</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setTxDate(dateStr)
                                }}
                                className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30 rounded-lg font-bold transition-colors cursor-pointer"
                              >
                                Kelola Hari Ini
                              </button>
                            </div>
                            <div className="space-y-2 pt-2">
                              {dayTxs.map((tx) => {
                                const catData = CATEGORIES.find(c => c.id === tx.category) || CATEGORIES[CATEGORIES.length - 1]
                                const Icon = catData.icon
                                const isExpense = tx.type === 'expense'

                                return (
                                  <div key={tx.id} className="flex items-center justify-between py-2 group/item">
                                    <div className="flex items-center gap-3">
                                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${catData.bg} ${catData.color} ${catData.darkBg || ''} shrink-0`}>
                                        <Icon className="w-5 h-5" />
                                      </div>
                                      <div>
                                        <p className="text-sm font-bold text-gray-900 dark:text-slate-200 leading-snug">{tx.description || catData.label}</p>
                                        <div className="flex items-center gap-1.5 text-[10px] text-gray-400 dark:text-slate-400">
                                          <span>{catData.label}</span>
                                          <span>•</span>
                                          {(tx.loan_status && tx.loan_status !== 'none') ? (
                                            (() => {
                                              const virtualStatus =
                                                tx.loan_status === 'ongoing'
                                                  ? (tx.type === 'income' ? 'pinjam' : 'memberi_pinjaman')
                                                  : (tx.type === 'expense' ? 'bayar_utang' : 'piutang_kembali')
                                              
                                              return (
                                                <span className={`px-1 rounded text-[8px] font-extrabold border ${
                                                  virtualStatus === 'pinjam'
                                                    ? 'bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-900/30'
                                                    : virtualStatus === 'piutang_kembali'
                                                      ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30'
                                                      : virtualStatus === 'memberi_pinjaman'
                                                        ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-900/30'
                                                        : 'bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border-rose-100 dark:border-rose-900/30'
                                                }`}>
                                                  {virtualStatus === 'pinjam' && `Utang dari ${tx.person_name}`}
                                                  {virtualStatus === 'piutang_kembali' && `Piutang Kembali dari ${tx.person_name}`}
                                                  {virtualStatus === 'memberi_pinjaman' && `Piutang ke ${tx.person_name}`}
                                                  {virtualStatus === 'bayar_utang' && `Bayar Utang ke ${tx.person_name}`}
                                                </span>
                                              )
                                            })()
                                          ) : (
                                            <span className={`px-1 rounded text-[8px] font-extrabold border ${
                                              tx.scope === 'monthly'
                                                ? 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/30'
                                                : 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30'
                                            }`}>
                                              {tx.scope === 'monthly' ? 'Bulanan' : 'Harian'}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <span className={`text-sm font-extrabold ${isExpense ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                        {isExpense ? '-' : '+'} Rp {new Intl.NumberFormat('id-ID').format(tx.amount)}
                                      </span>
                                      <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                        <button
                                          onClick={() => handleEditClick(tx)}
                                          className="p-1 text-gray-400 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-lg transition-colors cursor-pointer"
                                          title="Edit transaksi"
                                        >
                                          <Edit2 className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteTransaction(tx.id)}
                                          className="p-1 text-gray-400 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer"
                                          title="Hapus transaksi"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )
                })
              })()
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
