const SMALL_FONT_SIZE_MAP = new Map([
  [7, 10],
  [8, 11],
  [9, 12],
  [10, 13],
  [11, 14],
  [12, 15],
  [13, 15],
  [14, 16],
])

const EXACT_PIXEL_SIZE = /^(\d+(?:\.\d+)?)px$/

export function increaseSmallFontSize(value) {
  const match = EXACT_PIXEL_SIZE.exec(String(value).trim())
  if (!match) return value

  const size = Number(match[1])
  if (!Number.isFinite(size) || size > 14) return value

  const mappedSize = SMALL_FONT_SIZE_MAP.get(size)
  if (mappedSize) return `${mappedSize}px`

  if (size < 7) return '10px'
  if (size < 9) return '11px'
  if (size < 11) return '13px'
  if (size < 13) return '15px'
  return '16px'
}

export function readableTypographyPlugin() {
  const processedDeclarations = new WeakSet()

  return {
    postcssPlugin: 'mirizoom-readable-typography',
    Declaration(declaration) {
      if (processedDeclarations.has(declaration)) return
      processedDeclarations.add(declaration)

      if (declaration.prop !== 'font-size') return

      const sourceFile = declaration.source?.input?.file?.replaceAll('\\', '/')
      if (!sourceFile?.includes('/src/')) return

      declaration.value = increaseSmallFontSize(declaration.value)
    },
  }
}
