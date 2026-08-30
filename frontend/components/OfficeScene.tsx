/**
 * A small mockumentary-style desk scene: swivel chair, desk, monitor with a
 * radar sweep, keyboard, mouse, steaming coffee, desk lamp, a potted plant and
 * a wall clock. Pure decoration — theme colours via Tailwind fill/stroke utils.
 */
export function OfficeScene({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 440 260"
      role="img"
      aria-label="An office desk with a computer, coffee, a lamp and a swivel chair"
      className={`h-auto w-full ${className}`}
    >
      <g stroke="currentColor" className="text-ink" strokeWidth={3} strokeLinejoin="round" strokeLinecap="round">
        <line x1="12" y1="230" x2="428" y2="230" />

        {/* wall clock */}
        <g>
          <circle cx="402" cy="44" r="20" className="fill-cream" />
          <line x1="402" y1="44" x2="402" y2="32" />
          <line x1="402" y1="44" x2="411" y2="49" />
        </g>

        {/* potted plant */}
        <g>
          <path d="M28 150c8-26 2-44-6-56 16 4 24 20 22 40" className="fill-sage" />
          <path d="M40 150c-2-24 6-40 18-50-4 18-6 34-6 50" className="fill-sage" />
          <path d="M26 150h34l-5 34H31z" className="fill-stamp" />
        </g>

        {/* swivel chair */}
        <g>
          <animateTransform
            attributeName="transform"
            type="rotate"
            values="-1.5 131 210; 1.5 131 210; -1.5 131 210"
            dur="6s"
            repeatCount="indefinite"
          />
          <rect x="96" y="150" width="70" height="20" rx="8" className="fill-corp" />
          <path d="M104 150v-46c0-8 7-14 15-14h20c8 0 14 6 14 14v10" className="fill-corp-light" />
          <line x1="131" y1="170" x2="131" y2="204" />
          <path d="M104 210l27-8 27 8" />
          <circle cx="104" cy="212" r="4" className="fill-ink" />
          <circle cx="158" cy="212" r="4" className="fill-ink" />
        </g>

        {/* desk */}
        <rect x="150" y="150" width="264" height="16" rx="3" className="fill-manila" />
        <line x1="168" y1="166" x2="168" y2="228" />
        <line x1="396" y1="166" x2="396" y2="228" />
        <rect x="356" y="170" width="40" height="30" rx="2" className="fill-coffee" />
        <line x1="366" y1="185" x2="386" y2="185" />

        {/* desk lamp */}
        <g>
          <ellipse cx="182" cy="150" rx="16" ry="4" className="fill-corp" />
          <path d="M182 148l4-40 26-14" />
          <path d="M206 92l14 4-6 16-16-6z" className="fill-highlight" />
        </g>

        {/* monitor */}
        <g>
          <rect x="212" y="72" width="96" height="64" rx="5" className="fill-corp" />
          <rect x="220" y="80" width="80" height="48" rx="2" className="fill-interview" />
          <circle cx="260" cy="104" r="15" className="fill-none text-highlight" strokeWidth={2} />
          <line x1="260" y1="104" x2="260" y2="89" strokeWidth={2} className="text-highlight">
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 260 104"
              to="360 260 104"
              dur="2s"
              repeatCount="indefinite"
            />
          </line>
          <path d="M250 136h20l4 14h-28z" className="fill-corp-light" />
          <line x1="238" y1="150" x2="282" y2="150" />
        </g>

        {/* sticky note */}
        <rect x="296" y="66" width="26" height="24" rx="1" className="fill-highlight" transform="rotate(8 309 78)" />

        {/* keyboard + mouse */}
        <rect x="226" y="150" width="74" height="12" rx="2" className="fill-cream" />
        <line x1="234" y1="156" x2="292" y2="156" strokeWidth={2} />
        <ellipse cx="318" cy="156" rx="8" ry="6" className="fill-cream" />

        {/* stack of paper */}
        <g>
          <rect x="336" y="140" width="34" height="8" className="fill-cream" transform="rotate(-3 353 144)" />
          <rect x="338" y="134" width="34" height="8" className="fill-cream" transform="rotate(2 355 138)" />
        </g>

        {/* coffee mug + steam */}
        <g>
          <path d="M382 128h22v14a11 11 0 01-22 0z" className="fill-cream" />
          <path d="M404 130h5a5 5 0 010 10h-5" className="fill-none" />
          <rect x="382" y="128" width="22" height="4" className="fill-stamp" stroke="none" />
          <g className="text-faded" strokeWidth={2} strokeLinecap="round">
            <path d="M388 122c-3-4 3-6 0-10" className="animate-steam" />
            <path d="M398 122c-3-4 3-6 0-10" className="animate-steam [animation-delay:1s]" />
          </g>
        </g>
      </g>
    </svg>
  );
}
