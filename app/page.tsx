import { DashboardHeader } from "@/components/dashboard-header"
import { VoiceCloning } from "@/components/voice-cloning"

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95 text-foreground">
      <DashboardHeader />
      <main className="container mx-auto px-4 py-6">
        <VoiceCloning />
      </main>
    </div>
  )
}
