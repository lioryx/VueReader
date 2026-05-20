export interface ParsedChapter {
  title: string
  offset: number
  length: number
}

const CHAPTER_RE =
  /^(第[零一二三四五六七八九十百千万亿\d〇]+[章回节集卷篇].{0,30}|序章.*|楔子.*|尾声.*|番外.*|后记|前言|引子|序言|自序|附录.*)$/

export function parseChapters(text: string): ParsedChapter[] {
  const lines = text.split('\n')
  const chapters: ParsedChapter[] = []
  let offset = 0

  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed && CHAPTER_RE.test(trimmed)) {
      const last = chapters[chapters.length - 1]
      if (last !== undefined) last.length = offset - last.offset
      chapters.push({ title: trimmed, offset, length: 0 })
    }
    offset += line.length + 1
  }

  const first = chapters[0]
  if (first !== undefined && first.offset > 0) {
    const leadingText = text.slice(0, first.offset)
    if (leadingText.trim().length > 0) {
      chapters.unshift({ title: '前言', offset: 0, length: first.offset })
    }
  }

  const last = chapters[chapters.length - 1]
  if (last !== undefined) {
    last.length = text.length - last.offset
  } else {
    chapters.push({ title: '全文', offset: 0, length: text.length })
  }

  return chapters
}
