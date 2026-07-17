import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useCreateProfile, useGetProfile, useGetMe, getGetProfileQueryKey } from "@workspace/api-client-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Mic } from "lucide-react"

export function ProfileModal() {
  const { data: user } = useGetMe()
  const { data: profile, isLoading: isProfileLoading, refetch } = useGetProfile({
    query: {
      enabled: !!user?.id,
      retry: false, // Don't keep retrying if 404
      queryKey: getGetProfileQueryKey(),
    }
  })
  const createProfile = useCreateProfile()
  
  const [isOpen, setIsOpen] = React.useState(false)
  const [text, setText] = React.useState("")
  const [isListening, setIsListening] = React.useState(false)

  React.useEffect(() => {
    if (!isProfileLoading && !profile && user) {
      setIsOpen(true)
    } else {
      setIsOpen(false)
    }
  }, [profile, isProfileLoading, user])

  const handleListen = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Speech recognition is not supported in your browser.")
      return
    }

    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US' // Can also set 'hi-IN' if needed
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onstart = () => setIsListening(true)
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      setText(prev => (prev ? prev + " " + transcript : transcript))
    }
    recognition.onerror = () => setIsListening(false)
    recognition.onend = () => setIsListening(false)

    recognition.start()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return

    createProfile.mutate({ data: { rawText: text } }, {
      onSuccess: () => {
        setIsOpen(false)
        refetch()
      }
    })
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="w-full max-w-lg bg-white p-12 border border-border shadow-2xl relative"
        >
          <h2 className="text-3xl font-serif mb-6 text-foreground">Tell Hearth about yourself</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <Textarea 
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="I run a small bakery and track auctions..."
                className="min-h-[160px] text-lg leading-relaxed p-4 border-b border-l-0 border-r-0 border-t-0 border-border focus-visible:ring-0 focus-visible:border-primary resize-none"
              />
              <Button 
                type="button" 
                variant="ghost" 
                size="icon" 
                className={cn("absolute bottom-2 right-2 text-muted-foreground", isListening && "text-primary animate-pulse")}
                onClick={handleListen}
              >
                <Mic className="w-5 h-5" />
              </Button>
            </div>
            
            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={!text.trim() || createProfile.isPending}
                className="min-w-32 bg-foreground text-background hover:bg-foreground/90"
              >
                {createProfile.isPending ? "Saving..." : "Save Profile"}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ")
}
