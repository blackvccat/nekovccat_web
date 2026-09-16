/** 通用日期计算：给「自某天起」这类区块用，和具体应用无关。 */
export const DATE_TIME_ZONE = 'Asia/Shanghai'

const DAY_MS = 86_400_000
const calendarFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: DATE_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit',
})

function calendarDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) throw new RangeError('Expected a calendar date in YYYY-MM-DD format')
  const [, year, month, day] = match.map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    throw new RangeError('Invalid calendar date')
  }
  return date
}

function dateLabel(date: Date) {
  return date.toISOString().slice(0, 10)
}

/** Clamp each monthly anniversary to its month's last day, keeping the original anchor day. */
function anniversaryAt(start: Date, months: number) {
  const first = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + months, 1))
  const lastDay = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate()
  first.setUTCDate(Math.min(start.getUTCDate(), lastDay))
  return first
}

export function getSinceDates(now: Date = new Date(), since: string) {
  const parts = calendarFormatter.formatToParts(now)
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find(value => value.type === type)!.value
  const today = calendarDate(`${part('year')}-${part('month')}-${part('day')}`)
  const start = calendarDate(since)
  const days = Math.max(0, Math.round((today.getTime() - start.getTime()) / DAY_MS) + 1)
  let months = Math.max(1, (today.getUTCFullYear() - start.getUTCFullYear()) * 12 + today.getUTCMonth() - start.getUTCMonth())
  let anniversary = anniversaryAt(start, months)
  if (anniversary.getTime() < today.getTime()) anniversary = anniversaryAt(start, ++months)

  return {
    today: dateLabel(today), since, days,
    nextAnniversaryDate: dateLabel(anniversary), anniversaryMonths: months,
    daysUntilAnniversary: Math.round((anniversary.getTime() - today.getTime()) / DAY_MS),
  }
}
