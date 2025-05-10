"use client"

import { useState } from "react"
import { FileAudio, Download } from "lucide-react"
import { Button } from "@/components/ui/button"

const audioExamples = [
  {
    id: "male-voice",
    name: "Male Voice Sample",
    description: "Clear male voice with minimal background noise",
    duration: "0:32",
  },
  {
    id: "female-voice",
    name: "Female Voice Sample",
    description: "Professional female voice recording",
    duration: "0:28",
  },
  {
    id: "child-voice",
    name: "Child Voice Sample",
    description: "Child reading a short story",
    duration: "0:45",
  },
]

export function AudioExamples() {
  const [selectedExample, setSelectedExample] = useState<string | null>(null)

  const handleSelectExample = (id: string) => {
    setSelectedExample(id === selectedExample ? null : id)
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {audioExamples.map((example) => (
        <div
          key={example.id}
          className={`relative flex cursor-pointer flex-col rounded-lg border p-4 transition-all hover:border-primary/50 hover:bg-muted/50 ${
            selectedExample === example.id ? "border-primary bg-primary/5" : "border-border"
          }`}
          onClick={() => handleSelectExample(example.id)}
        >
          <div className="mb-2 flex items-center gap-3">
            <div className="rounded-full bg-primary/20 p-2">
              <FileAudio className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h4 className="font-medium">{example.name}</h4>
              <p className="text-xs text-muted-foreground">{example.duration}</p>
            </div>
          </div>
          <p className="mb-4 text-sm text-muted-foreground">{example.description}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-auto flex w-full items-center gap-2"
            onClick={(e) => {
              e.stopPropagation()
              // In a real app, this would download the sample file
            }}
          >
            <Download className="h-4 w-4" />
            <span>Use This Sample</span>
          </Button>
        </div>
      ))}
    </div>
  )
}
