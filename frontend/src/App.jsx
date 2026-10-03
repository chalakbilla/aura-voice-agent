import { useEffect, useRef, useState } from "react";
import { sendChat, getSummary, getOrders } from "./api";

const GREETING = "Hi, this is Aria from Aura Skincare. How can I help you today?";
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

const STATE_LABELS = {
  idle: "Idle",
  listening: "Listening",
  thinking: "Thinking",
  speaking: "Speaking",
};

export default function App() {
  const [state, setState] = useState("idle");
  const [transcript, setTranscript] = useState([]);
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [orders, setOrders] = useState({});
  const [liveText, setLiveText] = useState("");
  const [error, setError] = useState("");
  const [inCall, setInCall] = useState(false);

  const activeRef = useRef(false);
  const recRef = useRef(null);
  const contextRef = useRef(null); // conversation state the backend hands back each turn
  const transcriptRef = useRef([]); // what we show / summarise

  useEffect(() => {
    getOrders().then(setOrders).catch(() => {});
    window.speechSynthesis?.getVoices(); // warm up voice list
  }, []);

  function addLine(role, text) {
    transcriptRef.current = [...transcriptRef.current, { role, text }];
    setTranscript(transcriptRef.current);
  }

  function speak(text) {
    return new Promise((resolve) => {
      if (!activeRef.current) return resolve();
      setState("speaking");
      const u = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();
      const voice = voices.find((v) => v.lang === "en-IN") || voices.find((v) => v.lang.startsWith("en"));
      if (voice) u.voice = voice;
      u.lang = "en-IN";
      u.rate = 1.05;
      u.onend = resolve;
      u.onerror = resolve;
      window.speechSynthesis.speak(u);
    });
  }

  function listen() {
    if (!activeRef.current) return;
    const rec = new SpeechRecognition();
    rec.lang = "en-IN";
    rec.interimResults = true;
    rec.continuous = false;

    let finalText = "";
    let confidence = 1;

    rec.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) {
          finalText += r[0].transcript;
          confidence = r[0].confidence;
        } else {
          interim += r[0].transcript;
        }
      }
      setLiveText(finalText + interim);
    };

    rec.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        setError("Microphone access is blocked. Please allow it and start the call again.");
        endCall();
      }
    };

    rec.onend = () => {
      setLiveText("");
      if (!activeRef.current) return;
      const text = finalText.trim();
      if (text) handleUser(text, confidence);
      else setTimeout(listen, 200); // silence, just keep listening
    };

    recRef.current = rec;
    setState("listening");
    try {
      rec.start();
    } catch {
      setTimeout(listen, 300);
    }
  }

  async function agentSays(text) {
    addLine("agent", text);
    await speak(text);
    listen();
  }

  async function handleUser(text, confidence) {
    addLine("customer", text);

    // low confidence -> ask to repeat without calling the LLM
    if (confidence > 0 && confidence < 0.45) {
      await agentSays("Sorry, I couldn't catch that clearly. Could you please repeat?");
      return;
    }

    setState("thinking");

    let answer;
    try {
      const data = await sendChat(text, contextRef.current);
      contextRef.current = data.context;
      answer = data.reply || "Sorry, could you say that again?";
    } catch {
      answer = "Sorry, I'm having a little trouble right now. Could you say that again?";
    }
    if (!activeRef.current) return;

    await agentSays(answer);
  }

  async function startCall() {
    if (!SpeechRecognition) {
      setError("This browser doesn't support speech recognition. Please use Chrome or Edge.");
      return;
    }
    setError("");
    setSummary(null);
    contextRef.current = null;
    transcriptRef.current = [];
    setTranscript([]);
    activeRef.current = true;
    setInCall(true);
    await agentSays(GREETING);
  }

  async function endCall() {
    if (!activeRef.current) return;
    activeRef.current = false;
    setInCall(false);
    try {
      recRef.current?.abort();
    } catch {}
    window.speechSynthesis.cancel();
    setState("idle");
    setLiveText("");

    const lines = transcriptRef.current;
    if (lines.length === 0) return;
    setSummaryLoading(true);
    try {
      setSummary(await getSummary(lines, contextRef.current));
    } catch {
      setSummary({ error: "Could not generate summary." });
    }
    setSummaryLoading(false);
  }

  function interrupt() {
    window.speechSynthesis.cancel(); // onend fires and we go back to listening
  }

  return (
    <div className="page">
      <header>
        <h1>Aria · Aura Skincare</h1>
        <p>Voice support agent. Allow the microphone, press Start Call and talk. Use Chrome or Edge.</p>
      </header>

      <div className="layout">
        <section className="card call">
          <div className={`pill ${state}`}>{STATE_LABELS[state]}</div>

          <div className="buttons">
            <button className="start" onClick={startCall} disabled={inCall}>
              Start Call
            </button>
            <button className="end" onClick={endCall} disabled={!inCall}>
              End Call
            </button>
            {state === "speaking" && <button onClick={interrupt}>Interrupt</button>}
          </div>

          {error && <p className="error">{error}</p>}
          {liveText && <p className="live">You: {liveText}…</p>}

          <h3>Call log</h3>
          <div className="log">
            {transcript.length === 0 && <p className="muted">No conversation yet.</p>}
            {transcript.map((l, i) => (
              <p key={i} className={l.role}>
                <b>{l.role === "agent" ? "Aria" : "Customer"}:</b> {l.text}
              </p>
            ))}
          </div>
        </section>

        <aside className="card">
          <h3>Test orders</h3>
          {Object.entries(orders).map(([id, o]) => (
            <div key={id} className="order">
              <b>{id}</b> · {o.customer}
              <br />
              {o.product} · ₹{o.value}
              <br />
              <span className="status">{o.status}</span> · {o.notes}
              {o.tracking_id && <> · {o.carrier} {o.tracking_id}</>}
            </div>
          ))}
          <h3>Try saying</h3>
          <ul className="muted">
            <li>"Where is my order ORD-101?"</li>
            <li>"I got ORD-102 two weeks ago and opened it, can I return it?"</li>
            <li>"Cancel ORD-103"</li>
            <li>"Check order ORD-999"</li>
            <li>"Book me a flight to Goa"</li>
          </ul>
        </aside>
      </div>

      {(summaryLoading || summary) && (
        <section className="card">
          <h3>Post-call summary</h3>
          {summaryLoading ? <p>Generating summary…</p> : <pre>{JSON.stringify(summary, null, 2)}</pre>}
        </section>
      )}
    </div>
  );
}
