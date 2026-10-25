import { useEffect, useRef } from "react"
import { ArrowUpRight, Crosshair, History, Radar, Zap } from "lucide-react"
import { Link, NavLink, Outlet, useLocation } from "react-router"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "./theme-toggle"

const navigation = [
  { to: "/", label: "Alertas", icon: Radar },
  { to: "/history", label: "Historial", icon: History },
]

export function AppLayout() {
  const { pathname } = useLocation()
  const previousPath = useRef(pathname)
  const mainRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (previousPath.current !== pathname) {
      window.scrollTo({ top: 0, behavior: "instant" })
      mainRef.current?.focus({ preventScroll: true })
      previousPath.current = pathname
    }
  }, [pathname])

  return (
    <div className="flex min-h-svh flex-col">
      <a
        href="#main-content"
        className="sr-only z-50 rounded-md bg-primary px-4 py-3 text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Saltar al contenido
      </a>
      <header className="border-b bg-background/95">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-8 lg:px-12">
          <Link
            to="/"
            className="flex items-center gap-2.5"
            aria-label="STW Alerts, inicio"
          >
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Zap className="size-5 fill-current" aria-hidden="true" />
            </span>
            <span className="text-lg font-bold tracking-tight">
              stw<span className="font-normal text-muted-foreground">/</span>
              alerts<span className="text-primary">.</span>
            </span>
          </Link>
          <nav
            aria-label="Navegación principal"
            className="order-3 flex w-full gap-1 rounded-lg bg-muted/70 p-1 sm:order-0 sm:w-auto"
          >
            {navigation.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/"}
                className={({ isActive }) =>
                  cn(
                    "flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                    isActive && "bg-background text-foreground shadow-xs"
                  )
                }
              >
                <Icon className="size-4" aria-hidden="true" />
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-1.5 text-xs text-muted-foreground md:flex">
              <Crosshair className="size-3.5" aria-hidden="true" />
              Save the World
            </span>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main
        id="main-content"
        ref={mainRef}
        tabIndex={-1}
        className="mx-auto w-full max-w-7xl flex-1 px-5 py-10 outline-none sm:px-8 sm:py-12 lg:px-12"
      >
        <Outlet />
      </main>

      <footer className="mt-8 border-t">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 px-5 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:px-8 lg:px-12">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="font-semibold text-foreground">stw/alerts.</span>
            <span>
              Un proyecto de Marcos Silva · {new Date().getFullYear()}
            </span>
          </div>
          <a
            href="https://www.fortnite.com/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 hover:text-foreground"
          >
            Proyecto independiente de Fortnite
            <ArrowUpRight className="size-3" aria-hidden="true" />
          </a>
        </div>
      </footer>
    </div>
  )
}
