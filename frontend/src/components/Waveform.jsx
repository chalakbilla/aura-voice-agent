const SHAPE = [6, 12, 22, 34, 48, 72, 48, 34, 22, 12, 6];

export default function Waveform({ active }) {
  return (
    <div className={`wave ${active ? "active" : ""}`} aria-hidden="true">
      {SHAPE.map((h, i) => (
        <span key={i} style={{ "--h": `${h}px`, "--d": `${Math.abs(5 - i) * 0.1}s` }} />
      ))}
    </div>
  );
}
