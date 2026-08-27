import { describe, expect, it } from 'vitest'

import { renderMarkdownToHtml } from './markdown'

describe('renderMarkdownToHtml', () => {
  it('renders the supported markdown blocks and inline styles', () => {
    const html = renderMarkdownToHtml(
      'A paragraph\nwith a line break.\n\n- one\n- two\n\n**bold** and *soft* plus [a link](https://example.com).',
    )

    expect(html).toContain('<p>A paragraph<br />with a line break.</p>')
    expect(html).toContain('<ul><li>one</li><li>two</li></ul>')
    expect(html).toContain('<strong>bold</strong>')
    expect(html).toContain('<em>soft</em>')
    expect(html).toContain(
      '<a href="https://example.com" target="_blank" rel="noreferrer">a link</a>',
    )
  })

  it('escapes markup and drops unsafe link protocols', () => {
    const html = renderMarkdownToHtml(
      '<script>alert(1)</script> [run](javascript:alert(1))',
    )

    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;')
    expect(html).toContain('<a href="#">run</a>')
    expect(html).not.toContain('javascript:')
  })
})
