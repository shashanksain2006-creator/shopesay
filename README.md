# Shop Easy: online store (Node + Express + MongoDB + plain HTML/JS)

**Customers:** browse and search products, product pages, cart, checkout (Cash on Delivery), order history, cancel an order.
**Admin:** add / edit / delete products, manage stock, view all orders and set status (placed, shipped, delivered, cancelled), read contact messages, sales stats.
**Security:** bcrypt passwords, JWT login, prices and stock always checked on the server, Helmet, CORS, rate limiting, input validation.

```
shopeasy/
  backend/    -> Express API (deploy to Render)
  frontend/   -> static HTML/CSS/JS (deploy to Vercel)
```
Collections created automatically: `users`, `products`, `orders`, `contacts`.

> Online card/UPI payment is NOT included. Orders are Cash on Delivery. Razorpay or Stripe can be added later.

## 1. Install tools
- Node.js LTS https://nodejs.org (check: `node -v`, `npm -v`)
- VS Code https://code.visualstudio.com  (+ the "Live Server" extension)
- Git https://git-scm.com/downloads
- MongoDB Compass (optional) https://www.mongodb.com/try/download/compass
- Postman (optional) https://www.postman.com/downloads

## 2. Create the database (MongoDB Atlas, free)
1. Sign up at https://www.mongodb.com/cloud/atlas/register, create a project, then a free **M0** cluster.
2. **Database Access** -> Add user -> username + password (letters and numbers only). Role: read and write to any database.
3. **Network Access** -> Add IP -> Allow access from anywhere (0.0.0.0/0).
4. **Connect** -> Drivers -> copy the connection string and add the database name `shopeasy` before the `?`.

## 3. Run the backend
Terminal:
```
cd shopeasy/backend
npm install
cp .env.example .env         (Windows: copy .env.example .env)
```
Edit `.env`: set `MONGO_URI`, `JWT_SECRET` (generate with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`), and your own `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

Create your admin account and 12 sample products (run once):
```
npm run seed
```
Start the server:
```
npm run dev
```
Expect `MongoDB connected` and `Server running on port 5000`. Check http://localhost:5000/api/health

## 4. Run the frontend
In VS Code right-click `frontend/index.html` -> Open with Live Server (http://127.0.0.1:5500).
If your port differs, add it to `CLIENT_URL` in `.env` and restart the backend.
Log in with your admin email/password, then open **Admin** in the menu.

## 5. Test checklist (Postman base URL http://localhost:5000/api)
| Test | Expected |
|---|---|
| GET /products | 200, list of products |
| POST /auth/register (name, email, password 8+) | 201 + token |
| Same email again | 409 |
| POST /auth/login wrong password | 401 |
| POST /orders without token | 401 |
| POST /orders with token: `{"items":[{"productId":"<id>","quantity":1}],"shipping":{"fullName":"A B","phone":"9999999999","address":"12 Main Road","city":"Delhi","postalCode":"110001"}}` | 201, stock goes down by 1 |
| GET /orders/mine | your orders |
| PUT /orders/<id>/cancel | cancelled, stock restored |
| POST /products as normal user | 403 |
| POST /products as admin | 201 |
In the browser: add to cart, change quantity, checkout, view My Orders; as admin add/edit/delete a product and change an order status.

## 6. Deploy
**GitHub** (inside `shopeasy/`): `git init`, `git add .`, `git commit -m "Shop Easy"`, create an empty repo on GitHub, then `git remote add origin <url>`, `git branch -M main`, `git push -u origin main`. `.env` is git-ignored.

**Backend on Render** (https://render.com): New -> Web Service -> your repo. Root Directory `backend`, Build `npm install`, Start `npm start`.
Environment variables: `MONGO_URI`, `JWT_SECRET`, `NODE_ENV=production`, `CLIENT_URL` (your Vercel URL, no trailing slash). You do not need ADMIN_* on Render: run `npm run seed` locally against the same Atlas database.
Test `https://YOUR-API.onrender.com/api/health` (free plan sleeps; the first request can take ~50 seconds).

**Frontend on Vercel** (https://vercel.com): Add New -> Project -> repo, Root Directory `frontend`, Framework Other.
First edit `frontend/js/config.js` -> `API_URL = 'https://YOUR-API.onrender.com/api'`, commit and push. Then put the Vercel URL into Render `CLIENT_URL` and redeploy.

## 7. Troubleshooting
- `bad auth` -> wrong username or password in MONGO_URI.
- Timeout connecting to Atlas -> add 0.0.0.0/0 in Network Access.
- "Not allowed by CORS" or network errors -> `CLIENT_URL` must exactly match the site address (no trailing slash).
- "Cannot reach the server" -> backend not running or wrong `API_URL`.
- Admin menu missing after promoting a user -> log out and log in again.
- Product images: paste any image URL in the Admin form; without one an emoji placeholder is shown.

## Customise
Site name / currency: `frontend/js/config.js`. Colours: top of `frontend/css/style.css`. Sample products: `backend/seed.js`.
