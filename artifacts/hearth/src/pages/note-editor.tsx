import * as React from "react"
import { useParams, useLocation } from "wouter"
import { useGetNote, useCreateNote, useUpdateNote, useDeleteNote, useSyncNoteToNotion, getGetNoteQueryKey, getListNotesQueryKey } from "@workspace/api-client-react"
import { useQueryClient } from "@tanstack/react-query"
import { Loader2, ArrowLeft, Trash2, Cloud, Download } from "lucide-react"
import { Link } from "wouter"
import { useToast } from "@/components/ui/use-toast"

export default function NoteEditorPage() {
  const params = useParams()
  const isNew = !params.id || params.id === "new"
  const id = isNew ? "" : params.id!
  
  const [, setLocation] = useLocation()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: note, isLoading } = useGetNote(id, {
    query: {
      enabled: !isNew && !!id,
      queryKey: getGetNoteQueryKey(id)
    }
  })

  const createNote = useCreateNote()
  const updateNote = useUpdateNote()
  const deleteNote = useDeleteNote()
  const syncNotion = useSyncNoteToNotion()

  const [title, setTitle] = React.useState("")
  const [content, setContent] = React.useState("")

  const initializedForId = React.useRef<string | null>(null)
  const lastSaved = React.useRef({ title: "", content: "" })
  const saveTimeout = React.useRef<NodeJS.Timeout>()

  React.useEffect(() => {
    if (note && initializedForId.current !== note.id) {
      initializedForId.current = note.id
      setTitle(note.title)
      setContent(note.content)
      lastSaved.current = { title: note.title, content: note.content }
    }
  }, [note])

  const mutateFnRef = React.useRef(updateNote.mutate)
  mutateFnRef.current = updateNote.mutate

  const saveContent = React.useCallback((newTitle: string, newContent: string) => {
    if (isNew) return // Don't auto-save new uncreated notes until manual save

    if (newTitle !== lastSaved.current.title || newContent !== lastSaved.current.content) {
      mutateFnRef.current({ id, data: { title: newTitle, content: newContent } }, {
        onSuccess: (data) => {
          lastSaved.current = { title: data.title, content: data.content }
          queryClient.setQueryData(getGetNoteQueryKey(id), (old: any) => 
            old ? { ...old, title: data.title, content: data.content } : old
          )
        }
      })
    }
  }, [id, isNew, queryClient])

  // Debounced auto-save
  React.useEffect(() => {
    if (isNew) return
    clearTimeout(saveTimeout.current)
    saveTimeout.current = setTimeout(() => {
      saveContent(title, content)
    }, 1000)

    return () => clearTimeout(saveTimeout.current)
  }, [title, content, saveContent, isNew])

  const handleManualSave = () => {
    if (isNew) {
      createNote.mutate({ data: { title: title || "Untitled", content } }, {
        onSuccess: (data) => {
          queryClient.invalidateQueries({ queryKey: getListNotesQueryKey() })
          toast({ title: "Note created" })
          setLocation(`/notes/${data.id}`)
        }
      })
    } else {
      saveContent(title, content)
      toast({ title: "Note saved" })
    }
  }

  const handleDelete = () => {
    if (isNew) return setLocation("/notes")
    if (confirm("Delete this note entirely?")) {
      deleteNote.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListNotesQueryKey() })
          setLocation("/notes")
        }
      })
    }
  }

  const handleSyncNotion = () => {
    if (isNew) return toast({ title: "Save note first before syncing", variant: "destructive" })
    syncNotion.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Synced to Notion successfully" })
        queryClient.invalidateQueries({ queryKey: getGetNoteQueryKey(id) })
      },
      onError: (err: any) => {
        toast({ title: "Sync failed", description: err.error, variant: "destructive" })
      }
    })
  }

  const handleExportPDF = () => {
     toast({ title: "Exporting to PDF...", description: "This feature will be available shortly." })
  }

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
  }

  return (
    <div className="max-w-3xl mx-auto min-h-screen pb-32">
      <nav className="mb-12 flex items-center justify-between border-b border-border pb-6">
        <Link href="/notes" className="text-muted-foreground hover:text-foreground transition-colors flex items-center text-sm uppercase tracking-widest font-mono">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Notes
        </Link>
        <div className="flex items-center gap-4">
          {!isNew && note?.notionSynced && (
            <span className="px-3 py-1 bg-secondary text-foreground text-xs uppercase tracking-wider font-mono">Notion Synced</span>
          )}
          <button onClick={handleSyncNotion} className="p-2 text-muted-foreground hover:text-foreground transition-colors" title="Sync to Notion">
            <Cloud className="w-5 h-5" />
          </button>
          <button onClick={handleExportPDF} className="p-2 text-muted-foreground hover:text-foreground transition-colors" title="Export">
            <Download className="w-5 h-5" />
          </button>
          <button onClick={handleDelete} className="p-2 text-muted-foreground hover:text-destructive transition-colors" title="Delete Note">
            <Trash2 className="w-5 h-5" />
          </button>
          <button onClick={handleManualSave} disabled={createNote.isPending || updateNote.isPending} className="ml-4 px-6 py-2 bg-foreground text-background font-medium hover:bg-foreground/90 transition-colors">
            {createNote.isPending || updateNote.isPending ? "Saving..." : "Save"}
          </button>
        </div>
      </nav>

      <div className="space-y-8">
        <input 
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Note Title"
          className="w-full text-5xl md:text-6xl font-serif text-foreground bg-transparent outline-none placeholder:text-muted-foreground/30"
        />
        
        <textarea 
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Start typing..."
          className="w-full min-h-[60vh] text-lg md:text-xl font-sans leading-relaxed text-foreground bg-transparent outline-none resize-none placeholder:text-muted-foreground/40"
        />
      </div>
    </div>
  )
}
