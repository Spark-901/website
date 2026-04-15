'use client'

import * as React from 'react'
import { Gift, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'

interface GiftToolDialogProps {
  projectTitle: string
  projectSlug: string
}

export function GiftToolDialog({ projectTitle, projectSlug }: GiftToolDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const { toast } = useToast()

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsLoading(true)

    const formData = new FormData(event.currentTarget)
    const data = {
      projectTitle,
      projectSlug,
      donorName: formData.get('donorName'),
      donorEmail: formData.get('donorEmail'),
      donorCompany: formData.get('donorCompany'),
      targetNonprofit: formData.get('targetNonprofit'),
      targetWebsite: formData.get('targetWebsite'),
      message: formData.get('message'),
    }

    try {
      const response = await fetch('/api/gift-tool', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Failed to submit request')
      }

      toast({
        title: "Request Sent!",
        description: "We've received your gift request and will be in touch soon.",
      })
      setIsOpen(false)
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: "There was an error sending your request. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full gap-2 border-primary/20 hover:bg-primary/5 hover:text-primary">
          <Gift className="h-4 w-4" />
          Gift This Tool
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" />
              Gift This Tool
            </DialogTitle>
            <DialogDescription className="pt-2">
              Sponsor the setup, implementation, and deployment of <strong>{projectTitle}</strong> for a specific nonprofit organization. We'll handle the technical work so they can focus on their mission.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="donorName">Your Name</Label>
              <Input id="donorName" name="donorName" placeholder="Jane Doe" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="donorEmail">Your Email</Label>
              <Input id="donorEmail" name="donorEmail" type="email" placeholder="jane@example.com" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="donorCompany">Your Company (Optional)</Label>
              <Input id="donorCompany" name="donorCompany" placeholder="Acme Corp" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="targetNonprofit">Target Nonprofit Name</Label>
              <Input id="targetNonprofit" name="targetNonprofit" placeholder="Local Food Bank" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="targetWebsite">Target Nonprofit Website (Optional)</Label>
              <Input id="targetWebsite" name="targetWebsite" type="url" placeholder="https://..." />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="message">Message (Optional)</Label>
              <Textarea id="message" name="message" placeholder="Tell us why you'd like to gift this tool..." />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Gift Request
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
