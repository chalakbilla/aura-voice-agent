import { useEffect, useState } from "react";
import { getOrders } from "./api";
import { useVoiceCall } from "./hooks/useVoiceCall";
import { Plant, PLANT_LEFT, Vase } from "./components/Icons";
import Loader from "./components/Loader";
import Header from "./components/Header";
import VoiceCard from "./components/VoiceCard";
import Conversation from "./components/Conversation";
import SummaryCard from "./components/SummaryCard";
import OrdersCard from "./components/OrdersCard";
import TrySaying from "./components/TrySaying";

const MIN_SPLASH_MS = 1800; // show the loader long enough to feel intentional
const MAX_WAIT_MS = 6000; // but never hang on a slow backend

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export default function App() {
  const call = useVoiceCall();
  const [orders, setOrders] = useState({});
  const [online, setOnline] = useState(true);
  const [phase, setPhase] = useState("loading"); // loading -> leaving -> done

  useEffect(() => {
    let alive = true;

    const ordersLoaded = getOrders()
      .then((data) => {
        if (!alive) return;
        setOrders(data);
        setOnline(true);
      })
      .catch(() => alive && setOnline(false));

    window.speechSynthesis?.getVoices(); // warm up the voice list

    Promise.all([Promise.race([ordersLoaded, wait(MAX_WAIT_MS)]), wait(MIN_SPLASH_MS)]).then(() => {
      if (!alive) return;
      setPhase("leaving");
      setTimeout(() => alive && setPhase("done"), 500);
    });

    return () => {
      alive = false;
    };
  }, []);

  return (
    <>
      {phase !== "done" && <Loader leaving={phase === "leaving"} />}

      <Plant className="decor decor-plant" {...PLANT_LEFT} />
      <Vase className="decor decor-vase" />

      <div className="shell">
        <Header online={online} />

        <main className="grid">
          <div className="col">
            <section className="card main">
              <VoiceCard
                state={call.state}
                inCall={call.inCall}
                error={call.error}
                onStart={call.start}
                onEnd={call.end}
                onInterrupt={call.interrupt}
              />
              <Conversation
                transcript={call.transcript}
                liveText={call.liveText}
                inCall={call.inCall}
                state={call.state}
              />
            </section>

            {(call.summaryLoading || call.summary) && (
              <SummaryCard summary={call.summary} loading={call.summaryLoading} />
            )}
          </div>

          <aside className="col">
            <OrdersCard orders={orders} failed={!online} />
            <TrySaying />
          </aside>
        </main>
      </div>
    </>
  );
}
