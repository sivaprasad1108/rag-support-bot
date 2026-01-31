function cleanText(text) {
  if (!text) return '';

  // Decode HTML entities (though cheerio.text() usually handles this)
  text = text.replace(/&nbsp;/g, ' ')
             .replace(/&amp;/g, '&')
             .replace(/&lt;/g, '<')
             .replace(/&gt;/g, '>')
             .replace(/&quot;/g, '"')
             .replace(/&#39;/g, "'");

  // Remove extra whitespaces and newlines
  text = text.replace(/\s+/g, ' ').trim();

  // Optionally, remove non-printable characters
  text = text.replace(/[\x00-\x1F\x7F-\x9F]/g, '');

  return text;
}

module.exports = cleanText;
