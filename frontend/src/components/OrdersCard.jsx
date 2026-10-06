import { Box, Check, Clock, Truck } from "./Icons";
import ProductArt from "./ProductArt";

const STATUS = {
  "Out for Delivery": { color: "blue", Icon: Truck },
  Delivered: { color: "green", Icon: Check },
  Processing: { color: "orange", Icon: Clock },
  Cancelled: { color: "grey", Icon: Clock },
};

export default function OrdersCard({ orders, failed }) {
  const rows = Object.entries(orders);

  return (
    <section className="card">
      <div className="card-head">
        <h3><Box size={20} /> Your Orders</h3>
      </div>

      {failed && rows.length === 0 && <p className="muted">Couldn’t load the sample orders. Please refresh.</p>}

      <ul className="orders">
        {rows.map(([id, o]) => {
          const meta = STATUS[o.status] || STATUS.Cancelled;
          return (
            <li key={id} className="order">
              <ProductArt product={o.product} />
              <div className="order-main">
                <strong>{id}</strong>
                <span>{o.product}</span>
                <b>₹{o.value}</b>
              </div>
              <div className="order-side">
                <span className={`status ${meta.color}`}>
                  <meta.Icon size={14} /> {o.status}
                </span>
                <span>{o.notes}</span>
                {o.tracking_id && <span>{o.carrier} · {o.tracking_id}</span>}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
