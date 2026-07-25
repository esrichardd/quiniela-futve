export const predictionResults = ["home", "draw", "away"] as const;

export const MIN_PREDICTED_SCORE = 0;
export const MAX_PREDICTED_SCORE = 99;

/**
 * How long before official kickoff predictions stop being editable. This
 * is a product decision (reduce the value of last-minute information like
 * late lineup news), not a security boundary: the closing rule is always
 * evaluated server-side against the server's own clock, so a client's
 * device time was never able to bypass it.
 */
export const PREDICTION_LOCK_BUFFER_MINUTES = 60;
