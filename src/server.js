import "dotenv/config";
import express from "express";
import http from "http";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import { connectDb } from "./db.js";
import { AuditLog, Category, Order, Product, Setting, User } from "./models.js";

const app = express();
const server = http.createServer(app);
const corsOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const corsOptions = {
  origin(origin, callback) {
    if (!origin || corsOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS blocked for origin ${origin}`));
  }
};
const io = new Server(server, { cors: corsOptions });
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: "1mb" }));
app.use("/api/orders", rateLimit({ windowMs: 60_000, max: 8 }));

function token(req, res, next) {
  try {
    const raw = req.headers.authorization?.replace("Bearer ", "");
    if (!raw) return res.status(401).json({ message: "Missing token" });
    req.user = jwt.verify(raw, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
}

const mobileOk = (m) => /^[6-9]\d{9}$/.test(String(m || ""));
const nextStatus = { Pending: ["Confirmed", "Cancelled"], Confirmed: ["Preparing"], Preparing: ["Ready"], Ready: ["Completed"] };

app.get("/api/health", (_, res) => res.json({ ok: true }));
app.get("/api/menu", async (_, res) => res.set("Cache-Control", "public, max-age=60").json(await Product.find().sort("sortOrder name")));
app.get("/api/categories", async (_, res) => res.json(await Category.find().sort("sortOrder name")));
app.get("/api/orders", async (req, res) => {
  const mobile = String(req.query.mobile || "").trim();
  if (!mobileOk(mobile)) return res.status(400).json({ message: "Valid Indian mobile number is required" });
  const orders = await Order.find({ mobile }).sort("-createdAt").limit(50);
  res.json(orders);
});
app.get("/api/orders/:orderNo", async (req, res) => {
  const order = await Order.findOne({ orderNo: req.params.orderNo });
  if (!order) return res.status(404).json({ message: "Order not found" });
  res.json(order);
});

app.post("/api/orders", async (req, res) => {
  const { customer = {}, items = [] } = req.body;
  if (!customer.name?.trim() || !mobileOk(customer.mobile)) return res.status(400).json({ message: "Valid name and Indian mobile number are required" });
  if (!Array.isArray(items) || !items.length) return res.status(400).json({ message: "Cart is empty" });
  const recentDuplicate = await Order.findOne({
    mobile: customer.mobile,
    createdAt: { $gte: new Date(Date.now() - 10_000) }
  });
  if (recentDuplicate) return res.status(409).json({ message: "Order already received. Please wait a moment." });
  const ids = items.map((i) => i.productId);
  const products = await Product.find({ _id: { $in: ids } });
  const byId = new Map(products.map((p) => [String(p._id), p]));
  const orderItems = [];
  for (const item of items) {
    const product = byId.get(String(item.productId));
    const quantity = Math.max(1, Math.min(20, Number(item.quantity || 1)));
    if (!product || !product.isAvailable) return res.status(400).json({ message: `${product?.name || "Item"} is unavailable` });
    orderItems.push({ product: product._id, name: product.name, price: product.price, quantity });
  }
  const total = orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const counter = await Setting.findOneAndUpdate({ key: "orderCounter" }, { $inc: { value: 1 } }, { new: true, upsert: true });
  const order = await Order.create({
    orderNo: `VPC-${counter.value}`,
    customerName: customer.name.trim(),
    mobile: customer.mobile,
    carNumber: customer.carNumber?.trim() || "",
    customer: { name: customer.name.trim(), mobile: customer.mobile, carNumber: customer.carNumber?.trim() || "" },
    items: orderItems,
    subtotal: total,
    total,
    source: "qr",
    statusHistory: [{ status: "Pending", at: new Date(), by: "customer" }],
    history: [{ status: "Pending", at: new Date(), by: "customer" }]
  });
  io.emit("new_order", order);
  res.status(201).json(order);
});

app.post("/api/auth/login", async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user || !(await bcrypt.compare(req.body.password || "", user.passwordHash))) return res.status(401).json({ message: "Invalid credentials" });
  res.json({ token: jwt.sign({ id: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "12h" }), user: { email: user.email, name: user.name, role: user.role } });
});
app.get("/api/auth/me", token, async (req, res) => {
  const user = await User.findById(req.user.id).select("name email role");
  res.json(user);
});

app.get("/api/admin/orders", token, async (_, res) => res.json(await Order.find().sort("-createdAt").limit(100)));
app.patch("/api/admin/orders/:id/status", token, async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: "Order not found" });
  const to = req.body.status;
  if (!nextStatus[order.status]?.includes(to)) return res.status(400).json({ message: `Cannot move ${order.status} to ${to}` });
  const from = order.status;
  order.status = to;
  order.statusHistory.push({ status: to, at: new Date(), by: req.user.email });
  order.history.push({ status: to, at: new Date(), by: req.user.email });
  await order.save();
  await AuditLog.create({ order: order._id, action: "status", from, to, by: req.user.email });
  io.emit("order_updated", order);
  res.json(order);
});
app.get("/api/admin/products", token, async (_, res) => res.json(await Product.find().sort("sortOrder name")));
app.post("/api/admin/products", token, async (req, res) => {
  const body = normalizeProduct(req.body);
  res.status(201).json(await Product.create(body));
});
app.patch("/api/admin/products/:id", token, async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, normalizeProduct(req.body), { new: true, runValidators: true });
  await AuditLog.create({ product: product._id, action: "product_update", by: req.user.email, to: req.body });
  res.json(product);
});
app.patch("/api/admin/products/:id/availability", token, async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, { isAvailable: Boolean(req.body.isAvailable ?? req.body.available) }, { new: true });
  await AuditLog.create({ product: product._id, action: "availability", by: req.user.email, to: product.isAvailable });
  res.json(product);
});
app.patch("/api/admin/products/:id/tags", token, async (req, res) => {
  const flags = {
    isBestSeller: Boolean(req.body.isBestSeller),
    isSignature: Boolean(req.body.isSignature),
    isRecommended: Boolean(req.body.isRecommended)
  };
  const tags = [flags.isBestSeller && "Best Seller", flags.isSignature && "Signature", flags.isRecommended && "Recommended"].filter(Boolean);
  const product = await Product.findByIdAndUpdate(req.params.id, { ...flags, tags }, { new: true });
  await AuditLog.create({ product: product._id, action: "tags", by: req.user.email, to: flags });
  res.json(product);
});
app.get("/api/admin/reports/daily", token, async (_, res) => {
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const orders = await Order.find({ createdAt: { $gte: start } });
  res.json({ date: start, orders: orders.length, revenue: orders.reduce((s, o) => s + o.total, 0), completed: orders.filter((o) => o.status === "Completed").length });
});

function normalizeProduct(body) {
  const isBestSeller = Boolean(body.isBestSeller);
  const isSignature = Boolean(body.isSignature);
  const isRecommended = Boolean(body.isRecommended);
  const tags = Array.isArray(body.tags) ? body.tags : [isBestSeller && "Best Seller", isSignature && "Signature", isRecommended && "Recommended"].filter(Boolean);
  return {
    ...body,
    slug: body.slug || String(body.name || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
    price: Number(body.price),
    imageUrl: body.imageUrl || body.image,
    isAvailable: Boolean(body.isAvailable ?? body.available ?? true),
    preparationTime: Number(body.preparationTime || body.prepTime || 8),
    isBestSeller,
    isSignature,
    isRecommended,
    tags
  };
}

connectDb()
  .then(() => server.listen(process.env.PORT || 5000, () => console.log(`API on http://localhost:${process.env.PORT || 5000}`)))
  .catch((error) => {
    console.error("MongoDB connection failed. Start MongoDB or set MONGO_URI in backend/.env.");
    console.error(error.message);
    process.exit(1);
  });
