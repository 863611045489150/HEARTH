import * as React from "react"
import { useLocation } from "wouter"
import { useLogin, useRegister } from "@workspace/api-client-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { motion } from "framer-motion"
import { useToast } from "@/components/ui/use-toast"

export default function AuthPage() {
  const [isLogin, setIsLogin] = React.useState(true)
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [, setLocation] = useLocation()
  const { toast } = useToast()

  const login = useLogin()
  const register = useRegister()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const payload = { data: { email, password } }
    
    const onSuccess = (res: any) => {
      localStorage.setItem("hearth_token", res.token)
      setLocation("/")
    }

    const onError = (err: any) => {
      toast({
        title: "Authentication failed",
        description: err.error || "An error occurred",
        variant: "destructive"
      })
    }

    if (isLogin) {
      login.mutate(payload, { onSuccess, onError })
    } else {
      register.mutate(payload, { onSuccess, onError })
    }
  }

  const isPending = login.isPending || register.isPending

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm p-8"
      >
        <div className="text-center mb-12">
          <h1 className="text-4xl font-serif text-foreground mb-4">Welcome to Hearth</h1>
          <p className="text-muted-foreground text-sm tracking-wide uppercase">YOUR FAMILY AI WORKSPACE</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-6">
            <div className="space-y-2 border-b border-border pb-2">
              <Label className="sr-only" htmlFor="email">Email</Label>
              <Input 
                id="email"
                type="email" 
                placeholder="Email address" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="border-0 px-0 h-12 text-lg focus-visible:ring-0 placeholder:text-muted-foreground/50 rounded-none bg-transparent"
                required
              />
            </div>
            <div className="space-y-2 border-b border-border pb-2">
              <Label className="sr-only" htmlFor="password">Password</Label>
              <Input 
                id="password"
                type="password" 
                placeholder="Password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="border-0 px-0 h-12 text-lg focus-visible:ring-0 placeholder:text-muted-foreground/50 rounded-none bg-transparent"
                required
                minLength={6}
              />
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <Button 
              type="submit" 
              className="w-full h-14 text-base tracking-wide bg-foreground text-background hover:bg-foreground/90 rounded-none"
              disabled={isPending}
            >
              {isPending ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
            </Button>
            
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {isLogin ? "Need an account? Register" : "Already have an account? Sign in"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
