import { fetchRecentCommits, fetchRecentResolvedIssues } from "@/lib/github"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GitCommit, Github, CheckCircle, ExternalLink } from "lucide-react"
import { getTranslations } from "next-intl/server"

interface GitHubActivityProps {
  githubUrl: string
}

export async function GitHubActivity({ githubUrl }: GitHubActivityProps) {
  const [commits, issues, t] = await Promise.all([
    fetchRecentCommits(githubUrl),
    fetchRecentResolvedIssues(githubUrl),
    getTranslations("projectDetail")
  ])

  if (commits.length === 0 && issues.length === 0) {
    return null
  }

  return (
    <Card className="mt-8">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl flex items-center gap-2">
          <Github className="h-5 w-5" />
          {t("projectActivity")}
        </CardTitle>
        <a 
          href={githubUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
        >
          {t("viewOnGithub")} <ExternalLink className="h-3 w-3" />
        </a>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="commits" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="commits" className="flex items-center gap-2">
              <GitCommit className="h-4 w-4" />
              {t("latestCommits")}
            </TabsTrigger>
            <TabsTrigger value="issues" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              {t("resolvedIssues")}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="commits" className="space-y-4">
            {commits.length > 0 ? (
              commits.map((commit) => (
                <div key={commit.sha} className="flex items-start justify-between border-b pb-4 last:border-0 last:pb-0">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">{commit.message}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-mono text-primary/80">{commit.sha}</span>
                      <span>•</span>
                      <span>{commit.author}</span>
                      <span>•</span>
                      <span>{new Date(commit.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <a 
                    href={commit.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              ))
            ) : (
              <p className="text-sm text-center text-muted-foreground py-4">{t("noCommits")}</p>
            )}
          </TabsContent>
          
          <TabsContent value="issues" className="space-y-4">
            {issues.length > 0 ? (
              issues.map((issue) => (
                <div key={issue.id} className="flex items-start justify-between border-b pb-4 last:border-0 last:pb-0">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">
                      <span className="text-muted-foreground mr-1">#{issue.number}</span>
                      {issue.title}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1 text-green-600 dark:text-green-500">
                        <CheckCircle className="h-3 w-3" />
                        {t("resolvedIssues")}
                      </span>
                      <span>•</span>
                      <span>{new Date(issue.closedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <a 
                    href={issue.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              ))
            ) : (
              <p className="text-sm text-center text-muted-foreground py-4">{t("noIssues")}</p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
