import Link from 'next/link'

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-semibold text-white mb-6">Settings</h1>
      <div className="flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-64 shrink-0">
          <nav className="flex flex-col gap-1">
            <Link href="/settings/company" className="px-3 py-2 text-sm font-medium rounded-md text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors">
              Company Profile
            </Link>
            <Link href="/settings/team" className="px-3 py-2 text-sm font-medium rounded-md text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors">
              Team Members
            </Link>
            <Link href="/settings/integrations" className="px-3 py-2 text-sm font-medium rounded-md text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors">
              Integrations
            </Link>
          </nav>
        </aside>
        <main className="flex-1 bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-xl p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
