// Small flat product scenes so the order list doesn't need photo files.
function Leaves({ x, y, flip }) {
  const s = flip ? -1 : 1;
  return (
    <g transform={`translate(${x} ${y}) scale(${s} 1)`} fill="#3f8f55">
      <ellipse cx="0" cy="-10" rx="3" ry="11" transform="rotate(-15)" />
      <ellipse cx="6" cy="-8" rx="3" ry="10" transform="rotate(25)" />
      <ellipse cx="-6" cy="-6" rx="3" ry="9" transform="rotate(-40)" />
    </g>
  );
}

function Orange({ cx, cy, r }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="#f08a24" />
      <circle cx={cx} cy={cy} r={r - 3} fill="#fbb85c" />
      <path d={`M${cx - r + 3} ${cy}H${cx + r - 3}M${cx} ${cy - r + 3}V${cy + r - 3}`} stroke="#fde3ad" strokeWidth="1.2" />
    </g>
  );
}

export default function ProductArt({ product = "" }) {
  const name = product.toLowerCase();
  let bg = ["#f9d3b0", "#f0a56a"];
  let art;

  if (name.includes("serum")) {
    art = (
      <>
        <Orange cx={18} cy={74} r={14} />
        <Orange cx={76} cy={72} r={12} />
        <rect x="32" y="30" width="26" height="42" rx="7" fill="#c9792a" />
        <rect x="32" y="30" width="9" height="42" rx="5" fill="#e69a45" opacity=".6" />
        <rect x="37" y="44" width="16" height="16" rx="2" fill="#fbeedc" />
        <rect x="39" y="22" width="12" height="10" rx="2" fill="#262626" />
        <rect x="41" y="10" width="8" height="14" rx="4" fill="#363636" />
      </>
    );
  } else if (name.includes("sunscreen")) {
    bg = ["#fbeadb", "#f1c8a0"];
    art = (
      <>
        <Leaves x={14} y={78} />
        <Leaves x={80} y={78} flip />
        <rect x="63" y="46" width="14" height="30" rx="3" fill="#e9812f" />
        <rect x="65" y="40" width="10" height="8" rx="2" fill="#fff" />
        <path d="M34 12h22l3 50H31z" fill="#fffaf2" stroke="#eadbc8" />
        <rect x="32" y="62" width="26" height="12" rx="3" fill="#e8742a" />
        <rect x="38" y="30" width="14" height="14" rx="3" fill="#f3b078" opacity=".8" />
      </>
    );
  } else {
    bg = ["#d7e9d2", "#a6cda3"];
    art = (
      <>
        <rect x="8" y="64" width="16" height="16" rx="3" fill="#ecd9c4" />
        <rect x="68" y="64" width="16" height="16" rx="3" fill="#ecd9c4" />
        <Leaves x={16} y={66} />
        <Leaves x={76} y={66} flip />
        <rect x="33" y="22" width="26" height="52" rx="7" fill="#2f7d47" />
        <rect x="33" y="22" width="9" height="52" rx="5" fill="#5bb273" opacity=".55" />
        <rect x="39" y="12" width="14" height="11" rx="2" fill="#1d2a22" />
        <rect x="38" y="42" width="16" height="14" rx="2" fill="#eef7ef" />
      </>
    );
  }

  return (
    <svg className="product-art" viewBox="0 0 92 92" role="img" aria-label={product}>
      <defs>
        <linearGradient id={`bg-${name.length}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={bg[0]} />
          <stop offset="1" stopColor={bg[1]} />
        </linearGradient>
      </defs>
      <rect width="92" height="92" rx="12" fill={`url(#bg-${name.length})`} />
      {art}
    </svg>
  );
}
