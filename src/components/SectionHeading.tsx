type Props = { eyebrow?: string; title: string; text?: string; center?: boolean; light?: boolean }

export default function SectionHeading({ eyebrow, title, text, center, light }: Props) {
  return (
    <div className={`max-w-2xl ${center ? 'mx-auto text-center' : ''}`}>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h2 className={`h2 mt-2 ${light ? 'text-white' : ''}`}>{title}</h2>
      {text && <p className={`mt-3 text-base leading-relaxed ${light ? 'text-white/75' : 'text-muted'}`}>{text}</p>}
    </div>
  )
}
