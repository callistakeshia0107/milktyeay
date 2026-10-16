import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { MENU, SIZES, TOPPINGS } from "../../menu.js";

const rp = (n) => "Rp" + n.toLocaleString("id-ID");
const fail = (error, status = 400) => NextResponse.json({ error }, { status });

export async function POST(req) {
  const { name, phone, note, items } = await req.json();
  if (!name?.trim() || !phone?.trim() || !Array.isArray(items) || !items.length) {
    return fail("Please add your name, phone number and at least one drink.");
  }

  // Prices are recalculated here from menu.js, so the browser can't change them.
  const clean = [];
  for (const i of items) {
    const drink = MENU.find((m) => m.id === i.id);
    const size = SIZES.find((s) => s.id === i.size);
    if (!drink || !size || !drink.prices[size.id]) {
      return fail("Something in your order is no longer on the menu. Please refresh the page.");
    }
    const tops = (Array.isArray(i.toppings) ? i.toppings : [])
      .map((id) => TOPPINGS.find((t) => t.id === id))
      .filter(Boolean);
    clean.push({
      name: drink.name,
      size: size.label,
      toppings: tops.map((t) => t.name),
      price: drink.prices[size.id] + tops.reduce((s, t) => s + t.price, 0),
      qty: Math.min(50, Math.max(1, Math.floor(Number(i.qty)) || 1)),
    });
  }
  const total = clean.reduce((s, i) => s + i.price * i.qty, 0);
  const code = "MY" + Math.floor(1000 + Math.random() * 9000);

  const { SUPABASE_URL: url, SUPABASE_SERVICE_ROLE_KEY: key } = process.env;
  if (!url || !key) return fail("Orders are not set up yet. Please contact the shop.", 500);

  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const { error } = await supabase.from("orders").insert({
    code, name: name.trim(), phone: phone.trim(), note: note?.trim() || null, items: clean, total,
  });
  if (error) {
    console.error(error);
    return fail("Could not save your order. Please try again.", 500);
  }

  // Optional Telegram alert (never blocks the order if it fails)
  const { TELEGRAM_BOT_TOKEN: t, TELEGRAM_CHAT_ID: c } = process.env;
  if (t && c) {
    const lines = clean.map(
      (i) => `${i.qty}x ${i.name} (${i.size}${i.toppings.length ? ", " + i.toppings.join(" + ") : ""})`
    );
    const text = `New order ${code}\n${name} - ${phone}\n\n${lines.join("\n")}\n\nTotal: ${rp(total)}` + (note ? `\nNote: ${note}` : "");
    fetch(`https://api.telegram.org/bot${t}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: c, text }),
    }).catch(() => {});
  }

  return NextResponse.json({ code, total });
}
