import React from 'react'
import Header from './Header'
import Sidebar from './Sidebar'

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen w-full bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('/back1.png')" }}>
      <Header />
      <div className="flex flex-row w-full pt-4 px-4 gap-4">
        <Sidebar />
        <main className="flex-1 flex flex-col overflow-x-hidden overflow-y-auto transition-all duration-300 ease-in-out">
          <div className="w-full max-w-none mx-auto mt-2 mb-6 px-4 py-4 bg-white/20 dark:bg-gray-900/20 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 backdrop-blur-md">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export default Layout 