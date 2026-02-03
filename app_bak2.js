require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;

// =========================
// Response helpers (pattern กลาง)
// =========================
function ok(res, message = 'Success', data = null, code = 200) {
  return res.status(code).json({ status: true, message, data });
}
function fail(res, message = 'Fail', code = 400, data = null) {
  return res.status(code).json({ status: false, message, data });
}

// =========================
// Middleware
// =========================
app.use(express.json());

// =========================
// Schema & Model
// =========================
const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true },
    description: { type: String, default: '' },
  },
  { timestamps: true }
);

const Product = mongoose.model('Product', productSchema);

// =========================
// Routes
// =========================

// Health check
app.get('/', (req, res) => ok(res, 'API is running', { uptime: process.uptime() }));

// Create
app.post('/products', async (req, res, next) => {
  try {
    const saved = await new Product(req.body).save();
    return ok(res, 'Create product successful', saved, 201);
  } catch (err) {
    return next(err);
  }
});

// List
app.get('/products', async (req, res, next) => {
  try {
    const list = await Product.find().sort({ createdAt: -1 });
    return ok(res, 'Get products successful', list);
  } catch (err) {
    return next(err);
  }
});

// Get by id
app.get('/products/:id', async (req, res, next) => {
  try {
    const item = await Product.findById(req.params.id);
    if (!item) return fail(res, 'Product not found', 404, null);
    return ok(res, 'Get product successful', item);
  } catch (err) {
    return next(err);
  }
});

// Update
app.put('/products/:id', async (req, res, next) => {
  try {
    const updated = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updated) return fail(res, 'Product not found', 404, null);
    return ok(res, 'Update product successful', updated);
  } catch (err) {
    return next(err);
  }
});

// Delete
app.delete('/products/:id', async (req, res, next) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) return fail(res, 'Product not found', 404, null);
    return ok(res, 'Delete product successful', deleted);
  } catch (err) {
    return next(err);
  }
});

// 404 route (ถ้า path ไม่ตรง)
app.use((req, res) => {
  return fail(res, `Route not found: ${req.method} ${req.originalUrl}`, 404, null);
});

// =========================
// Error handler กลาง (สำคัญ)
// =========================
app.use((err, req, res, next) => {
  // Mongoose validation error
  if (err?.name === 'ValidationError') {
    return fail(res, err.message, 400, null);
  }

  // Invalid ObjectId
  if (err?.name === 'CastError') {
    return fail(res, 'Invalid id format', 400, null);
  }

  console.error('Unhandled error:', err);
  return fail(res, 'Internal server error', 500, null);
});

// =========================
// Connect DB & Start server
// =========================
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('Mongo connect error:', err);
    process.exit(1);
  });
