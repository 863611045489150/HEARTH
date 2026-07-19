import * as React from "react"
import { useLocation } from "wouter"
import { Sidebar } from "@/components/layout/Sidebar"
import { ProfileModal } from "@/components/profile/ProfileModal"
import { useGetMe } from "@workspace/api-client-react"
import { motion } from "framer-motion"

export function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const { data: user, error, isLoading } = useGetMe({
    query: {
      retry: false,
      queryKey: ["auth-me"]
    }
  })
  const [, setLocation] = useLocation()

  React.useEffect(() => {
    if (!isLoading && error) {
      setLocation("/auth")
    }
  }, [error, isLoading, setLocation])

  if (isLoading) {
    return <div className="min-h-screen bg-background" />
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <Sidebar />
      <main className="flex-1 ml-16 min-h-[100dvh] transition-all">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="max-w-[1200px] mx-auto p-8 md:p-12 lg:p-16 min-h-full"
        >
          {children}
        </motion.div>
      </main>
      <ProfileModal />
    </div>
  )
}
