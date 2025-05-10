"use client"

import { useState } from "react"
import { AudioWaveform } from "./audio-waveform"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeftRight, FileAudio, Wand2 } from "lucide-react"
import { GlowingEffect } from "@/components/ui/glowing-effect"

interface AudioComparisonProps {
  originalFile: File
  convertedAudioUrl: string
}

export function AudioComparison({ originalFile, convertedAudioUrl }: AudioComparisonProps) {
  const [activeTab, setActiveTab] = useState<string>("comparison")

  return (
    <div className="space-y-4 rounded-lg border bg-card/50 p-4 relative overflow-hidden">
      <GlowingEffect spread={35} glow={true} disabled={false} proximity={60} inactiveZone={0.01} borderWidth={2} />
      <div className="flex items-center gap-2 border-b pb-4">
        <Wand2 className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-medium">Voice Cloning Results</h3>
      </div>

      <Tabs defaultValue="comparison" onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="comparison">
            <ArrowLeftRight className="mr-2 h-4 w-4" />
            Comparison
          </TabsTrigger>
          <TabsTrigger value="original">
            <FileAudio className="mr-2 h-4 w-4" />
            Original
          </TabsTrigger>
          <TabsTrigger value="converted">
            <Wand2 className="mr-2 h-4 w-4" />
            Converted
          </TabsTrigger>
        </TabsList>

        <TabsContent value="comparison" className="mt-4">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FileAudio className="h-4 w-4 text-muted-foreground" />
                <h4 className="text-sm font-medium">Original Audio</h4>
              </div>
              <AudioWaveform file={originalFile} compact />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Wand2 className="h-4 w-4 text-primary" />
                <h4 className="text-sm font-medium">Converted Audio</h4>
              </div>
              <AudioWaveform audioUrl={convertedAudioUrl} compact />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="original" className="mt-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <FileAudio className="h-4 w-4 text-muted-foreground" />
              <h4 className="font-medium">Original Audio</h4>
            </div>
            <AudioWaveform file={originalFile} />
          </div>
        </TabsContent>

        <TabsContent value="converted" className="mt-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Wand2 className="h-4 w-4 text-primary" />
              <h4 className="font-medium">Converted Audio</h4>
            </div>
            <AudioWaveform audioUrl={convertedAudioUrl} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
