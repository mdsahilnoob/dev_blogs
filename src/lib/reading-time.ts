const DEFAULT_WORDS_PER_MINUTE = 200;

function countWords(content: string): number {
  const matches = content.trim().match(/\S+/g);
  return matches ? matches.length : 0;
}

export function getReadingTimeMinutes(
  content: string,
  wordsPerMinute = DEFAULT_WORDS_PER_MINUTE
): number {
  const words = countWords(content);

  if (words === 0) {
    return 1;
  }

  return Math.max(1, Math.ceil(words / wordsPerMinute));
}
