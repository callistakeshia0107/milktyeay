"use client";
import { useEffect, useState } from "react";
import { SHOP, SIZES, TOPPINGS, MENU } from "./menu";

const rp = (n) => "Rp" + n.toLocaleString("id-ID");

function Photo({ src, name, className }) {
  const [ok, setOk] = useState(true);
  if (!ok) return <div className={className + " ph"} aria-hidden="true">{name.charAt(0)}</div>;
  return <img className={className} src={src} alt={name} onError={() => setOk(false)} />;
}

function Sheet({ title, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);
  return (
    <div className="scrim" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <button className="close" onClick={onClose} aria-label="Close">×</button>
        {children}
      </div>
    </div>
  );
}

function Stepper({ qty, onChange }) {
  return (
    <div className="step">
      <button type="button" onClick={() => onChange(-1)} aria-label="One less">−</button>
      <b>{qty}</b>
      <button type="button" onClick={() => onChange(1)} aria-label="One more">+</button>
    </div>
  );
}

function ItemSheet({ item, onClose, onAdd }) {
  const [size, setSize] = useState(SIZES[0].id);
  const [tops, setTops] = useState([]);
  const [qty, setQty] = useState(1);
  const picked = TOPPINGS.filter((t) => tops.includes(t.id));
  const unit = item.prices[size] + picked.reduce((s, t) => s + t.price, 0);
  const toggle = (id) => setTops((t) => (t.includes(id) ? t.filter((x) => x !== id) : [...t, id]));
  const add = () =>
    onAdd({
      key: [item.id, size, ...[...tops].sort()].join("|"),
      itemId: item.id,
      name: item.name,
      size,
      sizeLabel: SIZES.find((s) => s.id === size).label,
      toppings: tops,
      toppingNames: picked.map((t) => t.name),
      unit,
      qty,
    });

  return (
    <Sheet title={item.name} onClose={onClose}>
      <Photo className="sheet-photo" src={item.image} name={item.name} />
      <div className="sheet-body">
        <h2>{item.name}</h2>
        <p className="ds">{item.desc}</p>
        <fieldset>
          <legend>Choose a size</legend>
          {SIZES.map((s) => (
            <label className="opt" key={s.id}>
              <input type="radio" name="size" checked={size === s.id} onChange={() => setSize(s.id)} />
              <span>{s.label}</span>
              <span className="amt">{rp(item.prices[s.id])}</span>
            </label>
          ))}
        </fieldset>
        <fieldset>
          <legend>Add-on toppings (optional)</legend>
          {TOPPINGS.map((t) => (
            <label className="opt" key={t.id}>
              <input type="checkbox" checked={tops.includes(t.id)} onChange={() => toggle(t.id)} />
              <span>{t.name}</span>
              <span className="amt">+{rp(t.price)}</span>
            </label>
          ))}
        </fieldset>
        <div className="foot">
          <Stepper qty={qty} onChange={(d) => setQty((q) => Math.max(1, q + d))} />
          <button className="btn" onClick={add}>
            <span>Add to order</span>
            <span>{rp(unit * qty)}</span>
          </button>
        </div>
      </div>
    </Sheet>
  );
}

function CartSheet({ cart, total, change, onClose, onPlaced }) {
  const [f, setF] = useState({ name: "", phone: "", note: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(null);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      const res = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...f,
          items: cart.map((c) => ({ id: c.itemId, size: c.size, toppings: c.toppings, qty: c.qty })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not send your order. Please try again.");
      setDone(data);
      onPlaced();
    } catch (x) {
      setErr(x.message);
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <Sheet title="Order received" onClose={onClose}>
        <div className="sheet-body">
          <h2>Order received</h2>
          <p className="ds">Your order code</p>
          <p className="code">{done.code}</p>
          <p>Total {rp(done.total)}. We will contact you on {f.phone} to confirm your order.</p>
          <button className="btn solo" onClick={onClose}>Back to menu</button>
        </div>
      </Sheet>
    );
  }

  return (
    <Sheet title="Your order" onClose={onClose}>
      <form className="sheet-body" onSubmit={submit}>
        <h2>Your order</h2>
        {cart.map((c) => (
          <div className="line" key={c.key}>
            <div>
              <b>{c.name}</b>
              <small>{[c.sizeLabel, ...c.toppingNames].join(", ")}</small>
              <small className="amt">{rp(c.unit * c.qty)}</small>
            </div>
            <Stepper qty={c.qty} onChange={(d) => change(c.key, d)} />
          </div>
        ))}
        <label className="field">Your name
          <input value={f.name} onChange={set("name")} autoComplete="name" required />
        </label>
        <label className="field">Phone number
          <input value={f.phone} onChange={set("phone")} type="tel" inputMode="tel" autoComplete="tel" required />
        </label>
        <label className="field">Note for the shop (optional)
          <textarea value={f.note} onChange={set("note")} rows={2} />
        </label>
        <div className="total"><span>Total</span><span>{rp(total)}</span></div>
        {err && <p className="err" role="alert">{err}</p>}
        <button className="btn solo" disabled={busy || !cart.length}>
          {busy ? "Sending..." : "Place order"}
        </button>
      </form>
    </Sheet>
  );
}

export default function Home() {
  const [cart, setCart] = useState([]);
  const [picking, setPicking] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);
  const count = cart.reduce((s, c) => s + c.qty, 0);
  const total = cart.reduce((s, c) => s + c.unit * c.qty, 0);

  const add = (line) => {
    setCart((c) =>
      c.some((x) => x.key === line.key)
        ? c.map((x) => (x.key === line.key ? { ...x, qty: x.qty + line.qty } : x))
        : [...c, line]
    );
    setPicking(null);
  };
  const change = (key, d) =>
    setCart((c) => c.map((x) => (x.key === key ? { ...x, qty: x.qty + d } : x)).filter((x) => x.qty > 0));

  return (
    <main>
      <header className="top">
        <div className="wrap">
          <h1 className="brand">{SHOP.name}</h1>
          <p className="tag">{SHOP.tagline}</p>
        </div>
      </header>
      <div className="po"><div className="wrap">{SHOP.notice}</div></div>

      <div className="wrap">
        <h2 className="menu-h">Menu</h2>
        <ul className="list">
          {MENU.map((item) => (
            <li key={item.id}>
              <button className="row" onClick={() => setPicking(item)}>
                <Photo className="thumb" src={item.image} name={item.name} />
                <span className="info">
                  <span className="nm">{item.name}</span>
                  <span className="ds">{item.desc}</span>
                  <span className="from">From {rp(Math.min(...Object.values(item.prices)))}</span>
                </span>
                <span className="plus" aria-hidden="true">+</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {count > 0 && (
        <button className="bar" onClick={() => setCartOpen(true)}>
          <span>View order ({count})</span>
          <span>{rp(total)}</span>
        </button>
      )}
      {picking && <ItemSheet item={picking} onClose={() => setPicking(null)} onAdd={add} />}
      {cartOpen && (
        <CartSheet
          cart={cart}
          total={total}
          change={change}
          onClose={() => setCartOpen(false)}
          onPlaced={() => setCart([])}
        />
      )}
    </main>
  );
}
