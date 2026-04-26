export function detectAndDecode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  // UTF-8 BOM: EF BB BF
  if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    return new TextDecoder('utf-8').decode(buffer.slice(3))
  }
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buffer)
  } catch {
    return new TextDecoder('gb18030').decode(buffer)
  }
}

export function detectEncoding(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) return 'UTF-8 BOM'
  try {
    new TextDecoder('utf-8', { fatal: true }).decode(buffer)
    return 'UTF-8'
  } catch {
    return 'GB18030'
  }
}
