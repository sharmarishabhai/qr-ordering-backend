import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, index: true },
  description: String,
  price: { type: Number, required: true, min: 0 },
  category: { type: String, required: true },
  imageUrl: String,
  tags: [String],
  isBestSeller: { type: Boolean, default: false },
  isSignature: { type: Boolean, default: false },
  isRecommended: { type: Boolean, default: false },
  isAvailable: { type: Boolean, default: true },
  preparationTime: { type: Number, default: 8 },
  sortOrder: { type: Number, default: 0 }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

productSchema.virtual("available").get(function available() {
  return this.isAvailable;
});

const categorySchema = new mongoose.Schema({
  name: String,
  slug: String,
  sortOrder: Number
}, { timestamps: true });

const auditSchema = new mongoose.Schema({
  order: mongoose.Schema.Types.ObjectId,
  product: mongoose.Schema.Types.ObjectId,
  action: String,
  from: mongoose.Schema.Types.Mixed,
  to: mongoose.Schema.Types.Mixed,
  by: String
}, { timestamps: true });

const settingSchema = new mongoose.Schema({ key: { type: String, unique: true }, value: mongoose.Schema.Types.Mixed });
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  passwordHash: String,
  role: { type: String, default: "admin" }
}, { timestamps: true });

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  name: String,
  price: Number,
  quantity: Number
}, { _id: false });

const statusEntrySchema = new mongoose.Schema({
  status: String,
  at: Date,
  by: String
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderNo: { type: String, unique: true },
  customerName: String,
  mobile: String,
  carNumber: String,
  customer: { name: String, mobile: String, carNumber: String },
  items: [orderItemSchema],
  subtotal: Number,
  total: Number,
  status: { type: String, default: "Pending", enum: ["Pending", "Confirmed", "Preparing", "Ready", "Completed", "Cancelled"] },
  source: { type: String, default: "qr" },
  statusHistory: [statusEntrySchema],
  history: [statusEntrySchema],
  staffNotes: String
}, { timestamps: true });

export const Product = mongoose.model("Product", productSchema);
export const Category = mongoose.model("Category", categorySchema);
export const Order = mongoose.model("Order", orderSchema);
export const User = mongoose.model("User", userSchema);
export const Setting = mongoose.model("Setting", settingSchema);
export const AuditLog = mongoose.model("AuditLog", auditSchema);
