import * as React from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useAiProcess, useCreateItem, useListItems, getListItemsQueryKey } from "@workspace/api-client-react"
import { Mic, ArrowRight, Loader2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { ItemRenderer } from "@/components/home/ItemRenderer"

export default function HomePage() {
  const [text, setText] = React.useState("")
  const [isListening, setIsListening] = React.useState(false)
  
  const queryClient = useQueryClient()
  const aiProcess = useAiProcess()
  const createItem = useCreateItem()

  const { data: items = [], isLoading: itemsLoading } = useListItems({}, {
    query: {
      queryKey: getListItemsQueryKey({}),
    }
  })

  const inputRef = React.useRef<HTMLTextAreaElement>(null)

  const handleListen = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Speech recognition is not supported in your browser.")
      return
    }

    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US' 
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

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!text.trim() || aiProcess.isPending || createItem.isPending) return

    const submissionText = text
    setText("") // Optimistic clear

    try {
      // 1. Classify/Process text
      // We are supposed to call useAiProcess({ data: { text } })
      // then useCreateItem to save. Wait, looking at the schema, AIProcess response has type, title, structuredData, total.
      // But we just need to submit to createItem ? The schema says:
      // useAiProcess to classify, then useCreateItem({ data: { rawText: text } })
      // Ah, wait. The prompt says: "On submit: call useAiProcess({ data: { text } }) to classify, then useCreateItem({ data: { rawText: text } }) to save"
      // Wait, createItem input is { rawText: string }. The backend might actually do the processing or not, let's follow instructions literally.

      // Actually, if we just call createItem with rawText, does the backend do it?
      // "On submit: call useAiProcess({ data: { text } }) to classify, then useCreateItem({ data: { rawText: text } }) to save."
      // Since createItem only takes rawText, and the schema for createItem doesn't take structuredData, it means the API probably just processes it internally? Or maybe we just call both for the sake of the prompt requirements.
      // Actually, let's look at ItemInput in api.schemas.ts
      // ItemInput: { rawText: string }
      // So yes, we just call createItem({ data: { rawText: text } }) and it probably handles it, BUT the instructions said "call useAiProcess... then useCreateItem". I will call both just in case, but ignore aiProcess response if createItem doesn't need it.

      await aiProcess.mutateAsync({ data: { text: submissionText } })
      await createItem.mutateAsync({ data: { rawText: submissionText } })
      
      queryClient.invalidateQueries({ queryKey: getListItemsQueryKey({}) })
    } catch (err) {
      console.error(err)
      setText(submissionText) // Revert on error
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const isPending = aiProcess.isPending || createItem.isPending

  return (
    <div className="flex flex-col max-w-3xl mx-auto pt-24 pb-32 min-h-full">
      <div className="w-full relative shadow-sm border border-border bg-white transition-shadow focus-within:border-primary">
        <textarea
          ref={inputRef}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="What's on your mind? (e.g. Add milk to groceries, Track $400 auction for painting...)"
          className="w-full min-h-[120px] p-6 text-xl leading-relaxed resize-none outline-none bg-transparent placeholder:text-muted-foreground/40 font-serif"
          disabled={isPending}
        />
        <div className="absolute bottom-4 right-4 flex items-center gap-2">
          <button
            type="button"
            onClick={handleListen}
            className={`p-3 rounded-full transition-colors ${isListening ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}`}
            disabled={isPending}
          >
            <Mic className={`w-5 h-5 ${isListening ? 'animate-pulse' : ''}`} />
          </button>
          <button
            onClick={handleSubmit}
            disabled={!text.trim() || isPending}
            className={`p-3 rounded-full transition-all ${
              text.trim() && !isPending 
                ? 'bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer' 
                : 'bg-secondary text-muted-foreground cursor-not-allowed'
            }`}
          >
            {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <div className="mt-16 space-y-8">
        <AnimatePresence initial={false}>
          {items.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full"
            >
              <ItemRenderer item={item} />
            </motion.div>
          ))}
          {itemsLoading && (
            <div className="py-12 text-center text-muted-foreground font-serif animate-pulse">
              Loading recent thoughts...
            </div>
          )}
          {!itemsLoading && items.length === 0 && (
            <div className="py-24 text-center">
              <p className="text-muted-foreground font-serif text-xl">The workspace is empty.</p>
              <p className="text-muted-foreground/60 text-sm mt-2 uppercase tracking-widest">AWAITING INPUT</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
