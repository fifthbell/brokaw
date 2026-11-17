/**
 * How long a live-program source's last good data stays on air after the
 * source starts failing (fifthbell/brokaw#35). After that it drops out.
 */
export const SOURCE_RETENTION_MS = 30 * 60 * 1000;

/**
 * Last good answers of one source, by key (usually the language). recall
 * returns an answer only while it is at most SOURCE_RETENTION_MS old and
 * forgets older ones.
 */
export function createLastGood<T>() {
  const answers = new Map<string, { value: T; at: number }>();
  return {
    keep(key: string, value: T): T {
      answers.set(key, { value, at: Date.now() });
      return value;
    },
    recall(key: string): T | undefined {
      const answer = answers.get(key);
      if (answer && Date.now() - answer.at <= SOURCE_RETENTION_MS) return answer.value;
      answers.delete(key);
      return undefined;
    },
  };
}
