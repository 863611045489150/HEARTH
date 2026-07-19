import * as React from "react"
import { useGetDashboard, getGetDashboardQueryKey } from "@workspace/api-client-react"
import { Activity, FileText, LayoutList, DollarSign } from "lucide-react"

export default function DashboardPage() {
  const { data: dashboard, isLoading } = useGetDashboard({
    query: {
      queryKey: getGetDashboardQueryKey()
    }
  })

  if (isLoading) {
    return (
      <div className="space-y-16 animate-pulse">
        <div className="h-10 w-48 bg-muted" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {[1,2,3,4].map(i => <div key={i} className="h-32 bg-muted border border-border" />)}
        </div>
      </div>
    )
  }

  if (!dashboard) return null

  // Calculate max count for simple horizontal bars
  const maxCount = Math.max(...dashboard.itemsByType.map(i => i.count), 1)

  return (
    <div className="space-y-24">
      <header>
        <h1 className="text-4xl font-serif text-foreground mb-4">Workspace Overview</h1>
        <p className="text-muted-foreground tracking-widest uppercase text-sm">Status & Activity</p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="p-8 border border-border flex flex-col gap-4">
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-foreground">
            <FileText className="w-5 h-5" />
          </div>
          <div className="text-4xl font-mono">{dashboard.totalNotes}</div>
          <div className="text-sm text-muted-foreground uppercase tracking-widest">Total Notes</div>
        </div>
        <div className="p-8 border border-border flex flex-col gap-4">
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-foreground">
            <LayoutList className="w-5 h-5" />
          </div>
          <div className="text-4xl font-mono">{dashboard.totalItems}</div>
          <div className="text-sm text-muted-foreground uppercase tracking-widest">Total Items</div>
        </div>
        <div className="p-8 border border-border flex flex-col gap-4">
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-primary">
            <DollarSign className="w-5 h-5" />
          </div>
          <div className="text-4xl font-mono text-primary">${dashboard.auctionTotal?.toLocaleString() || '0'}</div>
          <div className="text-sm text-muted-foreground uppercase tracking-widest">Auction Value</div>
        </div>
        <div className="p-8 border border-border flex flex-col gap-4">
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-foreground">
            <Activity className="w-5 h-5" />
          </div>
          <div className="text-4xl font-mono">{dashboard.recentItems.length + dashboard.recentNotes.length}</div>
          <div className="text-sm text-muted-foreground uppercase tracking-widest">Recent Actions</div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        <section>
          <h2 className="text-2xl font-serif mb-8 pb-4 border-b border-border">Data Distribution</h2>
          <div className="space-y-6">
            {dashboard.itemsByType.map(type => (
              <div key={type.type} className="flex flex-col gap-2">
                <div className="flex justify-between text-sm font-mono uppercase">
                  <span>{type.type.replace('_', ' ')}</span>
                  <span>{type.count}</span>
                </div>
                <div className="w-full h-2 bg-secondary">
                  <div 
                    className="h-full bg-foreground transition-all duration-1000"
                    style={{ width: `${(type.count / maxCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            {dashboard.itemsByType.length === 0 && (
              <p className="text-muted-foreground italic font-serif">No structured items yet.</p>
            )}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-serif mb-8 pb-4 border-b border-border">Recent Activity</h2>
          <div className="space-y-4">
            {[...dashboard.recentNotes.map(n => ({ ...n, _kind: 'note' })), ...dashboard.recentItems.map(i => ({ ...i, _kind: i.type }))]
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .slice(0, 5)
              .map((activity, i) => (
                <div key={`${activity.id}-${i}`} className="flex justify-between items-center py-4 border-b border-border/40 last:border-0">
                  <div>
                    <div className="font-serif text-lg">{activity.title || 'Untitled'}</div>
                    <div className="text-xs text-muted-foreground font-mono mt-1 uppercase">
                      {activity._kind.replace('_', ' ')}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">
                    {new Date(activity.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
              {(dashboard.recentNotes.length === 0 && dashboard.recentItems.length === 0) && (
                <p className="text-muted-foreground italic font-serif">Workspace is quiet.</p>
              )}
          </div>
        </section>
      </div>
    </div>
  )
}
