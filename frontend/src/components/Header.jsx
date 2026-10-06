import { useEffect, useState } from "react";
import { Leaf, LeafOutline } from "./Icons";

function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export default function Header({ online }) {
  const now = useClock();
  const weekday = now.toLocaleDateString("en-US", { weekday: "short" });
  const month = now.toLocaleDateString("en-US", { month: "short" });
  const date = `${weekday}, ${now.getDate()} ${month} ${now.getFullYear()}`;
  const time = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  return (
    <header className="topbar">
      <div className="brand">
        <span className="brand-mark"><LeafOutline size={62} /></span>
        <div>
          <div className="brand-name">ARIA</div>
          <div className="brand-sub">AI Voice Support</div>
        </div>
      </div>

      <div className="welcome">
        Always here to listen.<br />Just speak naturally.
      </div>

      <div className="partner">
        <div className="partner-logo">
          <span className="partner-mark"><Leaf size={22} /></span>
          <div>
            <div className="partner-name">AURA SKINCARE</div>
            <div className="partner-tag">NATURAL. RADIANT. YOU.</div>
          </div>
        </div>
        <div className={`online ${online ? "" : "off"}`}>
          <span className="dot" />
          {online ? "Online" : "Offline"}
        </div>
        <div className="clock">
          <small>{date}</small>
          <span>{time}</span>
        </div>
      </div>
    </header>
  );
}
