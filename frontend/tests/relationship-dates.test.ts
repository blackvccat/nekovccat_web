import assert from 'node:assert/strict'
import test from 'node:test'
import { getRelationshipDates } from '../src/lib/relationship-dates'

// Fictional dates keep private relationship details out of the public repository.
const START = '2030-05-12'

test('the first day is day one and the fourth calendar day is day four', () => {
  assert.equal(getRelationshipDates(new Date('2030-05-12T00:00:00+08:00'), START).daysTogether, 1)
  assert.deepEqual(getRelationshipDates(new Date('2030-05-15T19:00:00+08:00'), START), {
    today: '2030-05-15', startDate: '2030-05-12', daysTogether: 4,
    nextAnniversaryDate: '2030-06-12', anniversaryMonths: 1, daysUntilAnniversary: 28,
  })
})

test('days change at Shanghai midnight regardless of the timestamp offset', () => {
  assert.equal(getRelationshipDates(new Date('2030-05-11T15:59:59Z'), START).daysTogether, 0)
  assert.equal(getRelationshipDates(new Date('2030-05-11T16:00:00Z'), START).daysTogether, 1)
  assert.equal(getRelationshipDates(new Date('2030-05-14T09:00:00-07:00'), START).daysTogether, 4)
  assert.equal(getRelationshipDates(new Date('2030-05-15T15:59:59Z'), START).daysTogether, 4)
  assert.equal(getRelationshipDates(new Date('2030-05-15T16:00:00Z'), START).daysTogether, 5)
})

test('the anniversary remains today until midnight, then advances a month', () => {
  const anniversary = getRelationshipDates(new Date('2030-06-12T23:59:59+08:00'), START)
  assert.equal(anniversary.daysUntilAnniversary, 0)
  assert.equal(anniversary.anniversaryMonths, 1)
  const tomorrow = getRelationshipDates(new Date('2030-06-13T00:00:00+08:00'), START)
  assert.equal(tomorrow.nextAnniversaryDate, '2030-07-12')
  assert.equal(tomorrow.daysUntilAnniversary, 29)
})

test('month ends clamp to February then restore the original anchor day', () => {
  const february = getRelationshipDates(new Date('2027-02-01T12:00:00+08:00'), '2027-01-31')
  assert.equal(february.nextAnniversaryDate, '2027-02-28')
  assert.equal(february.daysUntilAnniversary, 27)
  const march = getRelationshipDates(new Date('2027-03-01T12:00:00+08:00'), '2027-01-31')
  assert.equal(march.nextAnniversaryDate, '2027-03-31')
})

test('yearly anniversaries keep inclusive counting and account for leap years', () => {
  const year = getRelationshipDates(new Date('2031-05-12T12:00:00+08:00'), START)
  assert.equal(year.daysTogether, 366)
  assert.equal(year.anniversaryMonths, 12)
  assert.equal(year.daysUntilAnniversary, 0)
  const leapDay = getRelationshipDates(new Date('2029-02-28T12:00:00+08:00'), '2028-02-29')
  assert.equal(leapDay.nextAnniversaryDate, '2029-02-28')
  assert.equal(leapDay.anniversaryMonths, 12)
  assert.equal(leapDay.daysUntilAnniversary, 0)
})

test('invalid calendar anchors fail explicitly', () => {
  assert.throws(() => getRelationshipDates(new Date(), '2030-02-30'), RangeError)
  assert.throws(() => getRelationshipDates(new Date(), '2030/05/12'), RangeError)
})
