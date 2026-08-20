import React from 'react';

/**
 * Converts a plain text string containing URLs (http, https, www, mailto)
 * into an array of React components where URLs are converted to clickable <a> elements.
 * 
 * @param {string} text - The input plain text
 * @returns {React.ReactNode} Parsed text with clickable link components
 */
export const linkifyText = (text) => {
  if (!text || typeof text !== 'string') return text;

  // Regex to detect http://, https://, ftp://, or www. URLs
  const urlRegex = /(https?:\/\/[^\s<]+|www\.[^\s<]+)/gi;
  const parts = text.split(urlRegex);

  if (parts.length === 1) return text;

  return parts.map((part, index) => {
    if (part.match(/^https?:\/\//i) || part.match(/^www\./i)) {
      let url = part;
      let trailingPunct = '';

      // Strip trailing punctuation like '.', ',', ';', '!', '?', ')', etc. that are sentence endings
      const matchPunct = url.match(/([.,;:!?)]+)$/);
      if (matchPunct) {
        trailingPunct = matchPunct[0];
        url = url.substring(0, url.length - trailingPunct.length);
      }

      const href = url.startsWith('www.') ? `https://${url}` : url;

      return (
        <React.Fragment key={index}>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="article-inline-link fw-semibold"
            style={{
              color: 'rgb(48, 68, 199)',
              textDecoration: 'underline',
              wordBreak: 'break-all',
              cursor: 'pointer'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {url}
          </a>
          {trailingPunct}
        </React.Fragment>
      );
    }
    return part;
  });
};

/**
 * Parses HTML strings (like from RSS feeds or rich text editors) to ensure:
 * 1. Unlinked URLs outside existing HTML tags are auto-converted to <a> links.
 * 2. Existing <a> tags get target="_blank" and rel="noopener noreferrer".
 * 
 * @param {string} htmlContent - Raw HTML string
 * @returns {object} Object formatted for dangerouslySetInnerHTML
 */
export const formatClickableHtml = (htmlContent) => {
  if (!htmlContent || typeof htmlContent !== 'string') return { __html: '' };

  // 1. Ensure all existing <a> tags open in a new tab
  let processed = htmlContent.replace(/<a\s+(?![^>]*target=)/gi, '<a target="_blank" rel="noopener noreferrer" ');

  // 2. Convert plain URLs outside HTML tags to <a> links
  const urlPattern = /(^|[\s>])((?:https?:\/\/|www\.)[^\s<]+)/gi;

  processed = processed.replace(urlPattern, (match, prefix, url) => {
    let cleanUrl = url;
    let trailingPunct = '';
    const matchPunct = cleanUrl.match(/([.,;:!?)]+)$/);
    if (matchPunct) {
      trailingPunct = matchPunct[0];
      cleanUrl = cleanUrl.substring(0, cleanUrl.length - trailingPunct.length);
    }
    const href = cleanUrl.startsWith('www.') ? `https://${cleanUrl}` : cleanUrl;
    return `${prefix}<a href="${href}" target="_blank" rel="noopener noreferrer" style="color: rgb(48, 68, 199); text-decoration: underline; word-break: break-all;">${cleanUrl}</a>${trailingPunct}`;
  });

  return { __html: processed };
};
