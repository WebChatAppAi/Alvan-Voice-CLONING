import { Mic2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { SettingsDialog } from "./settings-dialog"

export function DashboardHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center px-4">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-primary/10 p-1.5">
            <Mic2 className="h-5 w-5 text-primary" />
          </div>
          <span className="text-xl font-bold">
            Alvan <span className="text-primary">Voice Cloning</span>
          </span>
          <Badge variant="outline" className="ml-2 hidden sm:flex">
            Beta
          </Badge>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <SettingsDialog />
        </div>
      </div>
    </header>
  )
}
