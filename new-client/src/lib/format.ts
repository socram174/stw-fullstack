const numberFormatter = new Intl.NumberFormat("en-US")

export function formatNumber(value: number) {
  return numberFormatter.format(value)
}

export function formatDate(
  value: string,
  options?: Intl.DateTimeFormatOptions
) {
  return new Intl.DateTimeFormat(
    "en-US",
    options ?? {
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  ).format(new Date(`${value}T12:00:00`))
}
