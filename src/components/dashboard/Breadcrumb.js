import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

export default function Breadcrumb({ title, subtitle, crumbs = [] }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 py-5 bg-background/50 backdrop-blur-md border-b border-border -mx-4 sm:-mx-6 lg:-mx-8 -mt-4 sm:-mt-6 lg:-mt-8 mb-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        {subtitle && (
          <p className="text-muted-foreground text-sm mt-1">{subtitle}</p>
        )}
      </div>
      <nav className="flex items-center space-x-1 text-sm text-muted-foreground">
        <Link href="/dashboard" className="flex items-center hover:text-foreground transition-colors">
          <Home className="w-4 h-4 mr-1" />
          Home
        </Link>
        {crumbs.map((c, i) => (
          <div key={i} className="flex items-center space-x-1">
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
            {c.href ? (
              <Link href={c.href} className="hover:text-foreground transition-colors">
                {c.label}
              </Link>
            ) : (
              <span className="text-foreground font-medium">{c.label}</span>
            )}
          </div>
        ))}
      </nav>
    </div>
  );
}
