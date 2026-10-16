// Edit this file to change what the shop sells. Prices are in rupiah.
// NOTE: the prices below are placeholders. Replace them with your real prices.

export const SHOP = {
  name: "Milktyeay",
  tagline: "Roasted jasmine milk tea, bottled and chilled.",
  notice: "Pre-order only. Watch @milktyeay on Instagram for the next batch dates.",
};

export const SIZES = [
  { id: "500", label: "500 ml" },
  { id: "1000", label: "1000 ml" },
];

export const TOPPINGS = [
  { id: "soya", name: "Soya bean curd", price: 5000 },
  { id: "taro", name: "Taro silky pudding", price: 6000 },
  { id: "grass", name: "Grass jelly", price: 4000 },
];

export const MENU = [
  {
    id: "roasted-jasmine",
    name: "Roasted Jasmine Milk Tea",
    desc: "Roasted jasmine tea with creamy milk. Best served chilled.",
    image: "/images/roasted-jasmine.jpg",
    prices: { "500": 35000, "1000": 65000 },
  },
  // To add a drink, copy the block above, give it a new id, name, image and prices.
];
