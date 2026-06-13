'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Users, Settings, LogOut, Menu, X, Building, Target, CalendarDays, CheckSquare, FileText, Briefcase } from 'lucide-react'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [isSidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Leads', href: '/leads', icon: Target },
    { name: 'Pipeline', href: '/pipeline', icon: Briefcase },
    { name: 'Tasks', href: '/tasks', icon: CheckSquare },
    { name: 'Calendar', href: '/calendar', icon: CalendarDays },
    { name: 'Proposals', href: '/proposals', icon: FileText },
    { name: 'Clients', href: '/clients', icon: Building },
    { name: 'Settings', href: '/settings', icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 flex">
      {/* Mobile sidebar backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-zinc-900/80 backdrop-blur-xl border-r border-zinc-800 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-16 shrink-0 items-center px-6 border-b border-zinc-800">
          <span className="text-xl font-bold tracking-tighter text-cyan-500 flex items-center gap-2">
            <div className="w-6 h-6 bg-cyan-500 rounded flex items-center justify-center">
              <div className="w-2 h-2 bg-zinc-950 rounded-full" />
            </div>
            SaaS CRM
          </span>
        </div>
        <nav className="flex flex-1 flex-col p-4 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname.startsWith(item.href)
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`group flex items-center gap-x-3 rounded-md p-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-zinc-800/50 text-white border-l-2 border-cyan-500'
                    : 'text-zinc-400 hover:bg-zinc-800/30 hover:text-white'
                }`}
              >
                <item.icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-cyan-500' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
                {item.name}
              </Link>
            )
          })}
        </nav>
        <div className="p-4 border-t border-zinc-800">
          <button 
            onClick={handleLogout}
            className="group flex w-full items-center gap-x-3 rounded-md p-2 text-sm font-medium text-zinc-400 hover:bg-zinc-800/30 hover:text-white transition-colors"
          >
            <LogOut className="h-5 w-5 shrink-0 text-zinc-500 group-hover:text-zinc-300" />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col min-w-0">
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-xl px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-zinc-400 hover:text-zinc-300 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>

          {/* Header Right Content */}
          <div className="flex flex-1 justify-end gap-x-4 lg:gap-x-6 items-center">
            
            {/* Notifications Placeholder - Replaced by Bell component in production */}
            <button className="relative p-2 text-zinc-400 hover:text-white transition-colors">
              <span className="sr-only">View notifications</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
              </svg>
              {/* Dot badge */}
              <div className="absolute top-1 right-1.5 h-2 w-2 rounded-full bg-cyan-500 ring-2 ring-zinc-900"></div>
            </button>

            <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-zinc-800" aria-hidden="true" />
            
            <div className="flex items-center gap-x-4">
              <div className="h-8 w-8 rounded-full bg-cyan-900/50 border border-cyan-800/50 flex items-center justify-center text-cyan-500 font-bold text-xs" />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
