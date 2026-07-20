interface Organization {
  name: string
  logoUrl?: string
  website?: string
  note?: string
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
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {organizations.map((org) => (
          <li key={org.name} className="rounded-lg border border-border bg-card/50 px-4 py-3">
            <div className="flex items-center gap-3">
              {org.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={org.logoUrl} alt="" className="h-9 w-9 rounded object-contain" />
              ) : (
                <span
                  className="flex h-9 w-9 items-center justify-center rounded bg-primary/10 text-xs font-bold text-primary"
                  aria-hidden="true"
                >
                  {org.name.slice(0, 2).toUpperCase()}
                </span>
              )}
              <div className="min-w-0">
                {org.website ? (
                  <a
                    href={org.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-foreground underline-offset-2 hover:underline"
                  >
                    {org.name}
                  </a>
                ) : (
                  <p className="font-medium text-foreground">{org.name}</p>
                )}
                {org.note && <p className="text-xs text-muted-foreground">{org.note}</p>}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
