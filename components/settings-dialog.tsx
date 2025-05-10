"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Settings, Save } from "lucide-react"
import { getBaseUrl, setBaseUrl, systemApi, isValidUrl } from "@/lib/api-client"
import { toast } from "sonner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function SettingsDialog() {
  const [apiBaseUrl, setApiBaseUrl] = useState("")
  const [computeDevice, setComputeDevice] = useState("cuda:0")
  const [isLoading, setIsLoading] = useState(false)
  const [open, setOpen] = useState(false)

  // Load saved base URL when dialog opens
  useEffect(() => {
    if (open) {
      const savedUrl = getBaseUrl()
      setApiBaseUrl(savedUrl)
    }
  }, [open])

  const handleSave = async () => {
    try {
      setIsLoading(true)
      
      // Validate URL format
      if (!isValidUrl(apiBaseUrl)) {
        toast.error("Please enter a valid URL")
        setIsLoading(false)
        return
      }
      
      // Save the base URL to local storage - this now also sets the explicitly configured flag
      setBaseUrl(apiBaseUrl)
      
      // Only try to set device if a connection was already tested or established
      try {
        // Try to set the device
        await systemApi.setDevice(computeDevice)
        toast.success("Settings updated successfully")
      } catch (error) {
        // Still consider this a success since the URL was saved
        console.error("Device error:", error)
        toast.success("API URL saved")
        toast.error("Failed to set compute device")
      }
      
      // Always dispatch the settings updated event
      window.dispatchEvent(new CustomEvent('settingsUpdated'));
      
      setOpen(false)
    } catch (error) {
      console.error("Failed to save settings:", error)
      toast.error("Failed to save settings")
    } finally {
      setIsLoading(false)
    }
  }

  const handleTestConnection = async () => {
    try {
      setIsLoading(true)
      
      // Validate URL format using our utility function
      if (!isValidUrl(apiBaseUrl)) {
        toast.error("Please enter a valid URL")
        setIsLoading(false)
        return
      }
      
      console.log("Testing connection to:", apiBaseUrl)
      
      // Try to fetch models as a connection test with a timeout
      try {
        const response = await fetch(`${apiBaseUrl}/models`, { // Use apiBaseUrl directly
          signal: AbortSignal.timeout(10000) // 10 second timeout
        })
        
        console.log("Connection test response status:", response.status)
        
        if (response.ok) {
          // Try to parse the response to verify it's valid JSON and has expected format
          try {
            const data = await response.json()
            console.log("Connection test response data:", data)
            
            // Check for valid data structure
            if (data.models && Array.isArray(data.models)) {
              console.log("Valid models array in 'models' property:", data.models)
              toast.success(`Connection successful! Found ${data.models.length} models.`)
            } else if (Array.isArray(data)) {
              console.log("Valid models array:", data)
              toast.success(`Connection successful! Found ${data.length} models.`)
            } else {
              // Look for arrays in any property
              let foundModels = false
              if (typeof data === 'object') {
                for (const key in data) {
                  if (Array.isArray(data[key])) {
                    console.log(`Found potential models in '${key}' property:`, data[key])
                    toast.success(`Connection successful! Found ${data[key].length} potential models in '${key}' property.`)
                    foundModels = true
                    break
                  }
                }
              }
              
              if (!foundModels) {
                console.warn("Response doesn't contain an array of models:", data)
                toast.warning("Connection successful, but the response format is unexpected. Check console for details.")
              }
            }
          } catch (error) {
            console.error("Failed to parse response as JSON:", error)
            toast.warning("Connection successful, but the response is not valid JSON.")
          }
        } else {
          toast.error(`Connection failed: ${response.status} ${response.statusText}`)
          try {
            const errorText = await response.text()
            console.error("Error response:", errorText)
          } catch (e) {
            console.error("Could not read error response body")
          }
        }
      } catch (error) {
        console.error("Test connection error:", error)
        toast.error("Connection failed. Please check the URL and ensure the server is running.")
      }
    } catch (error) {
      console.error("Connection test failed:", error)
      toast.error("Connection failed. Please check the URL and ensure the server is running.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="rounded-full" aria-label="Settings">
          <Settings className="h-5 w-5" />
          <span className="sr-only">Settings</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>RVC API Settings</DialogTitle>
          <DialogDescription>
            Configure your RVC Voice Conversion API settings. These settings will be saved and persisted.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="api-base-url">API Base URL</Label>
            <Input
              id="api-base-url"
              placeholder="http://localhost:5050"
              value={apiBaseUrl}
              onChange={(e) => setApiBaseUrl(e.target.value)}
              className="bg-muted/50"
            />
            <p className="text-xs text-muted-foreground">The base URL of the RVC Voice Conversion API</p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="compute-device">Computation Device</Label>
            <Select value={computeDevice} onValueChange={setComputeDevice}>
              <SelectTrigger id="compute-device" className="bg-muted/50">
                <SelectValue placeholder="Select device" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cpu">CPU</SelectItem>
                <SelectItem value="cuda:0">CUDA (GPU 0)</SelectItem>
                <SelectItem value="cuda:1">CUDA (GPU 1)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">The device used for voice conversion computation</p>
          </div>

          <Button 
            variant="secondary"
            onClick={handleTestConnection}
            disabled={isLoading || !apiBaseUrl}
          >
            Test Connection
          </Button>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            className="gap-2"
            disabled={isLoading || !apiBaseUrl}
          >
            <Save className="h-4 w-4" />
            Save Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}