"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { TurnstileField } from "@/components/turnstile-field"

const SKILL_VALUES = [
  "engineering",
  "design",
  "product",
  "writing",
  "outreach",
  "mentoring",
  "other",
] as const

const AVAILABILITY_VALUES = [
  "lt_2_hrs",
  "2_to_5_hrs",
  "5_to_10_hrs",
  "10_plus_hrs",
] as const

type Skill = (typeof SKILL_VALUES)[number]

const formSchema = z.object({
  name: z.string().trim().min(1, "Please enter your name.").max(120),
  email: z.email("Please enter a valid email address.").max(254),
  skills: z
    .array(z.enum(SKILL_VALUES))
    .min(1, "Pick at least one skill.")
    .max(SKILL_VALUES.length),
  availability: z.enum(AVAILABILITY_VALUES, {
    message: "Pick your weekly availability.",
  }),
  profileUrl: z
    .string()
    .trim()
    .max(500)
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || /^https?:\/\//i.test(v), {
      message: "Must be an http(s) URL.",
    }),
  message: z.string().trim().max(2000).optional(),
  website: z.string().max(0).optional(),
})

type FormValues = z.infer<typeof formSchema>

export function VolunteerSignupForm() {
  const t = useTranslations("volunteer.form")
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const [turnstileKey, setTurnstileKey] = useState(0)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      skills: [],
      availability: undefined as unknown as FormValues["availability"],
      profileUrl: "",
      message: "",
      website: "",
    },
  })

  async function onSubmit(values: FormValues) {
    if (!turnstileToken) {
      toast({ title: t("error"), variant: "destructive" })
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/volunteer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, turnstileToken }),
      })

      if (!response.ok) {
        throw new Error("Failed to submit")
      }

      toast({ title: t("success") })
      setSubmitted(true)
      setTurnstileToken(null)
      form.reset()
    } catch {
      setTurnstileToken(null)
      setTurnstileKey((k) => k + 1)
      toast({ title: t("error"), variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent>
        {submitted ? (
          <div className="space-y-3">
            <p className="text-base font-medium text-foreground">{t("thanksTitle")}</p>
            <p className="text-sm text-muted-foreground">{t("thanksBody")}</p>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("nameLabel")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("namePlaceholder")} autoComplete="name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("emailLabel")}</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder={t("emailPlaceholder")}
                        autoComplete="email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="skills"
                render={() => (
                  <FormItem>
                    <FormLabel>{t("skillsLabel")}</FormLabel>
                    <FormDescription>{t("skillsHelp")}</FormDescription>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {SKILL_VALUES.map((skill) => (
                        <FormField
                          key={skill}
                          control={form.control}
                          name="skills"
                          render={({ field }) => {
                            const checked = field.value?.includes(skill) ?? false
                            return (
                              <label className="flex cursor-pointer items-center gap-2 rounded-md border border-border/60 bg-background p-3 text-sm transition-colors hover:bg-muted/50">
                                <FormControl>
                                  <Checkbox
                                    checked={checked}
                                    onCheckedChange={(c) => {
                                      const current = field.value ?? []
                                      const next = c
                                        ? [...current, skill]
                                        : current.filter((s: Skill) => s !== skill)
                                      field.onChange(next)
                                    }}
                                  />
                                </FormControl>
                                <span className="font-medium">{t(`skills.${skill}`)}</span>
                              </label>
                            )
                          }}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="availability"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("availabilityLabel")}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={t("availabilityPlaceholder")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {AVAILABILITY_VALUES.map((value) => (
                          <SelectItem key={value} value={value}>
                            {t(`availability.${value}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="profileUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("profileLabel")}</FormLabel>
                    <FormControl>
                      <Input
                        type="url"
                        inputMode="url"
                        placeholder={t("profilePlaceholder")}
                        autoComplete="url"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>{t("profileHelp")}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("messageLabel")}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t("messagePlaceholder")}
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem
                    aria-hidden="true"
                    className="pointer-events-none absolute h-0 w-0 overflow-hidden opacity-0"
                  >
                    <FormLabel>Website</FormLabel>
                    <FormControl>
                      <Input tabIndex={-1} autoComplete="off" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <TurnstileField key={turnstileKey} onTokenChange={setTurnstileToken} />

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting || !turnstileToken}
              >
                {isSubmitting ? t("submitting") : t("submit")}
              </Button>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  )
}
