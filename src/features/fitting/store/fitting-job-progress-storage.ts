const FITTING_JOB_PROGRESS_PREFIX = "fitting-job-progress:";

function getStorageKey(fittingJobId: number) {
  return `${FITTING_JOB_PROGRESS_PREFIX}${fittingJobId}`;
}

export function saveFittingJobStartedAt(fittingJobId: number) {
  localStorage.setItem(getStorageKey(fittingJobId), String(Date.now()));
}

export function getFittingJobStartedAt(fittingJobId: number) {
  const storedValue = localStorage.getItem(getStorageKey(fittingJobId));
  const startedAt = Number(storedValue);

  return Number.isFinite(startedAt) && startedAt > 0 ? startedAt : null;
}

export function clearFittingJobProgress(fittingJobId: number) {
  localStorage.removeItem(getStorageKey(fittingJobId));
}
