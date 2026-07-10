export default function Logo({ size = 'md' }) {
  const textSize = size === 'lg' ? 'text-3xl' : 'text-xl'
  const iconSize = size === 'lg' ? 24 : 18

  return (
    <span className="inline-flex items-center gap-2 font-display italic font-semibold text-ink">
      <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M6 2H14L20 8V20C20 21.1046 19.1046 22 18 22H6C4.89543 22 4 21.1046 4 20V4C4 2.89543 4.89543 2 6 2Z"
          stroke="#F0A34A"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path d="M14 2V8H20" stroke="#F0A34A" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
      <span className={textSize}>weekfold</span>
    </span>
  )
}