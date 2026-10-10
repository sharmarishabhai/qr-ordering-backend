import "dotenv/config";
import bcrypt from "bcryptjs";
import { connectDb } from "./db.js";
import { Product, Category, User, Setting } from "./models.js";
import { products, categories } from "./data/menu.js";

await connectDb();
await Category.deleteMany({});
await Product.deleteMany({});
await Category.insertMany(categories);
await Product.insertMany(products);

const email = process.env.ADMIN_EMAIL || "admin@vegpuff.co";
const password = process.env.ADMIN_PASSWORD || "Admin@123";
await User.findOneAndUpdate(
  { email },
  { name: "VegPuff Admin", email, role: "admin", passwordHash: await bcrypt.hash(password, 10) },
  { upsert: true }
);
await Setting.findOneAndUpdate({ key: "orderCounter" }, { key: "orderCounter", value: 1000 }, { upsert: true });
console.log(`Seeded ${products.length} products. Admin: ${email} / ${password}`);
process.exit(0);
