import * as React from "react"
import { useListAuctionEntries, useListShippingCalculations, useListLinks, useCalculateShipping, useCreateLink, useDeleteAuctionEntry, useDeleteLink, useDeleteShippingCalculation, getListAuctionEntriesQueryKey, getListShippingCalculationsQueryKey, getListLinksQueryKey } from "@workspace/api-client-react"
import { useQueryClient } from "@tanstack/react-query"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Trash2, ExternalLink } from "lucide-react"

export default function BusinessPage() {
  return (
    <div className="max-w-6xl mx-auto pb-32">
      <header className="mb-16">
        <h1 className="text-4xl font-serif text-foreground mb-4">Business Tools</h1>
        <p className="text-muted-foreground tracking-widest uppercase text-sm">Operations & Tracking</p>
      </header>

      <Tabs defaultValue="auction" className="w-full">
        <TabsList className="w-full justify-start border-b border-border bg-transparent h-auto p-0 space-x-8 rounded-none">
          <TabsTrigger value="auction" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none py-4 text-base font-serif px-0">Auction Tracker</TabsTrigger>
          <TabsTrigger value="shipping" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none py-4 text-base font-serif px-0">Shipping Calculator</TabsTrigger>
          <TabsTrigger value="links" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none py-4 text-base font-serif px-0">Link Organizer</TabsTrigger>
        </TabsList>
        <div className="mt-12">
          <TabsContent value="auction">
            <AuctionSection />
          </TabsContent>
          <TabsContent value="shipping">
            <ShippingSection />
          </TabsContent>
          <TabsContent value="links">
            <LinksSection />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}

function AuctionSection() {
  const { data: entries = [], isLoading } = useListAuctionEntries({ query: { queryKey: getListAuctionEntriesQueryKey() } })
  const deleteEntry = useDeleteAuctionEntry()
  const queryClient = useQueryClient()

  const total = entries.reduce((sum, e) => sum + e.winningBid, 0)

  if (isLoading) return <div className="animate-pulse h-64 bg-secondary" />

  return (
    <div>
      <div className="flex justify-between items-end mb-8">
        <h2 className="text-2xl font-serif">Recent Sales</h2>
        <div className="text-right">
          <div className="text-sm text-muted-foreground uppercase tracking-wider mb-1">Total Value</div>
          <div className="text-4xl font-mono text-primary">${total.toLocaleString()}</div>
        </div>
      </div>

      <div className="w-full overflow-x-auto border border-border">
        <table className="w-full text-left font-mono text-sm border-collapse">
          <thead className="bg-secondary/50">
            <tr className="border-b border-border">
              <th className="p-4 font-normal text-muted-foreground">Item</th>
              <th className="p-4 font-normal text-muted-foreground">Buyer</th>
              <th className="p-4 font-normal text-muted-foreground">Date</th>
              <th className="p-4 font-normal text-muted-foreground text-right">Winning Bid</th>
              <th className="p-4 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-muted-foreground font-serif">No auction records found. Add them via Universal Input.</td></tr>
            ) : entries.map(entry => (
              <tr key={entry.id} className="border-b border-border/50 last:border-0 hover:bg-secondary/20 transition-colors">
                <td className="p-4">{entry.item}</td>
                <td className="p-4">{entry.buyer}</td>
                <td className="p-4">{new Date(entry.date).toLocaleDateString()}</td>
                <td className="p-4 text-right">${entry.winningBid.toLocaleString()}</td>
                <td className="p-4">
                  <button onClick={() => deleteEntry.mutate({ id: entry.id }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListAuctionEntriesQueryKey() })})} className="text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ShippingSection() {
  const queryClient = useQueryClient()
  const { data: history = [] } = useListShippingCalculations({ query: { queryKey: getListShippingCalculationsQueryKey() } })
  const calculate = useCalculateShipping()
  const deleteCalc = useDeleteShippingCalculation()

  const [origin, setOrigin] = React.useState("")
  const [destination, setDestination] = React.useState("")
  const [weight, setWeight] = React.useState("")

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault()
    calculate.mutate({ data: { origin, destination, weightKg: Number(weight) } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListShippingCalculationsQueryKey() })
        setOrigin(""); setDestination(""); setWeight("");
      }
    })
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
      <div>
        <h2 className="text-2xl font-serif mb-8 border-b border-border pb-4">New Estimate</h2>
        <form onSubmit={handleCalculate} className="space-y-6">
          <div className="space-y-2 border-b border-border pb-2">
            <Label className="sr-only" htmlFor="origin">Origin</Label>
            <Input id="origin" value={origin} onChange={e => setOrigin(e.target.value)} required placeholder="Origin (e.g. New York)" className="border-0 px-0 h-12 text-lg focus-visible:ring-0 placeholder:text-muted-foreground/50 rounded-none bg-transparent" />
          </div>
          <div className="space-y-2 border-b border-border pb-2">
            <Label className="sr-only" htmlFor="dest">Destination</Label>
            <Input id="dest" value={destination} onChange={e => setDestination(e.target.value)} required placeholder="Destination (e.g. London)" className="border-0 px-0 h-12 text-lg focus-visible:ring-0 placeholder:text-muted-foreground/50 rounded-none bg-transparent" />
          </div>
          <div className="space-y-2 border-b border-border pb-2">
            <Label className="sr-only" htmlFor="weight">Weight (kg)</Label>
            <Input id="weight" type="number" step="0.1" value={weight} onChange={e => setWeight(e.target.value)} required placeholder="Weight in kg" className="border-0 px-0 h-12 text-lg focus-visible:ring-0 placeholder:text-muted-foreground/50 rounded-none bg-transparent" />
          </div>
          <Button type="submit" disabled={calculate.isPending} className="w-full h-14 text-base tracking-wide bg-foreground text-background hover:bg-foreground/90 rounded-none mt-4">
            {calculate.isPending ? "Calculating..." : "Calculate Cost"}
          </Button>
        </form>
      </div>

      <div>
        <h2 className="text-2xl font-serif mb-8 border-b border-border pb-4">History</h2>
        <div className="space-y-4">
          {history.length === 0 ? (
             <p className="text-muted-foreground font-serif italic">No previous estimates.</p>
          ) : history.map(calc => (
            <div key={calc.id} className="p-6 border border-border flex justify-between items-center group hover:border-primary transition-colors">
              <div>
                <div className="font-mono text-sm text-muted-foreground mb-1">{calc.origin} → {calc.destination}</div>
                <div className="font-serif text-lg">{calc.weightKg} kg</div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-2xl font-mono text-foreground">${calc.estimatedCost}</div>
                <button onClick={() => deleteCalc.mutate({ id: calc.id }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListShippingCalculationsQueryKey() })})} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function LinksSection() {
  const queryClient = useQueryClient()
  const { data: links = [], isLoading } = useListLinks({ query: { queryKey: getListLinksQueryKey() } })
  const createLink = useCreateLink()
  const deleteLink = useDeleteLink()
  const [url, setUrl] = React.useState("")

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!url) return
    createLink.mutate({ data: { url } }, {
      onSuccess: () => {
        setUrl("")
        queryClient.invalidateQueries({ queryKey: getListLinksQueryKey() })
      }
    })
  }

  if (isLoading) return <div className="animate-pulse h-32 bg-secondary" />

  return (
    <div className="space-y-12">
      <form onSubmit={handleAdd} className="flex gap-4">
        <Input 
          value={url} 
          onChange={e => setUrl(e.target.value)} 
          placeholder="Paste an article or site URL..." 
          className="flex-1 h-14 border-border rounded-none text-lg px-4"
          required
          type="url"
        />
        <Button disabled={createLink.isPending} type="submit" className="h-14 px-8 rounded-none bg-foreground text-background">
          {createLink.isPending ? "Analyzing..." : "Save Link"}
        </Button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {links.length === 0 ? (
          <p className="text-muted-foreground font-serif italic col-span-2">No links saved yet.</p>
        ) : links.map(link => (
          <div key={link.id} className="p-8 border border-border hover:border-foreground transition-colors group flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-serif text-xl line-clamp-1 flex-1 pr-4">{link.label || link.url}</h3>
                <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                  <ExternalLink className="w-5 h-5" />
                </a>
              </div>
              <p className="text-foreground/80 font-sans leading-relaxed text-sm">{link.aiSummary}</p>
            </div>
            <div className="mt-8 flex justify-between items-center text-xs font-mono text-muted-foreground border-t border-border/50 pt-4">
              <span>{new Date(link.createdAt).toLocaleDateString()}</span>
              <button onClick={() => deleteLink.mutate({ id: link.id }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListLinksQueryKey() })})} className="opacity-0 group-hover:opacity-100 hover:text-destructive transition-all">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
