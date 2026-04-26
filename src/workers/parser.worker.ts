import { detectAndDecode, detectEncoding } from '@/utils/encoding'
import { parseChapters, type ParsedChapter } from '@/utils/chapterParser'

export interface ParseResult {
  encoding: string
  text: string
  chapters: ParsedChapter[]
}

self.onmessage = (e: MessageEvent<ArrayBuffer>) => {
  const buffer = e.data
  const encoding = detectEncoding(buffer)
  const rawText = detectAndDecode(buffer)
  const text = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const chapters = parseChapters(text)
  const result: ParseResult = { encoding, text, chapters }
  self.postMessage(result)
}
