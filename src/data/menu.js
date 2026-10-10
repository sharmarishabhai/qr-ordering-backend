const imageByCategory = {
  Puffs: "https://images.unsplash.com/photo-1620146344904-097a0002d797?auto=format&fit=crop&w=900&q=80",
  "Snacks / Rolls": "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=900&q=80",
  Croissants: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=900&q=80",
  Desserts: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=900&q=80",
  "Hot Coffee": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=900&q=80",
  "Cold Coffee": "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=900&q=80",
  Shakes: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=900&q=80",
  "Add On": "https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=900&q=80"
};

export const categories = [
  "Puffs", "Snacks / Rolls", "Croissants", "Desserts", "Hot Coffee", "Cold Coffee", "Shakes", "Add On"
].map((name, sortOrder) => ({ name, slug: slugify(name), sortOrder }));

const best = new Set(["Paneer Puff", "Chilli Paneer Puff", "Mexicana Paneer Roll", "Cappuccino", "Iced Latte", "Oreo Shake", "Chocolate Pastry"]);
const signature = new Set(["Corn Spinach Puff", "Broccoli Puff", "Caramel Macchiato", "Tiramisu Coffee", "Cold Tiramisu Coffee", "Hazelnut Frappe", "Cheese Cake"]);
const recommended = new Set(["Butter Croissant", "Chocolate Croissant", "Brownie Hazelnut", "Cold Brew Orange Flavour", "KitKat Shake"]);

const items = [
  ["Potato Veg Puff", 65, "Puffs", "Flaky bakery puff packed with seasoned potato masala."],
  ["Paneer Puff", 79, "Puffs", "Golden puff with soft paneer and cafe spices."],
  ["Mushroom Cheese Puff", 89, "Puffs", "Savory mushrooms, melted cheese, and crisp pastry layers."],
  ["Chilli Paneer Puff", 79, "Puffs", "Indo-Chinese paneer filling inside a buttery puff."],
  ["Corn Spinach Puff", 109, "Puffs", "Creamy corn and spinach baked into a rich puff."],
  ["Tomato Puff", 65, "Puffs", "Tangy tomato filling with classic bakery crunch."],
  ["Broccoli Puff", 139, "Puffs", "Premium broccoli and cheese style puff with a fresh bite."],
  ["Indian Paneer Roll", 89, "Snacks / Rolls", "Paneer roll with homestyle masala and soft wrap."],
  ["Multigrain Paneer Roll", 99, "Snacks / Rolls", "Wholesome multigrain wrap with spiced paneer."],
  ["Mexicana Paneer Roll", 109, "Snacks / Rolls", "Paneer wrap with Mexican-style seasoning and crunch."],
  ["Butter Croissant", 90, "Croissants", "Classic flaky butter croissant, baked fresh."],
  ["Chocolate Croissant", 99, "Croissants", "Layered croissant with a chocolate center."],
  ["Chocolate Pastry", 115, "Desserts", "Rich chocolate pastry for a sweet cafe finish."],
  ["Cheese Cake", 179, "Desserts", "Creamy cheesecake with a smooth dessert bite."],
  ["Brownie Walnut", 79, "Desserts", "Dense chocolate brownie with walnut crunch."],
  ["Brownie Hazelnut", 129, "Desserts", "Chocolate brownie lifted with hazelnut richness."],
  ["Danish", 99, "Desserts", "Light pastry danish with a bakery-style finish."],
  ["Espresso", 89, "Hot Coffee", "Bold and classic concentrated coffee shot."],
  ["Americano", 99, "Hot Coffee", "Pure, smooth black coffee with a clean finish."],
  ["Cappuccino", 129, "Hot Coffee", "Rich espresso, steamed milk, and velvet foam."],
  ["Cafe Latte", 139, "Hot Coffee", "Smooth and balanced espresso milk coffee."],
  ["Caramel Macchiato", 165, "Hot Coffee", "Sweet caramel layered with espresso and milk."],
  ["Tiramisu Coffee", 139, "Hot Coffee", "Creamy coffee with dessert-like tiramisu notes."],
  ["Hazelnut Coffee", 139, "Hot Coffee", "Nutty and smooth flavored coffee."],
  ["Vanilla Cappuccino", 139, "Hot Coffee", "Classic cappuccino with a vanilla twist."],
  ["Irish Cappuccino", 139, "Hot Coffee", "Rich, delightful Irish-style cappuccino."],
  ["Iced Americano", 119, "Cold Coffee", "Chilled black coffee, crisp and refreshing."],
  ["Iced Cappuccino", 159, "Cold Coffee", "Cool cappuccino with a creamy finish."],
  ["Iced Latte", 145, "Cold Coffee", "Smooth iced espresso and milk."],
  ["Iced Caramel Latte", 150, "Cold Coffee", "Iced latte sweetened with caramel notes."],
  ["Iced Mocha", 150, "Cold Coffee", "Chocolate and coffee blended over ice."],
  ["Cold Brew", 150, "Cold Coffee", "Bold slow-brewed coffee, served chilled."],
  ["Irish Frappe", 160, "Cold Coffee", "Creamy frappe with Irish-style flavor."],
  ["Cold Tiramisu Coffee", 180, "Cold Coffee", "Chilled coffee with a dessert-like tiramisu profile."],
  ["Hazelnut Frappe", 190, "Cold Coffee", "Nutty, creamy, and indulgent frappe."],
  ["Cold Brew Orange Flavour", 170, "Cold Coffee", "Cold brew brightened with citrus orange notes."],
  ["Cranberry", 170, "Cold Coffee", "Fruity, refreshing chilled cafe beverage."],
  ["Oreo Shake", 190, "Shakes", "Cookies and cream shake with Oreo crunch."],
  ["KitKat Shake", 190, "Shakes", "Chocolate wafer shake, rich and playful."],
  ["Chocolate Shake", 160, "Shakes", "Creamy chocolate shake for classic cravings."],
  ["Ice Cream Vanilla & Chocolate", 40, "Add On", "A scoop of vanilla or chocolate happiness."]
];

export const products = items.map(([name, price, category, description], sortOrder) => {
  const isBestSeller = best.has(name);
  const isSignature = signature.has(name);
  const isRecommended = recommended.has(name);
  const tags = [
    isBestSeller && "Best Seller",
    isSignature && "Signature",
    isRecommended && "Recommended",
    ["Hot Coffee", "Cold Coffee"].includes(category) && "Coffee"
  ].filter(Boolean);
  return {
    name,
    slug: slugify(name),
    description,
    price,
    category,
    imageUrl: imageByCategory[category],
    tags,
    isBestSeller,
    isSignature,
    isRecommended,
    isAvailable: true,
    preparationTime: category === "Add On" ? 2 : category.includes("Coffee") || category === "Shakes" ? 8 : 10,
    sortOrder
  };
});

function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
