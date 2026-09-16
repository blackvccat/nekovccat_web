import assert from 'node:assert/strict'
import test from 'node:test'
import { getSinceDates, DATE_TIME_ZONE } from '../src/lib/date-since'

test('counts days inclusively in the configured time zone', () => {
  const dates = getSinceDates(new Date('2024-01-01T00:00:00Z'), '2024-01-01')
  assert.equal(dates.days, 1)
  assert.equal(dates.today, '2024-01-01')
  assert.equal(DATE_TIME_ZONE, 'Asia/Shanghai')
})

test('days change at Shanghai midnight regardless of the timestamp offset', () => {
  assert.equal(getSinceDates(new Date('2024-03-09T15:59:00Z'), '2024-03-01').today, '2024-03-09')
  assert.equal(getSinceDates(new Date('2024-03-09T16:00:00Z'), '2024-03-01').today, '2024-03-10')
})

test('the anniversary remains today until midnight, then advances a month', () => {
  const start = '2024-01-15'
  assert.equal(getSinceDates(new Date('2024-06-15T02:00:00Z'), start).daysUntilAnniversary, 0)
  assert.equal(getSinceDates(new Date('2024-06-15T02:00:00Z'), start).anniversaryMonths, 5)
  const next = getSinceDates(new Date('2024-06-16T02:00:00Z'), start)
  assert.equal(next.anniversaryMonths, 6)
  assert.equal(next.nextAnniversaryDate, '2024-07-15')
})

test('month ends clamp to February then restore the original anchor day', () => {
  const start = '2024-01-31'
  assert.equal(getSinceDates(new Date('2024-02-29T02:00:00Z'), start).nextAnniversaryDate, '2024-02-29')
  assert.equal(getSinceDates(new Date('2024-03-01T02:00:00Z'), start).nextAnniversaryDate, '2024-03-31')
})

test('yearly anniversaries keep inclusive counting and account for leap years', () => {
  const start = '2020-02-29'
  const dates = getSinceDates(new Date('2024-02-29T02:00:00Z'), start)
  assert.equal(dates.days, 1462)
  assert.equal(dates.anniversaryMonths, 48)
  assert.equal(dates.nextAnniversaryDate, '2024-02-29')
})

test('invalid anchors fail explicitly', () => {
  assert.throws(() => getSinceDates(new Date('2024-01-01T00:00:00Z'), '2024-1-1'), RangeError)
  assert.throws(() => getSinceDates(new Date('2024-01-01T00:00:00Z'), '2023-02-29'), RangeError)
})
