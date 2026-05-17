import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, Circle, Clock } from "lucide-react"
import { getTranslations } from "next-intl/server"

interface Milestone {
  title: string
  targetAmount: number
  status: "completed" | "in-progress" | "pending"
  description?: string
}

interface DevelopmentMilestonesProps {
  milestones: Milestone[]
  fundingRaised: number
}

export async function DevelopmentMilestones({ milestones, fundingRaised }: DevelopmentMilestonesProps) {
  if (!milestones || milestones.length === 0) return null

  const t = await getTranslations("projectDetail")

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="text-xl">{t("milestones")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative space-y-4">
          {/* Vertical line connector */}
          <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-muted hidden sm:block" />

          {milestones.map((milestone, index) => {
            const isCompleted = milestone.status === "completed"
            const isInProgress = milestone.status === "in-progress"
            
            return (
              <div key={index} className="relative flex items-start gap-4">
                {/* Milestone status icon */}
                <div className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-background z-10 hidden sm:flex">
                  {isCompleted ? (
                    <CheckCircle2 className="h-6 w-6 text-primary fill-primary/10" />
                  ) : isInProgress ? (
                    <Clock className="h-6 w-6 text-primary" />
                  ) : (
                    <Circle className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <h4 className="font-semibold leading-none">{milestone.title}</h4>
                    <div className="flex items-center gap-2">
                       <span className="text-xs font-medium text-muted-foreground">
                        {t("milestoneGoal")}: ${milestone.targetAmount.toLocaleString()}
                      </span>
                      <Badge 
                        variant={isCompleted ? "default" : isInProgress ? "outline" : "secondary"}
                        className={isInProgress ? "border-primary text-primary" : ""}
                      >
                        {milestone.status}
                      </Badge>
                    </div>
                  </div>
                  {milestone.description && (
                    <p className="text-sm text-muted-foreground">
                      {milestone.description}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
