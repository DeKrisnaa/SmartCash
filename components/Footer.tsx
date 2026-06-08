export default function Footer() {
  return (
    <footer className="bg-white dark:bg-[#0b0f19] border-t border-gray-100 dark:border-slate-800/80 py-8 mt-auto transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-center items-center">
        <p className="text-gray-500 dark:text-slate-400 text-sm text-center">
          © {new Date().getFullYear()} SmartCash. All rights reserved.
        </p>
      </div>
    </footer>
  )
}