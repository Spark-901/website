import { Card, CardContent } from "@/components/ui/card"

interface Organization {
  name: string
  logoUrl: string
}

interface OrganizationDirectoryProps {
  organizations: Organization[]
  title: string
}

export function OrganizationDirectory({ organizations, title }: OrganizationDirectoryProps) {
  if (!organizations || organizations.length === 0) return null

  return (
    <section className="mt-8" aria-labelledby="org-directory-title">
      <h2 id="org-directory-title" className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h2>
      <div className="mt-4 flex flex-wrap gap-6 grayscale opacity-70">
        {organizations.map((org, index) => (
          <div key={index} className="flex items-center gap-2">
            <img
              src={org.logoUrl}
              alt={`${org.name} logo`}
              className="h-8 w-8 object-contain"
            />
            <span className="text-sm font-medium">{org.name}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
