import { ArrowLeft, Compass } from "lucide-react"
import { Link } from "react-router"
import { buttonVariants } from "@/components/ui/button"

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <title>Page not found · STW Alerts</title>
      <meta name="robots" content="noindex" />
      <Compass className="mb-6 size-12 text-primary" aria-hidden="true" />
      <p className="text-xs font-semibold tracking-widest text-primary">
        ERROR 404
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
        This mission isn't on the map.
      </h1>
      <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
        The page you're looking for doesn't exist. Return to the alerts to find
        available missions.
      </p>
      <Link
        to="/"
        className={buttonVariants({ className: "mt-7", variant: "outline" })}
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to alerts
      </Link>
    </div>
  )
}
