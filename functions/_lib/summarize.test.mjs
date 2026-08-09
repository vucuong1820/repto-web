import test from 'node:test'
import assert from 'node:assert/strict'
import { summarize } from './summarize.mjs'

const plan = {
  name: 'Pull Day',
  exercises: [
    { name: 'Deadlift', restSeconds: 120, sets: [{ reps: 8 }, { reps: 8 }, { reps: 8 }] },
    { name: 'Pull-up', restSeconds: 90, sets: [{ reps: 10 }, { reps: 10 }] },
    { name: 'Row', restSeconds: 60, sets: [{ reps: 12 }] },
    { name: 'Curl', restSeconds: 60, sets: [{ reps: 12 }] },
  ],
}

test('summarize counts plans and exercises for a program', () => {
  const result = summarize({ name: 'PPL', workouts: [plan, plan] }, 'program')
  assert.equal(result.planCount, 2)
  assert.equal(result.exerciseCount, 8)
  assert.equal(result.name, 'PPL')
})

test('summarize wraps a single plan payload', () => {
  const result = summarize(plan, 'plan')
  assert.equal(result.planCount, 1)
  assert.equal(result.exerciseCount, 4)
})

test('summarize reproduces the app minute formula', () => {
  // 7 sets * 45 = 315; rest = 2*120 + 1*90 + 0 + 0 = 330; (315+330)/60 = 10
  const result = summarize(plan, 'plan')
  assert.equal(result.plans[0].minutes, 10)
})

test('summarize truncates the exercise list to three and reports the remainder', () => {
  const result = summarize(plan, 'plan')
  assert.equal(result.plans[0].exercises.length, 3)
  assert.equal(result.plans[0].moreCount, 1)
  assert.equal(result.plans[0].exercises[0].detail, '3×8')
})

test('summarize formats time and distance sets', () => {
  const cardio = {
    name: 'Run',
    exercises: [
      { name: 'Plank', restSeconds: 30, sets: [{ reps: 0, targetSeconds: 60 }] },
      { name: 'Run', restSeconds: 0, sets: [{ reps: 0, targetDistanceMeters: 5000 }] },
    ],
  }
  const result = summarize(cardio, 'plan')
  assert.equal(result.plans[0].exercises[0].detail, '1×60s')
  assert.equal(result.plans[0].exercises[1].detail, '1×5.0 km')
})

test('summarize survives a malformed payload', () => {
  const result = summarize({}, 'program')
  assert.equal(result.planCount, 0)
  assert.equal(result.exerciseCount, 0)
  assert.equal(result.name, '')
})

test('summarize does not render NaN for a non-numeric target', () => {
  const bad = { name: 'X', exercises: [
    { name: 'Plank', restSeconds: 0, sets: [{ reps: 0, targetSeconds: 'abc' }] },
  ] }
  const detail = summarize(bad, 'plan').plans[0].exercises[0].detail
  assert.ok(!detail.includes('NaN'), `expected no NaN, got ${detail}`)
  assert.equal(detail, '1×0')
})

test('summarize keeps a zero target in its own mode', () => {
  const zero = { name: 'X', exercises: [
    { name: 'Row', restSeconds: 0, sets: [{ reps: 0, targetDistanceMeters: 0 }] },
  ] }
  assert.equal(summarize(zero, 'plan').plans[0].exercises[0].detail, '1×0 m')
})

test('summarize formats sub-kilometre distances in metres', () => {
  const short = { name: 'X', exercises: [
    { name: 'Sprint', restSeconds: 0, sets: [{ reps: 0, targetDistanceMeters: 400 }] },
  ] }
  assert.equal(summarize(short, 'plan').plans[0].exercises[0].detail, '1×400 m')
})

test('summarize survives a null plan and null sets', () => {
  assert.equal(summarize({ name: 'X', workouts: [null] }, 'program').planCount, 0)
  const nullSets = { name: 'X', exercises: [{ name: 'Y', restSeconds: 0, sets: null }] }
  assert.equal(summarize(nullSets, 'plan').plans[0].exercises[0].detail, '')
})
