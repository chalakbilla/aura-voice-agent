function Icon({ size = 18, children, ...rest }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...rest}>
      {children}
    </svg>
  );
}

export const Mic = (p) => (
  <Icon {...p}><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></Icon>
);
export const Truck = (p) => (
  <Icon {...p}><path d="M3 7h11v9H3zM14 10h4l3 3v3h-7" /><circle cx="7" cy="18" r="1.6" /><circle cx="17" cy="18" r="1.6" /></Icon>
);
export const Check = (p) => (
  <Icon {...p}><circle cx="12" cy="12" r="9" /><path d="M8 12.5l3 3 5-6" /></Icon>
);
export const Clock = (p) => (
  <Icon {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Icon>
);
export const Box = (p) => (
  <Icon {...p}><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9zM4 7.5l8 4.5 8-4.5M12 12v9" /></Icon>
);
export const Chat = (p) => (
  <Icon {...p}><path d="M4 5h16v11H9l-5 4z" /></Icon>
);
export const Bars = (p) => (
  <Icon {...p}><path d="M5 9v6M9 5v14M13 8v8M17 4v16M21 10v4" /></Icon>
);
export const Stop = (p) => (
  <Icon {...p}><rect x="6" y="6" width="12" height="12" rx="2" /></Icon>
);

export function Sparkle({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#e2767a" d="M12 2l2.2 7.8L22 12l-7.8 2.2L12 22l-2.2-7.8L2 12l7.8-2.2z" />
    </svg>
  );
}

// solid leaf with a light vein, used in the orb, the loader and the avatars
export function Leaf({ size = 24, className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path fill="currentColor" d="M20.5 3.5C11 3.5 4 8.5 4 16.5c0 2 .8 3.4 2 4.2 7 0 14.5-5.5 14.5-17.2z" />
      <path d="M6 20.5c1.5-5 5-9.5 10.5-12.5" fill="none" stroke="#eaf5ec" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

export function LeafOutline({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.5 3.5C11 3.5 4 8.5 4 16.5c0 2 .8 3.4 2 4.2 7 0 14.5-5.5 14.5-17.2z" />
      <path d="M3 22c2.5-6 7-11 14-15" />
    </svg>
  );
}

export function Sparkles({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <path fill="#1f7a3a" d="M13 3l2.6 8.4L24 14l-8.4 2.6L13 25l-2.6-8.4L2 14l8.4-2.6z" />
      <path fill="#2f9a4d" d="M25 18l1.2 3.8L30 23l-3.8 1.2L25 28l-1.2-3.8L20 23l3.8-1.2z" />
      <path fill="#e8924a" d="M26 3l.8 2.2L29 6l-2.2.8L26 9l-.8-2.2L23 6l2.2-.8z" />
    </svg>
  );
}

// the big glossy leaf inside the orb
export function LeafGlossy({ size = 130 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" aria-hidden="true">
      <defs>
        <linearGradient id="leafFill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#58b96b" />
          <stop offset="1" stopColor="#14502e" />
        </linearGradient>
      </defs>
      <path d="M100 14C52 14 18 40 18 80c0 10 4 17 10 21 36 0 72-28 72-87z" fill="url(#leafFill)" />
      <path d="M28 101C40 70 62 44 90 26" stroke="#dff3e2" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <g stroke="#c4e8cb" strokeWidth="1.4" strokeLinecap="round" opacity=".85" fill="none">
        <path d="M42 80L27 74M54 64L38 55M68 50L53 40" />
        <path d="M46 84L60 94M58 70L74 77M72 55L88 60" />
      </g>
    </svg>
  );
}

const LEAF = "M0 0C15-18 50-20 78 0C50 20 15 18 0 0z";

// a few leaves on a stem, used for the page and card decoration
export function Plant({ className, leaves, stem }) {
  const id = `g${(className || "p").replace(/\W/g, "")}`;
  return (
    <svg className={className} viewBox="0 0 260 520" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#5aa86a" />
          <stop offset="1" stopColor="#1f5a33" />
        </linearGradient>
      </defs>
      <path d={stem} fill="none" stroke="#3d7a4c" strokeWidth="3" strokeLinecap="round" />
      {leaves.map(([x, y, r, k], i) => (
        <g key={i} transform={`translate(${x} ${y}) rotate(${r}) scale(${k})`}>
          <path d={LEAF} fill={`url(#${id})`} opacity={0.9} />
          <path d="M0 0L74 0" stroke="#cfe9d4" strokeWidth="1.2" opacity=".7" />
        </g>
      ))}
    </svg>
  );
}

export const PLANT_LEFT = {
  stem: "M30 520C50 400 70 260 60 60",
  leaves: [
    [60, 70, -70, 1.1], [62, 130, 20, 1.2], [58, 190, -150, 1.3], [60, 250, 35, 1.4],
    [56, 310, -160, 1.4], [50, 380, 30, 1.3], [44, 450, -140, 1.2], [58, 100, -20, 0.9],
  ],
};

export const PLANT_RIGHT = {
  stem: "M230 520C200 440 190 340 215 240",
  leaves: [
    [214, 250, 200, 1.0], [210, 310, -20, 1.1], [205, 370, 190, 1.2], [200, 430, -30, 1.1], [212, 280, 160, 0.9],
  ],
};

export function Vase({ className }) {
  return (
    <svg className={className} viewBox="0 0 140 150" aria-hidden="true">
      <defs>
        <linearGradient id="vase" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#f3e3d3" />
          <stop offset="1" stopColor="#e2cdb8" />
        </linearGradient>
      </defs>
      <path d="M38 8C10 40 2 96 34 146h74c32-50 24-106-4-138z" fill="url(#vase)" />
    </svg>
  );
}
