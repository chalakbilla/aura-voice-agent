import { useEffect, useRef } from "react";
import { Bars, Chat, Leaf } from "./Icons";

const STATUS_LINES = {
  listening: ["Aria is listening…", "Speak now"],
  thinking: ["Aria is thinking…", "One moment"],
  speaking: ["Aria is speaking…", "You can press Interrupt to cut in"],
};

export default function Conversation({ transcript, liveText, inCall, state }) {
  const listRef = useRef(null);

  // keep the newest message in view
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [transcript, liveText]);

  const empty = transcript.length === 0;
  const status = STATUS_LINES[state];

  return (
    <div className="convo">
      <div className="card-head">
        <h3><Chat size={22} /> Conversation log</h3>
        {inCall ? (
          <span className="live"><span className="dot" /> Live</span>
        ) : (
          !empty && <span className="ended">Call ended</span>
        )}
      </div>

      <div className="convo-body">
        {inCall && status && (
          <div className="status-row">
            <span className="status-icon"><Bars size={22} /></span>
            <div>
              <strong>{status[0]}</strong>
              <div className="muted">{status[1]}</div>
            </div>
          </div>
        )}

        {empty ? (
          <div className="status-row">
            <span className="status-icon grey">• • •</span>
            <div className="muted">
              No conversation yet.<br />Your voice queries will appear here.
            </div>
          </div>
        ) : (
          <div className="convo-list" ref={listRef}>
            {transcript.map((line, i) => (
              <div key={i} className={`msg ${line.role}`}>
                <span className="avatar">{line.role === "agent" ? <Leaf size={16} /> : "You"}</span>
                <div className="bubble">{line.text}</div>
              </div>
            ))}
            {liveText && (
              <div className="msg customer live">
                <span className="avatar">You</span>
                <div className="bubble">{liveText}…</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
