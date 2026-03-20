"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mic2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/layout/theme-toggle";

const nav = [
  { href: "/", label: "Dashboard" },
  { href: "/calls", label: "All calls" },
  { href: "/calls/new", label: "Upload call" },
];

export function AppHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-indigo-100/80 bg-background/70 backdrop-blur-xl dark:border-indigo-400/20">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold tracking-tight text-foreground transition-all duration-200 ease-in-out hover:scale-[1.01]"
        >
          <span className="flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-500 text-white shadow-md shadow-indigo-500/30">
            <Mic2 className="size-4" aria-hidden />
          </span>
          <span className="hidden sm:inline">Call Intelligence</span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2" aria-label="Main">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "rounded-xl border px-3",
                pathname === item.href
                  ? "border-indigo-500 bg-indigo-50 text-indigo-600"
                  : "border-transparent text-muted-foreground hover:bg-gray-100 hover:shadow-md hover:text-foreground",
              )}
            >
              {item.label}
            </Link>
          ))}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
