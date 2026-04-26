export interface PageConfig {
  visibleWidth: number   // px, excludes horizontal padding
  visibleHeight: number  // px, excludes title + top padding
  fontSize: number       // px
  lineHeight: number     // multiplier e.g. 1.8
  indentChars: number    // first-line indent in chars (2 for 2em)
  paraMarginPx: number   // margin-bottom after last line of each paragraph
}

export interface PageLine {
  text: string
  isParaStart: boolean   // apply text-indent on this line
  isParaEnd: boolean     // apply paragraph margin-bottom after this line
  paraIndex: number      // chapter-level paragraph index (for TTS highlighting)
}

// Split text into pages at line boundaries (not paragraph boundaries) so each
// page fills as tightly as possible with no wasted space at the bottom.
export function paginateText(text: string, config: PageConfig): PageLine[][] {
  const paras = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0)
  if (paras.length === 0) return [[]]

  const lineHeightPx = config.fontSize * config.lineHeight
  const charsPerLine = Math.floor(config.visibleWidth / config.fontSize)
  if (charsPerLine <= 0 || lineHeightPx <= 0 || config.visibleHeight <= 0) {
    return [paras.map((p, i) => ({ text: p, isParaStart: true, isParaEnd: true, paraIndex: i }))]
  }

  const pages: PageLine[][] = []
  let pageBuf: PageLine[] = []
  let durY = 0

  for (let pi = 0; pi < paras.length; pi++) {
    const para = paras[pi]!

    // Split paragraph into display lines, accounting for 2em first-line indent
    const lines: string[] = []
    const firstLen = Math.max(1, charsPerLine - config.indentChars)
    lines.push(para.substring(0, firstLen))
    let pos = firstLen
    while (pos < para.length) {
      lines.push(para.substring(pos, pos + charsPerLine))
      pos += charsPerLine
    }

    for (let li = 0; li < lines.length; li++) {
      const isParaEnd = li === lines.length - 1
      const heightWithMargin = lineHeightPx + (isParaEnd ? config.paraMarginPx : 0)

      if (pageBuf.length > 0 && durY + heightWithMargin > config.visibleHeight) {
        pages.push(pageBuf)
        pageBuf = []
        durY = 0
      }

      pageBuf.push({ text: lines[li]!, isParaStart: li === 0, isParaEnd, paraIndex: pi })
      durY += heightWithMargin
    }
  }

  if (pageBuf.length > 0) pages.push(pageBuf)
  return pages.length > 0 ? pages : [[]]
}
