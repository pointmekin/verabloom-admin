const SAFE_LINK_PROTOCOL = /^(?:https?:|mailto:)/i

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function inlineMarkdown(value: string) {
  let html = escapeHtml(value)

  html = html.replace(
    /\[([^\]]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g,
    (_, label: string, href: string) => {
      const safeHref = SAFE_LINK_PROTOCOL.test(href) ? href : '#'
      const target = safeHref === '#' ? '' : ' target="_blank" rel="noreferrer"'
      return `<a href="${escapeHtml(safeHref)}"${target}>${label}</a>`
    },
  )
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>')
  html = html.replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, '$1<em>$2</em>')
  html = html.replace(/(^|[^_])_([^_]+)_(?!_)/g, '$1<em>$2</em>')

  return html
}

export function renderMarkdownToHtml(markdown: string) {
  const lines = markdown.replaceAll('\r\n', '\n').split('\n')
  const blocks: string[] = []
  let paragraph: string[] = []
  let list: string[] = []

  const flushParagraph = () => {
    if (paragraph.length === 0) return
    blocks.push(
      `<p>${inlineMarkdown(paragraph.join('\n')).replaceAll('\n', '<br />')}</p>`,
    )
    paragraph = []
  }

  const flushList = () => {
    if (list.length === 0) return
    blocks.push(
      `<ul>${list.map((item) => `<li>${inlineMarkdown(item)}</li>`).join('')}</ul>`,
    )
    list = []
  }

  for (const line of lines) {
    const item = line.match(/^\s*[-*+]\s+(.+)$/)
    if (item) {
      flushParagraph()
      list.push(item[1])
      continue
    }
    if (line.trim() === '') {
      flushParagraph()
      flushList()
      continue
    }
    flushList()
    paragraph.push(line)
  }

  flushParagraph()
  flushList()
  return blocks.join('')
}
