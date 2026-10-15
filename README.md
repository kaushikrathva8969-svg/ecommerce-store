# E-commerce Store (Node.js, Express, MongoDB)

A full-stack e-commerce web app. Customers can browse products, use a cart, place orders and pay online with Razorpay (test mode) or choose cash on delivery. Admins manage products and update order status.

## How this was built
The backend (Node, Express, MongoDB, JWT, Razorpay) was built step by step while
learning, with guidance from Claude (an AI assistant). The frontend pages
(HTML/CSS/JS) were created with Claude's help, and I reviewed and tested them.

## Features

**Customer**
- Register and log in (JWT authentication)
- Browse and search products, open a product details page
- Cart: add, change quantity (+/-), remove
- Checkout from the cart with a shipping address
- **Buy now** on the product page (orders one product and leaves the cart untouched)
- Pay online with Razorpay or choose **cash on delivery**
- My orders page with status badges, **Pay now** for unpaid online orders, and **Cancel order**

**Admin**
- Add, edit and delete products
- View all orders with customer details, payment method and shipping address
- Update order status: confirmed, shipped, delivered, cancelled

**Safety and correctness**
- Passwords hashed with bcrypt
- Protected routes (`protect`) and admin-only routes (`adminOnly`)
- Prices and totals are always read from the database, never from the browser
- Razorpay payment signature is verified on the server before an order is marked paid
- Order ownership checks, so a user can only pay for or cancel their own orders
- Stock checked when adding to the cart and when ordering, and reduced after payment (or at once for cash on delivery)
- Input validation and a JSON error handler on the backend
- User-supplied text is escaped before it is shown on the pages

## Tech stack

| Part | Technology |
|---|---|
| Backend | Node.js, Express 5 |
| Database | MongoDB Atlas, Mongoose |
| Auth | JSON Web Tokens, bcryptjs |
| Payments | Razorpay (test mode) |
| Frontend | HTML, CSS, JavaScript (no framework, no build step) |

## Project structure

```
backend/
  src/
    config/        database and Razorpay setup
    controllers/   request logic (auth, products, cart, orders, payment)
    middleware/    protect and adminOnly
    models/        User, Product, Cart, Order
    routes/        URL to controller mapping
    app.js         Express app
    server.js      connects to the database and starts the server
frontend/
  index.html  product.html  cart.html  orders.html
  admin.html  login.html  register.html  404.html
  css/style.css
  js/api.js      shared helpers (API address, token, requests)
```


## How it works

**Login:** the server checks the password and sends back a JWT. The frontend stores it and sends it as `Authorization: Bearer <token>` on protected requests. The `protect` middleware verifies it and attaches the user to the request.

**Online payment:**
1. The customer places an order (status `pending`).
2. The backend creates a Razorpay order using the total from the database.
3. The customer pays in the Razorpay popup.
4. The backend verifies the payment signature, then marks the order `paid` and reduces stock.

**Cash on delivery:** the order starts as `confirmed` and stock is reduced immediately. The admin moves it to `shipped` and `delivered`.

**Order status flow**

```
online: pending -> paid -> shipped -> delivered
cash on delivery: confirmed -> shipped -> delivered
cancelled: possible for pending and confirmed orders
```

## Run it locally

You need Node.js 18 or newer and a free MongoDB Atlas cluster.

**1. Backend**

```bash
cd backend
npm install
```

Copy `.env.example` to `.env` and fill it in:

| Variable | Meaning |
|---|---|
| `PORT` | Server port (default 8008) |
| `MONGO_URL` | MongoDB Atlas connection string |
| `JWT_SECRET` | Any long random text |
| `JWT_EXPIRES_IN` | Token lifetime, for example `7d` |
| `RAZORPAY_KEY_ID` | Razorpay test key id |
| `RAZORPAY_KEY_SECRET` | Razorpay test key secret |

```bash
npm run dev
```

You should see `MongoDB connected` and `Server running on http://localhost:8008`.

**2. Frontend**

The frontend is plain HTML. Open the `frontend` folder with the VS Code **Live Server** extension, or run `npx serve frontend`. The API address is set at the top of `frontend/js/api.js`.

**3. Make an admin**

New users are always customers. Register a user, then in MongoDB Atlas open the `users` collection and change that user's `role` from `customer` to `admin`.

**4. Test a payment**

Use Razorpay test mode with the test card `5267 3181 8797 5449`, any future expiry date, any CVV, and any OTP (for example `1111`). No real money is used.

## API

All routes start with `/api`. Routes marked **Login** need the `Authorization` header. Routes marked **Admin** also need an admin account.

| Method | Route | Access | Body |
|---|---|---|---|
| POST | `/auth/register` | Public | name, email, password |
| POST | `/auth/login` | Public | email, password |
| GET | `/products` | Public | |
| GET | `/products/:id` | Public | |
| POST | `/products` | Admin | name, description, price, category, stock, image |
| PUT | `/products/:id` | Admin | fields to change |
| DELETE | `/products/:id` | Admin | |
| GET | `/cart` | Login | |
| POST | `/cart` | Login | productId, quantity |
| PUT | `/cart` | Login | productId, quantity |
| DELETE | `/cart` | Login | productId |
| POST | `/orders` | Login | shippingAddress, paymentMethod (`online` or `cod`) |
| POST | `/orders/buy-now` | Login | productId, quantity, shippingAddress, paymentMethod |
| GET | `/orders` | Login | |
| PUT | `/orders/:id/cancel` | Login | |
| GET | `/orders/all` | Admin | |
| PUT | `/orders/:id/status` | Admin | status |
| POST | `/payment/create-order` | Login | orderId |
| POST | `/payment/verify` | Login | razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId |

## Known limitations

These are known and left out on purpose to keep the project small:

- Stock is not locked, so two people ordering the last item at the same moment could both succeed.
- If an admin sets an order to `cancelled` from the admin page, the stock is not restored. (A customer cancelling their own order does restore it.)
- Paid orders cannot be cancelled, because that would need a Razorpay refund.
- The shipping address is required by the forms but not enforced by the API.
- The login token is kept in `localStorage`, which can be read by injected scripts. HttpOnly cookies would be safer.
- Product images are links only, with no file upload.
- Search runs in the browser, not on the server, and there is no pagination.

## Ideas for later

- Razorpay refunds and stock locking
- Image upload, server-side search and pagination
- Order emails (Nodemailer) and API documentation (Swagger)
- Rate limiting on login, and a React version of the frontend