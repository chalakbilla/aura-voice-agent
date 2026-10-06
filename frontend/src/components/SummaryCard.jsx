import { pretty } from "../format";

const STATUS_COLOR = {
  RESOLVED: "green",
  POLICY_DECLINED: "orange",
  OUT_OF_SCOPE: "blue",
  UNRESOLVED: "grey",
  INCOMPLETE: "grey",
};

export default function SummaryCard({ summary, loading }) {
  return (
    <section className="card">
      <div className="card-head">
        <h3>Post-call summary</h3>
      </div>

      {loading && <p className="muted">Putting your summary together…</p>}

      {!loading && summary?.error && <p className="error">{summary.error}</p>}

      {!loading && summary && !summary.error && (
        <>
          <div className="sum-grid">
            <div>
              <small>Intent</small>
              <strong>{pretty(summary.customer_intent)}</strong>
            </div>
            <div>
              <small>Order</small>
              <strong>{summary.order_id || "None"}</strong>
            </div>
            <div>
              <small>Status</small>
              <span className={`status ${STATUS_COLOR[summary.resolution_status] || "grey"}`}>
                {pretty(summary.resolution_status)}
              </span>
            </div>
          </div>
          <p className="sum-text">{summary.call_summary}</p>
          <pre className="json">{JSON.stringify(summary, null, 2)}</pre>
        </>
      )}
    </section>
  );
}
