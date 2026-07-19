import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background text-foreground font-serif">
      <h1 className="text-6xl font-bold mb-4">404</h1>
      <p className="text-2xl text-muted-foreground mb-8">Page not found</p>
      <Link href="/" className="text-primary hover:underline font-sans uppercase tracking-widest text-sm">
        Return Home
      </Link>
    </div>
  );
}
