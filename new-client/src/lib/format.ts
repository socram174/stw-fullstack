const numberFormatter = new Intl.NumberFormat("es-CL")

export function formatNumber(value: number) {
  return numberFormatter.format(value)
}

export function formatDate(
  value: string,
  options?: Intl.DateTimeFormatOptions
) {
  return new Intl.DateTimeFormat(
    "es-CL",
    options ?? {
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  ).format(new Date(`${value}T12:00:00`))
}
