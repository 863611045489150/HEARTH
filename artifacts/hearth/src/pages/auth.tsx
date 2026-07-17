import * as React from "react"
import { useLocation } from "wouter"
import { useLogin, useRegister, useSendOtp, useVerifyOtp } from "@workspace/api-client-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { motion, AnimatePresence } from "framer-motion"
import { useToast } from "@/components/ui/use-toast"

type AuthMode = "phone" | "email"
type PhoneStep = "phone" | "otp"

const inputClass =
  "border-0 border-b border-border rounded-none px-0 h-12 text-lg focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/40 bg-transparent"

export default function AuthPage() {
  const [mode, setMode] = React.useState<AuthMode>("phone")
  const [phoneStep, setPhoneStep] = React.useState<PhoneStep>("phone")
  const [isLogin, setIsLogin] = React.useState(true)

  // Phone fields
  const [phone, setPhone] = React.useState("")
  const [otp, setOtp] = React.useState("")

  // Email fields
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")

  const [, setLocation] = useLocation()
  const { toast } = useToast()

  const sendOtp = useSendOtp()
  const verifyOtp = useVerifyOtp()
  const login = useLogin()
  const register = useRegister()

  // ─── Phone flow ───────────────────────────────────────────────
  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault()
    const normalized = phone.startsWith("+") ? phone : `+${phone}`
    sendOtp.mutate(
      { data: { phone: normalized } },
      {
        onSuccess: () => {
          setPhoneStep("otp")
          toast({ title: "Code sent", description: `OTP sent to ${normalized}` })
        },
        onError: (err: any) => {
          toast({
            title: "Could not send OTP",
            description: err?.data?.error ?? "Check the number and try again",
            variant: "destructive",
          })
        },
      }
    )
  }

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault()
    const normalized = phone.startsWith("+") ? phone : `+${phone}`
    verifyOtp.mutate(
      { data: { phone: normalized, token: otp } },
      {
        onSuccess: (res: any) => {
          localStorage.setItem("hearth_token", res.token)
          setLocation("/")
        },
        onError: (err: any) => {
          toast({
            title: "Invalid code",
            description: err?.data?.error ?? "The code is wrong or expired",
            variant: "destructive",
          })
        },
      }
    )
  }

  // ─── Email flow ───────────────────────────────────────────────
  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const payload = { data: { email, password } }
    const onSuccess = (res: any) => {
      localStorage.setItem("hearth_token", res.token)
      setLocation("/")
    }
    const onError = (err: any) => {
      toast({
        title: "Authentication failed",
        description: err?.data?.error ?? "An error occurred",
        variant: "destructive",
      })
    }
    if (isLogin) {
      login.mutate(payload, { onSuccess, onError })
    } else {
      register.mutate(payload, { onSuccess, onError })
    }
  }

  const isPending =
    sendOtp.isPending ||
    verifyOtp.isPending ||
    login.isPending ||
    register.isPending

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-sm px-6 py-10"
      >
        {/* Header */}
        <div className="text-center mb-14">
          <h1 className="font-serif text-4xl text-foreground mb-3">Welcome to Hearth</h1>
          <p className="text-muted-foreground text-xs tracking-widest uppercase">
            Your Family AI Workspace
          </p>
        </div>

        <AnimatePresence mode="wait">
          {/* ── PHONE MODE ── */}
          {mode === "phone" && (
            <motion.div
              key="phone"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.15 }}
            >
              <AnimatePresence mode="wait">
                {/* Step 1 — enter phone */}
                {phoneStep === "phone" && (
                  <motion.form
                    key="enter-phone"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    onSubmit={handleSendOtp}
                    className="space-y-10"
                  >
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground tracking-wide uppercase">
                        Phone Number
                      </Label>
                      <Input
                        type="tel"
                        placeholder="+91 98765 43210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className={inputClass}
                        autoComplete="tel"
                        required
                        autoFocus
                      />
                      <p className="text-xs text-muted-foreground/60 pt-1">
                        Include country code, e.g. +91 for India
                      </p>
                    </div>

                    <div className="flex flex-col gap-4">
                      <Button
                        type="submit"
                        disabled={isPending || phone.length < 7}
                        className="w-full h-13 text-sm tracking-wide bg-foreground text-background hover:bg-foreground/90 rounded-none"
                        style={{ height: "52px" }}
                      >
                        {sendOtp.isPending ? "Sending…" : "Send Code"}
                      </Button>

                      <button
                        type="button"
                        onClick={() => setMode("email")}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors tracking-wide"
                      >
                        Use email instead
                      </button>
                    </div>
                  </motion.form>
                )}

                {/* Step 2 — enter OTP */}
                {phoneStep === "otp" && (
                  <motion.form
                    key="enter-otp"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    onSubmit={handleVerifyOtp}
                    className="space-y-10"
                  >
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground tracking-wide uppercase">
                        Verification Code
                      </Label>
                      <Input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={6}
                        placeholder="6-digit code"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                        className={`${inputClass} tracking-[0.4em] text-center text-xl`}
                        autoComplete="one-time-code"
                        required
                        autoFocus
                      />
                      <p className="text-xs text-muted-foreground/60 pt-1">
                        Sent to {phone.startsWith("+") ? phone : `+${phone}`}
                      </p>
                    </div>

                    <div className="flex flex-col gap-4">
                      <Button
                        type="submit"
                        disabled={isPending || otp.length !== 6}
                        className="w-full text-sm tracking-wide bg-foreground text-background hover:bg-foreground/90 rounded-none"
                        style={{ height: "52px" }}
                      >
                        {verifyOtp.isPending ? "Verifying…" : "Verify & Sign In"}
                      </Button>

                      <button
                        type="button"
                        onClick={() => {
                          setPhoneStep("phone")
                          setOtp("")
                        }}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Change number or resend
                      </button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* ── EMAIL MODE ── */}
          {mode === "email" && (
            <motion.div
              key="email"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.15 }}
            >
              <form onSubmit={handleEmailSubmit} className="space-y-10">
                <div className="space-y-6">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground tracking-wide uppercase">
                      Email
                    </Label>
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={inputClass}
                      autoComplete="email"
                      required
                      autoFocus
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground tracking-wide uppercase">
                      Password
                    </Label>
                    <Input
                      type="password"
                      placeholder="Min. 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={inputClass}
                      autoComplete={isLogin ? "current-password" : "new-password"}
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <Button
                    type="submit"
                    disabled={isPending}
                    className="w-full text-sm tracking-wide bg-foreground text-background hover:bg-foreground/90 rounded-none"
                    style={{ height: "52px" }}
                  >
                    {isPending
                      ? "Please wait…"
                      : isLogin
                      ? "Sign In"
                      : "Create Account"}
                  </Button>

                  <div className="flex flex-col gap-2 items-center">
                    <button
                      type="button"
                      onClick={() => setIsLogin(!isLogin)}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {isLogin
                        ? "Need an account? Register"
                        : "Already have an account? Sign in"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMode("phone")
                        setPhoneStep("phone")
                      }}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Use phone number instead
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Accent dot mark */}
        <div className="mt-16 flex justify-center">
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#FF6B35" }} />
        </div>
      </motion.div>
    </div>
  )
}
