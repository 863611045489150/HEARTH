import * as React from "react"
import { useListNotes, getListNotesQueryKey } from "@workspace/api-client-react"
import { Link } from "wouter"
import { Search, Plus } from "lucide-react"

export default function NotesPage() {
  const [search, setSearch] = React.useState("")
  const { data: notes = [], isLoading } = useListNotes({ search }, {
    query: {
      queryKey: getListNotesQueryKey({ search })
    }
  })

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-32">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-4xl font-serif text-foreground mb-4">Notes</h1>
          <p className="text-muted-foreground tracking-widest uppercase text-sm">Document Thoughts</p>
        </div>
        <Link href="/notes/new" className="h-12 px-6 flex items-center justify-center bg-foreground text-background hover:bg-foreground/90 transition-colors font-medium">
          <Plus className="w-4 h-4 mr-2" />
          New Note
        </Link>
      </header>

      <div className="relative border-b border-border pb-4 focus-within:border-primary transition-colors">
        <Search className="absolute left-0 top-1 w-6 h-6 text-muted-foreground" />
        <input 
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search notes..."
          className="w-full pl-10 text-xl font-serif bg-transparent outline-none placeholder:text-muted-foreground/40"
        />
      </div>

      <div className="flex flex-col">
        {isLoading && (
          <div className="py-8 animate-pulse space-y-4">
            {[1,2,3].map(i => <div key={i} className="h-16 bg-muted border border-border" />)}
          </div>
        )}
        {!isLoading && notes.map(note => (
          <Link key={note.id} href={`/notes/${note.id}`} className="group block py-6 border-b border-border/40 hover:border-foreground transition-colors">
            <div className="flex justify-between items-baseline">
              <h2 className="text-2xl font-serif text-foreground group-hover:text-primary transition-colors">{note.title || 'Untitled Note'}</h2>
              <div className="text-sm font-mono text-muted-foreground flex items-center gap-4">
                {note.notionSynced && (
                  <span className="px-2 py-1 bg-secondary text-foreground text-xs uppercase tracking-wider">Notion</span>
                )}
                {new Date(note.updatedAt).toLocaleDateString()}
              </div>
            </div>
          </Link>
        ))}
        {!isLoading && notes.length === 0 && (
          <div className="py-24 text-center">
             <p className="text-muted-foreground font-serif text-xl">No notes found.</p>
          </div>
        )}
      </div>
    </div>
  )
}
