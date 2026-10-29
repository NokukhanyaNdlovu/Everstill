const EMOJIS = ['❤️', '😂', '🔥', '😮', '😢'];

const REPORT_REASONS = [
  'Spam or scam',
  'Harassment or bullying',
  'Hate or hateful conduct',
  'Violence or dangerous content',
  'Nudity or sexual content',
  'Self-harm or suicide content',
  'False or misleading information',
  'Intellectual property/copyright concern',
  'Other',
];

const REPORT_HIDE_THRESHOLD = 3;

function parseHashtags(input) {
  const fromArray = Array.isArray(input) ? input : String(input || '').split(/[\s,]+/);
  const tags = fromArray
    .map((tag) => String(tag).trim().replace(/^#/, '').toLowerCase())
    .filter((tag) => /^[a-z0-9_]{1,30}$/.test(tag));
  return [...new Set(tags)];
}

function extractHashtagsFromText(text) {
  const matches = String(text || '').match(/#([a-zA-Z0-9_]+)/g) || [];
  return parseHashtags(matches);
}

function mergeHashtags(text, extra) {
  return [...new Set([...extractHashtagsFromText(text), ...parseHashtags(extra)])];
}

module.exports = {
  EMOJIS,
  REPORT_REASONS,
  REPORT_HIDE_THRESHOLD,
  parseHashtags,
  extractHashtagsFromText,
  mergeHashtags,
};
