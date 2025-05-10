"use client"

import { useState, useEffect } from "react"
import { CheckCircle2, Clock, Loader2 } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { motion, AnimatePresence } from "framer-motion"

type ProcessStage = {
  name: string
  description: string
  color: string
  progressStart: number
  progressEnd: number
}

const processStages: ProcessStage[] = [
  {
    name: "Extracting Features",
    description: "Analyzing audio characteristics and extracting features",
    color: "from-purple-500 to-violet-600",
    progressStart: 0,
    progressEnd: 20,
  },
  {
    name: "Processing Pitch (F0)",
    description: "Extracting and processing pitch information using selected method",
    color: "from-cyan-500 to-blue-600",
    progressStart: 20,
    progressEnd: 40,
  },
  {
    name: "Applying RVC Model",
    description: "Converting voice using the selected RVC model",
    color: "from-emerald-500 to-green-600",
    progressStart: 40,
    progressEnd: 70,
  },
  {
    name: "Feature Matching",
    description: "Matching voice features with index database",
    color: "from-amber-500 to-orange-600",
    progressStart: 70,
    progressEnd: 90,
  },
  {
    name: "Finalizing Audio",
    description: "Applying final adjustments and generating output",
    color: "from-rose-500 to-pink-600",
    progressStart: 90,
    progressEnd: 100,
  },
]

interface ProcessingSimulationProps {
  onComplete?: () => void
  progress: number // Real progress from 0-100
}

export function ProcessingSimulation({ onComplete, progress }: ProcessingSimulationProps) {
  const [currentStage, setCurrentStage] = useState<number>(-1)
  const [completedStages, setCompletedStages] = useState<number[]>([])
  const [isComplete, setIsComplete] = useState(false)

  // Determine current stage based on progress
  useEffect(() => {
    // Find the current stage based on progress
    const newStageIndex = processStages.findIndex(
      (stage) => progress >= stage.progressStart && progress < stage.progressEnd
    );

    if (progress >= 100) {
      // All stages complete
      setIsComplete(true);
      setCurrentStage(-1); // No current stage when complete
      
      // Mark all stages as completed
      const allStageIndices = processStages.map((_, index) => index);
      setCompletedStages(allStageIndices);
      
      // Call onComplete callback
      if (onComplete && !isComplete) {
        onComplete();
      }
    } else if (newStageIndex !== -1 && newStageIndex !== currentStage) {
      // Stage has changed
      
      // Mark previous stages as completed
      if (currentStage !== -1) {
        setCompletedStages(prev => {
          const newCompleted = [...prev];
          if (!newCompleted.includes(currentStage)) {
            newCompleted.push(currentStage);
          }
          return newCompleted;
        });
      }
      
      // Set the new current stage
      setCurrentStage(newStageIndex);
    } else if (newStageIndex === -1 && progress > 0 && currentStage === -1) {
      // Initialize first stage
      setCurrentStage(0);
    }
  }, [progress, currentStage, onComplete, isComplete]);

  // Get the stage-specific progress percentage
  const getStageProgress = (index: number): number => {
    if (index !== currentStage) {
      return completedStages.includes(index) ? 100 : 0;
    }
    
    const stage = processStages[index];
    const stageRange = stage.progressEnd - stage.progressStart;
    return Math.min(
      Math.max(
        ((progress - stage.progressStart) / stageRange) * 100,
        0
      ),
      100
    );
  };

  // Determine if a stage should be visible
  const isStageVisible = (index: number): boolean => {
    return index === currentStage || completedStages.includes(index) || isComplete;
  };

  return (
    <div className="space-y-6">
      <div className="space-y-6">
        <div className="relative h-3 overflow-hidden rounded-full bg-muted">
          <div 
            className="h-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-300 ease-in-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="space-y-4">
          <AnimatePresence>
            {processStages.map((stage, index) => {
              // Skip if not visible
              if (!isStageVisible(index)) return null;

              const isActive = index === currentStage;
              const isCompleted = completedStages.includes(index);
              const stageProgress = getStageProgress(index);

              return (
                <motion.div
                  key={stage.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className={`relative rounded-lg border p-4 transition-all duration-300 ${
                    isActive
                      ? `bg-gradient-to-r ${stage.color} text-white shadow-lg`
                      : isCompleted
                        ? "border-green-500 bg-green-500/10"
                        : "border-border bg-card"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`rounded-full p-1 ${
                        isActive ? "bg-white/20" : isCompleted ? "bg-green-500/20" : "bg-muted"
                      }`}
                    >
                      {isActive ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : isCompleted ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <Clock className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <h4 className={`font-medium ${isActive ? "text-white" : isCompleted ? "text-green-500" : ""}`}>
                        {stage.name}
                      </h4>
                      <p className={`text-sm ${isActive ? "text-white/80" : "text-muted-foreground"}`}>
                        {stage.description}
                      </p>
                    </div>
                    <div className="ml-auto text-sm font-medium">
                      {isCompleted
                        ? "100%"
                        : isActive
                          ? `${Math.round(stageProgress)}%`
                          : "0%"
                      }
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}