type JsonLdProps = {
  // Schema.org payloads are intentionally loose JSON objects.
  data: object | object[]
}

/** Server-safe JSON-LD script tag. */
export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
