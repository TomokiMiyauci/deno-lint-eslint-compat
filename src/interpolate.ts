/**
 * {@link https://github.com/eslint/eslint/blob/87bd2cef7b2309739c29598fb2be335f4bed71a3/lib/linter/interpolate.js}
 */

/**
 * Returns a global expression matching placeholders in messages.
 * @returns Global regular expression matching placeholders
 */

function getPlaceholderMatcher(): RegExp {
  return /\{\{([^{}]+)\}\}/gu;
}

/**
 * A shared placeholder matcher used by `interpolate()`.
 */
const PLACEHOLDER_MATCHER = getPlaceholderMatcher();

/**
 * Replaces {{ placeholders }} in the message with the provided data.
 * Does not replace placeholders not available in the data.
 * @param text Original message with potential placeholders
 * @param data Map of placeholder name to its value
 * @returns Message with replaced placeholders
 */
export function interpolate(
  text: string,
  data: Record<string, string>,
): string {
  if (!data) {
    return text;
  }

  // Fast path: avoid the regex when there are no placeholders.
  if (!text.includes("{{")) {
    return text;
  }

  /*
   * Note: `String#replace()` doesn't depend on or retain `lastIndex` state,
   * so a shared regex is safe here and avoids creating a new regex for
   * every message.
   */
  // Substitution content for any {{ }} markers.
  return text.replace(
    PLACEHOLDER_MATCHER,
    (fullMatch, termWithWhitespace: string) => {
      const term = termWithWhitespace.trim();

      if (term in data) {
        return data[term]!;
      }

      // Preserve old behavior: If parameter name not provided, don't replace it.
      return fullMatch;
    },
  );
}
