import { LeafGlossy, Mic, Sparkles, Sparkle, Stop } from "./Icons";
import Waveform from "./Waveform";

const PILL_TEXT = {
  idle: "Aria is ready",
  listening: "Aria is listening…",
  thinking: "Aria is thinking…",
  speaking: "Aria is speaking…",
};

const LABEL_TEXT = {
  idle: "Press Start Call to begin",
  listening: "Listening…",
  thinking: "Thinking…",
  speaking: "Speaking…",
};

export default function VoiceCard({ state, inCall, error, onStart, onEnd, onInterrupt }) {
  const talking = state === "listening" || state === "speaking";

  return (
    <div className="voice">
      <div className="voice-top">
        <div className={`status-pill ${state}`}>
          <span className="dot" />
          {PILL_TEXT[state]}
        </div>
        <div className="tagline"><Sparkles size={30} /> <span>Your voice,<br />our care.</span></div>
      </div>

      <div className="stage">
        <Waveform active={talking} />
        <div className={`orb ${state}`}>
          <div className="orb-halo" />
          <div className="orb-ring" />
          <div className="orb-core"><LeafGlossy size={150} /></div>
        </div>
        <Waveform active={talking} />
      </div>

      <h2 className="hello">Hi, I’m Aria <Sparkle size={26} /></h2>
      <p className="hello-sub">Your AI voice assistant for Aura Skincare</p>
      <p className="hello-help">
        Just speak naturally — I can help you with your orders, shipping, returns, cancellations or any other support.
      </p>

      <div className={`dots ${state}`} aria-hidden="true">
        {[0, 1, 2, 3, 4, 5, 6].map((i) => <span key={i} style={{ "--i": i }} />)}
      </div>
      <div className={`state-label ${state}`}>{LABEL_TEXT[state]}</div>

      <div className="actions">
        <button className="btn primary" onClick={onStart} disabled={inCall}>
          <Mic size={17} /> Start Call
        </button>
        <button className="btn danger" onClick={onEnd} disabled={!inCall}>
          <Stop size={16} /> End Call
        </button>
        {state === "speaking" && (
          <button className="btn ghost" onClick={onInterrupt}>Interrupt</button>
        )}
      </div>

      {error && <p className="error">{error}</p>}
    </div>
  );
}
