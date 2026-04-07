/**
 * SM-2 simplified spaced repetition algorithm
 * quality: 5 = perfect, 4 = correct with hesitation, 3 = correct after struggle,
 *          2 = wrong (easy hint), 1 = wrong, 0 = blackout
 */
export function updateSRS(state = {}, quality) {
  const {
    interval = 0,
    easeFactor = 2.5,
    reviewCount = 0,
  } = state;

  let newInterval;
  let newEaseFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  newEaseFactor = Math.max(1.3, newEaseFactor);

  if (quality < 3) {
    // Failed — reset to beginning
    newInterval = 1;
    newEaseFactor = Math.max(1.3, easeFactor - 0.2);
  } else {
    if (reviewCount === 0) newInterval = 1;
    else if (reviewCount === 1) newInterval = 4;
    else newInterval = Math.round(interval * easeFactor);
  }

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + newInterval);

  return {
    interval: newInterval,
    easeFactor: newEaseFactor,
    reviewCount: reviewCount + 1,
    nextReview: nextReview.toISOString().split('T')[0],
    lastQuality: quality,
  };
}

export function isDue(srsState) {
  if (!srsState?.nextReview) return true; // never reviewed
  const today = new Date().toISOString().split('T')[0];
  return srsState.nextReview <= today;
}

/** Convert correct/time to SM-2 quality score */
export function toQuality(correct, timeSec) {
  if (!correct) return timeSec > 20 ? 0 : 1; // slow wrong = blackout
  if (timeSec <= 5) return 5;  // fast correct
  if (timeSec <= 12) return 4; // normal
  return 3;                     // slow correct
}
