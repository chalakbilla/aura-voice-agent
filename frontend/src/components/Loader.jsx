import { Leaf } from "./Icons";

export default function Loader({ leaving }) {
  return (
    <div className={`loader ${leaving ? "leaving" : ""}`} role="status" aria-live="polite">
      <div className="loader-leaf">
        <Leaf size={64} />
      </div>
      <h1 className="loader-title">ARIA</h1>
      <p className="loader-sub">AI Voice Support · Aura Skincare</p>
      <div className="loader-bar"><span /></div>
      <p className="loader-hint">Getting Aria ready…</p>
      <p className="loader-tag">NATURAL. RADIANT. YOU.</p>
    </div>
  );
}
