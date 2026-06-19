export function Logo({ className = '' }: { className?: string }) {
  return (
    <div className={`logo-shell ${className}`}>
      <svg viewBox="0 0 200 200" aria-hidden="true" className="logo-mark">
        <defs>
          <linearGradient id="amiorGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#5b9bff" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
          <radialGradient id="amiorOrb" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.2" />
          </radialGradient>
        </defs>

        <circle cx="100" cy="100" r="62" className="logo-ring" />
        <path
          d="M44 154 L100 24 L156 154 L134 154 L100 68 L66 154 Z"
          className="logo-wing"
        />
        <circle cx="100" cy="100" r="24" className="logo-orb" />
      </svg>
      <span className="sr-only">Amior logo</span>
    </div>
  );
}
