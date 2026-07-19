import * as React from "react"
import { type Item } from "@workspace/api-client-react"
import { Badge } from "@/components/ui/badge"

export function ItemRenderer({ item }: { item: Item }) {
  const renderContent = () => {
    switch (item.type) {
      case "list": {
        const items = item.structuredData?.items as string[] || []
        return (
          <ul className="list-none space-y-3 mt-4">
            {items.map((li, i) => (
              <li key={i} className="flex gap-4 items-start text-foreground/80">
                <span className="text-primary mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                <span className="leading-relaxed">{li}</span>
              </li>
            ))}
          </ul>
        )
      }
      case "table": {
        const rows = item.structuredData?.rows as Record<string, any>[] || []
        if (rows.length === 0) return <p className="text-muted-foreground mt-4">No data</p>
        
        const cols = Object.keys(rows[0])
        return (
          <div className="mt-6 w-full overflow-x-auto">
            <table className="w-full text-left font-mono text-sm border-collapse">
              <thead>
                <tr className="border-b border-border">
                  {cols.map(c => (
                    <th key={c} className="pb-3 pr-4 font-normal text-muted-foreground capitalize">{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-b border-border/50 last:border-0">
                    {cols.map(c => (
                      <td key={c} className="py-3 pr-4">{String(r[c] || '')}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
              {item.total !== null && item.total !== undefined && (
                <tfoot>
                  <tr className="border-t border-foreground text-foreground font-medium">
                    <td colSpan={cols.length - 1} className="py-4 pr-4">Total</td>
                    <td className="py-4 pr-4">{item.total}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )
      }
      case "calculation": {
        return (
          <div className="mt-8 mb-4 flex justify-center items-center">
            <div className="text-6xl font-mono tracking-tight text-foreground">
              {item.total !== null ? item.total : item.structuredData?.result}
            </div>
          </div>
        )
      }
      case "business_record": {
        const data = item.structuredData || {}
        return (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            {Object.entries(data).map(([k, v]) => (
              <div key={k} className="flex flex-col gap-1 border-b border-border/40 pb-2">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">{k.replace(/_/g, ' ')}</span>
                <span className="font-mono text-foreground">{String(v)}</span>
              </div>
            ))}
          </div>
        )
      }
      case "note":
      default: {
        return (
          <div className="mt-4 text-foreground/80 leading-relaxed whitespace-pre-wrap font-sans">
            {item.rawText}
          </div>
        )
      }
    }
  }

  return (
    <div className="w-full bg-white border border-border p-8 hover:border-border/80 transition-colors">
      <div className="flex items-center justify-between gap-4">
        <h3 className="font-serif text-2xl text-foreground">{item.title || "Untitled"}</h3>
        <Badge variant="outline" className="font-mono text-xs uppercase tracking-wider text-muted-foreground rounded-none border-muted-foreground/20">
          {item.type.replace('_', ' ')}
        </Badge>
      </div>
      {renderContent()}
      <div className="mt-8 pt-4 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground font-mono">
        <span>{new Date(item.createdAt).toLocaleDateString()}</span>
      </div>
    </div>
  )
}
