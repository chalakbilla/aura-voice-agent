import { Bars, Mic, Plant, PLANT_RIGHT, Sparkles } from "./Icons";

const PHRASES = [
  "Where is my order ORD-101?",
  "I got ORD-102 two weeks ago and opened it, can I return it?",
  "Cancel ORD-103",
  "Check order ORD-999",
  "Book me a flight to Goa",
];

export default function TrySaying() {
  return (
    <section className="card say">
      <Plant className="say-plant" {...PLANT_RIGHT} />

      <div className="say-head">
        <Sparkles size={38} />
        <div>
          <h3>Try saying</h3>
          <p className="muted">Here are some things you can ask Aria.</p>
        </div>
        <span className="say-wave"><Bars size={34} /></span>
      </div>

      <ul className="say-list">
        {PHRASES.map((p) => (
          <li key={p}>
            <span className="say-mic"><Mic size={18} /></span>
            <span className="say-text">“{p}”</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
