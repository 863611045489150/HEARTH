import * as React from "react"
import { Link, useLocation } from "wouter"
import { Home, List, NotebookPen, Briefcase, Plus, Mic, ArrowRight } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { useGetMe, useGetProfile, getGetProfileQueryKey } from "@workspace/api-client-react"

export function Sidebar() {
  const [location] = useLocation()
  const [isExpanded, setIsExpanded] = React.useState(false)
  const { data: user } = useGetMe()
  const { data: profile, isLoading: isProfileLoading } = useGetProfile({
    query: {
      enabled: !!user?.id,
      queryKey: getGetProfileQueryKey(),
    }
  })

  // We actually need to use the Orval generated query keys.
  // Wait, let's use the explicit import from api-client-react if needed, or just let TanStack handle it.
  
  if (!user) return null

  const navItems = [
    { href: "/", icon: Home, label: "Input" },
    { href: "/dashboard", icon: List, label: "Dashboard" },
    { href: "/notes", icon: NotebookPen, label: "Notes" },
    { href: "/business", icon: Briefcase, label: "Business" },
  ]

  const hasProfile = !!profile
  const showProfileDot = !isProfileLoading && !hasProfile

  return (
    <motion.div 
      className={cn(
        "fixed left-0 top-0 bottom-0 z-40 flex flex-col bg-white border-r border-border transition-all duration-200 ease-in-out py-6",
        isExpanded ? "w-64" : "w-16"
      )}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <div className="flex-1 flex flex-col px-3 gap-2">
        {navItems.map((item) => {
          const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href))
          return (
            <Link key={item.href} href={item.href} className={cn(
              "flex items-center gap-4 h-10 px-2 group transition-colors",
              isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}>
              <item.icon className="w-5 h-5 shrink-0" />
              <AnimatePresence>
                {isExpanded && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className="whitespace-nowrap text-sm font-medium"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          )
        })}
      </div>
      
      <div className="px-3 pb-4 relative">
        <div className="flex items-center gap-4 h-10 px-2 relative">
          <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-xs font-mono shrink-0">
            {user.email.charAt(0).toUpperCase()}
          </div>
          {showProfileDot && (
             <span className="absolute left-[26px] top-2 w-2 h-2 rounded-full bg-primary animate-pulse" />
          )}
          {!showProfileDot && hasProfile && (
             <span className="absolute left-[26px] top-2 w-2 h-2 rounded-full bg-primary" />
          )}
          <AnimatePresence>
            {isExpanded && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="whitespace-nowrap text-sm font-medium text-muted-foreground truncate flex-1"
              >
                {user.email}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}
