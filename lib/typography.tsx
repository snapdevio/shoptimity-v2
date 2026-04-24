export function formatTypography(text: string) {
  if (!text) return text

  const parts = text.split(/([%$₹€+\-])/g)

  return parts.map((part, i) => {
    if (/[%$₹€+\-]/.test(part)) {
      return (
        <span key={i} className="font-['Georgia']">
          {part}
        </span>
      )
    }

    return <span key={i}>{part}</span>
  })
}
