const PREVIEW_EXERCISE_LIMIT = 3

function formatDistance(meters) {
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters)} m`
}

function setDetail(exercise) {
  const sets = Array.isArray(exercise?.sets) ? exercise.sets : []
  if (sets.length === 0) return ''
  const first = sets[0] ?? {}
  if (first.targetDistanceMeters) {
    return `${sets.length}×${formatDistance(Number(first.targetDistanceMeters))}`
  }
  if (first.targetSeconds) return `${sets.length}×${Number(first.targetSeconds)}s`
  return `${sets.length}×${Number(first.reps) || 0}`
}

function summarizePlan(plan, index) {
  const exercises = Array.isArray(plan?.exercises) ? plan.exercises : []
  let setCount = 0
  let restSeconds = 0
  for (const exercise of exercises) {
    const count = Array.isArray(exercise?.sets) ? exercise.sets.length : 0
    setCount += count
    restSeconds += Math.max(0, count - 1) * (Number(exercise?.restSeconds) || 0)
  }
  return {
    dayIndex: index + 1,
    name: plan?.name ?? '',
    exerciseCount: exercises.length,
    setCount,
    // Same formula the app shows on plan cards (PlansListView.swift:785), so
    // the web preview and the app never disagree about a plan's length.
    minutes: Math.floor((setCount * 45 + restSeconds) / 60),
    exercises: exercises.slice(0, PREVIEW_EXERCISE_LIMIT).map((exercise) => ({
      name: exercise?.name ?? '',
      detail: setDetail(exercise),
    })),
    moreCount: Math.max(0, exercises.length - PREVIEW_EXERCISE_LIMIT),
  }
}

export function summarize(payload, kind) {
  const rawPlans =
    kind === 'program'
      ? Array.isArray(payload?.workouts)
        ? payload.workouts
        : []
      : [payload]
  const plans = rawPlans.filter(Boolean).map(summarizePlan)
  return {
    kind,
    name: payload?.name ?? '',
    planCount: plans.length,
    exerciseCount: plans.reduce((total, plan) => total + plan.exerciseCount, 0),
    minutes: plans.reduce((total, plan) => total + plan.minutes, 0),
    plans,
  }
}
