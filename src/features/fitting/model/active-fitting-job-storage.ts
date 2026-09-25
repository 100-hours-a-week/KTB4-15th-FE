const ACTIVE_FITTING_JOB_ID_KEY = "active-fitting-job-id";

export function getActiveFittingJobId() {
  const storedValue = localStorage.getItem(ACTIVE_FITTING_JOB_ID_KEY);

  if (!storedValue) return null;

  const fittingJobId = Number(storedValue);

  if (!Number.isSafeInteger(fittingJobId) || fittingJobId <= 0) {
    localStorage.removeItem(ACTIVE_FITTING_JOB_ID_KEY);
    return null;
  }

  return fittingJobId;
}

export function setActiveFittingJobId(fittingJobId: number) {
  localStorage.setItem(ACTIVE_FITTING_JOB_ID_KEY, String(fittingJobId));
}

export function clearActiveFittingJobId() {
  localStorage.removeItem(ACTIVE_FITTING_JOB_ID_KEY);
}
