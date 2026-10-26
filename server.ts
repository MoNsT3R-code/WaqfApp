import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import session from "express-session";
import cookieParser from "cookie-parser";
import { createAgents, type ChatTurn } from "./server/agent/index.ts";
import { lahoreMarketplace, LIMITS, findMenuItem } from "./shared/marketplace.ts";
import { createPlanService, PlanError } from "./server/plan/service.ts";
import { audit, auditFor, verifyAudit } from "./server/security/audit.ts";
import { checkPin, remember, replay } from "./server/security/pin.ts";
import { BREACHMIRROR_URL, breachMirrorStatus, isSecurityQuestion } from "./server/integrations/breachmirror.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const JWT_SECRET = process.env.JWT_SECRET || "waqf_super_secret_key_123";

  app.use(express.json());
  app.use(cookieParser());
  
  // Session config for iframes
  app.use(session({
    secret: "waqf_session_secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: true,
      sameSite: "none",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24h
    }
  }));

  // Mock Database
  const demoUserTemplate = {
    id: "1",
    email: "demo@waqf.com",
    username: "waqf_user",
    phone: "+923000000000",
    password: await bcrypt.hash("password123", 10),
    name: "Waqf Demo User",
    balance: 1250500.00,
    currency: "PKR",
    isVerified: true,
    twoFactorEnabled: false,
    twoFactorSecret: "123456",
    role: "user"
  };

  const users = [{ ...demoUserTemplate }];

  // --- API Routes ---

  // Auth: Guest session (login/register panel removed; app opens straight to the dashboard)
  app.post("/api/auth/guest", (req, res) => {
    let user = users.find(u => u.id === demoUserTemplate.id);
    if (!user) {
      // The demo account was deleted; recreate it so the app can still open
      user = { ...demoUserTemplate };
      users.push(user);
    }
    const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "24h" });
    const { password: _, ...userWithoutPassword } = user;
    res.json({ token, user: userWithoutPassword });
  });

  // Middleware: Auth Check
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ message: "No session" });

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.status(403).json({ message: "Invalid session" });
      req.user = user;
      next();
    });
  };

  const transactions = [
    { id: "t1", userId: "1", amount: -125000.00, merchant: "Apple Store", category: "Technology", date: new Date().toISOString() },
    { id: "t2", userId: "1", amount: -4500.50, merchant: "Gloria Jean's", category: "Food & Drink", date: new Date(Date.now() - 3600000).toISOString() },
    { id: "t3", userId: "1", amount: 250000.00, merchant: "Monthly Salary", category: "Income", date: new Date(Date.now() - 86400000).toISOString() },
    { id: "t4", userId: "1", amount: -12000.00, merchant: "Daraz Shopping", category: "Shopping", date: new Date(Date.now() - 172800000).toISOString() },
    { id: "t5", userId: "1", amount: -210000.00, merchant: "Housing Rent", category: "Housing", date: new Date(Date.now() - 432000000).toISOString() }
  ];

  const advisorFeedback: any[] = [];
  const feedbacks: any[] = [];

  // --- API Routes ---

  // User: Delete Account
  app.delete("/api/user/account", (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: "No session" });
    
    try {
      const token = authHeader.split(" ")[1];
      const decoded: any = jwt.verify(token, JWT_SECRET);
      const index = users.findIndex(u => u.id === decoded.userId);
      if (index !== -1) {
        users.splice(index, 1);
        return res.json({ message: "Account deleted successfully" });
      }
      res.status(404).json({ message: "User not found" });
    } catch (e) {
      res.status(401).json({ message: "Invalid session" });
    }
  });

  // Records a ledger entry for the signed-in user
  const addTransaction = (userId: string, amount: number, merchant: string, category: string) => {
    const transaction = {
      id: Math.random().toString(36).substr(2, 9),
      userId,
      amount,
      merchant,
      category,
      date: new Date().toISOString()
    };
    transactions.unshift(transaction);
    audit(userId, amount < 0 ? "payment" : "money_in", { merchant, amount, category });
    return transaction;
  };

  // A positive PKR amount with at most two decimals, or null
  const parseAmount = (value: unknown) => {
    const n = Number(value);
    return Number.isFinite(n) && n > 0 && n <= 10_000_000 ? Math.round(n * 100) / 100 : null;
  };

  // A whole count between 1 and max, or null
  const parseCount = (value: unknown, max: number) => {
    const n = Number(value);
    return Number.isInteger(n) && n >= 1 && n <= max ? n : null;
  };

  const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

  // Feedback: Get All
  app.get("/api/feedback", (req, res) => {
    res.json(feedbacks);
  });

  // Feedback: Add (author comes from the session, not the request)
  app.post("/api/feedback", authenticateToken, (req: any, res) => {
    const user = users.find(u => u.id === req.user.userId);
    const content = typeof req.body.content === "string" ? req.body.content.trim() : "";
    const rating = parseCount(req.body.rating, 5);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (!content || content.length > 1000 || !rating) {
      return res.status(400).json({ message: "A review needs text (up to 1,000 characters) and a rating from 1 to 5" });
    }
    const newFeedback = {
      id: Math.random().toString(36).substr(2, 9),
      userId: user.id,
      username: user.username,
      content,
      rating,
      date: new Date().toISOString()
    };
    feedbacks.unshift(newFeedback);
    res.json(newFeedback);
  });

  // Feedback: Edit (only the author's own review)
  app.put("/api/feedback/:id", authenticateToken, (req: any, res) => {
    const feedback = feedbacks.find(f => f.id === req.params.id);
    if (!feedback) return res.status(404).json({ message: "Feedback not found" });
    if (feedback.userId !== req.user.userId) return res.status(403).json({ message: "You can only edit your own review" });
    const content = typeof req.body.content === "string" ? req.body.content.trim() : "";
    const rating = parseCount(req.body.rating, 5);
    if (!content || content.length > 1000 || !rating) {
      return res.status(400).json({ message: "A review needs text (up to 1,000 characters) and a rating from 1 to 5" });
    }
    feedback.content = content;
    feedback.rating = rating;
    feedback.date = new Date().toISOString();
    res.json(feedback);
  });

  // Marketplace (Lahore): restaurants with menus, hotels, flights from Lahore, trip deals
  const marketplace = lahoreMarketplace;

  app.get("/api/marketplace", (req, res) => {
    res.json(marketplace);
  });

  // Portfolio (cart) of hotels and flights; prices come from the marketplace, never the request
  type CartItem = {
    cartId: string; type: "Hotel" | "Flight"; itemId: string; name: string;
    price: number; unit: "night" | "passenger"; quantity: number; checkIn?: string;
  };
  const carts: Record<string, CartItem[]> = {};
  const cartOf = (userId: string) => (carts[userId] ||= []);

  const todayIso = () => new Date().toISOString().slice(0, 10);
  const parseCheckIn = (value: unknown) =>
    typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !isNaN(Date.parse(value)) && value >= todayIso() ? value : null;

  app.get("/api/cart", authenticateToken, (req: any, res) => {
    res.json(cartOf(req.user.userId));
  });

  app.post("/api/cart/add", authenticateToken, (req: any, res) => {
    const { type, itemId } = req.body;
    const cart = cartOf(req.user.userId);
    let entry: Omit<CartItem, "cartId" | "quantity"> | null = null;
    let max = 1;

    if (type === "Hotel") {
      const hotel = marketplace.hotels.find(h => h.id === itemId);
      const checkIn = parseCheckIn(req.body.checkIn);
      if (!hotel || !checkIn) return res.status(400).json({ message: "Choose a hotel and a check-in date from today" });
      entry = { type, itemId: hotel.id, name: hotel.name, price: hotel.pricePerNight, unit: "night", checkIn };
      max = LIMITS.nights;
    } else if (type === "Flight") {
      const flight = marketplace.flights.find(f => f.id === itemId);
      if (!flight) return res.status(400).json({ message: "Flight not found" });
      entry = { type, itemId: flight.id, name: `${flight.airline}, ${flight.from.city} to ${flight.to.city}`, price: flight.farePerPassenger, unit: "passenger" };
      max = LIMITS.passengers;
    } else {
      return res.status(400).json({ message: "Only hotels and flights can be added to the portfolio" });
    }

    const quantity = parseCount(req.body.quantity ?? 1, max);
    if (!quantity) return res.status(400).json({ message: `Choose between 1 and ${max}` });

    const existing = cart.find(i => i.type === entry!.type && i.itemId === entry!.itemId && i.checkIn === entry!.checkIn);
    if (existing) existing.quantity = Math.min(max, existing.quantity + quantity);
    else cart.push({ ...entry, quantity, cartId: Math.random().toString(36).substr(2, 9) });
    res.json(cart);
  });

  // Quantity 0 removes the item
  app.put("/api/cart/update", authenticateToken, (req: any, res) => {
    const cart = cartOf(req.user.userId);
    const item = cart.find(i => i.cartId === req.body.cartId);
    if (!item) return res.status(404).json({ message: "Item not found" });
    const max = item.unit === "night" ? LIMITS.nights : LIMITS.passengers;
    const quantity = Number(req.body.quantity);
    if (quantity === 0) carts[req.user.userId] = cart.filter(i => i.cartId !== item.cartId);
    else if (parseCount(quantity, max)) item.quantity = quantity;
    else return res.status(400).json({ message: `Choose between 1 and ${max}` });
    res.json(cartOf(req.user.userId));
  });

  app.post("/api/cart/remove", authenticateToken, (req: any, res) => {
    carts[req.user.userId] = cartOf(req.user.userId).filter(i => i.cartId !== req.body.cartId);
    res.json(carts[req.user.userId]);
  });

  // Settle every item in the portfolio and empty it
  app.post("/api/cart/checkout", authenticateToken, async (req: any, res) => {
    if (req.user.role === "admin") return res.status(403).json({ message: "Admin is read-only" });
    const items = cartOf(req.user.userId);
    if (items.length === 0) return res.status(400).json({ message: "Portfolio is empty" });
    const newTransactions = items.map(item =>
      addTransaction(
        req.user.userId,
        -(item.price * item.quantity),
        item.type === "Hotel"
          ? `Stay at ${item.name}, ${plural(item.quantity, "night")} from ${item.checkIn}`
          : `Flight ${item.name}, ${plural(item.quantity, "passenger")}`,
        "Travel"
      )
    );
    carts[req.user.userId] = [];
    res.json({ message: "Portfolio settled", transactions: newTransactions, budget: await plans.afterSpend(req.user.userId) });
  });

  // Hotel booking: rate × nights
  app.post("/api/bookings/hotel", authenticateToken, async (req: any, res) => {
    if (req.user.role === "admin") return res.status(403).json({ message: "Admin is read-only" });
    const hotel = marketplace.hotels.find(h => h.id === req.body.hotelId);
    const checkIn = parseCheckIn(req.body.checkIn);
    const nights = parseCount(req.body.nights, LIMITS.nights);
    if (!hotel || !checkIn || !nights) {
      return res.status(400).json({ message: `Choose a hotel, a check-in date from today and 1 to ${LIMITS.nights} nights` });
    }
    const transaction = addTransaction(req.user.userId, -(hotel.pricePerNight * nights), `Stay at ${hotel.name}, ${plural(nights, "night")} from ${checkIn}`, "Travel");
    res.json({ message: "Booking confirmed", transaction, budget: await plans.afterSpend(req.user.userId) });
  });

  // Flight booking: fare × passengers
  app.post("/api/bookings/flight", authenticateToken, async (req: any, res) => {
    if (req.user.role === "admin") return res.status(403).json({ message: "Admin is read-only" });
    const flight = marketplace.flights.find(f => f.id === req.body.flightId);
    const passengers = parseCount(req.body.passengers, LIMITS.passengers);
    if (!flight || !passengers) return res.status(400).json({ message: `Choose a flight and 1 to ${LIMITS.passengers} passengers` });
    const transaction = addTransaction(
      req.user.userId,
      -(flight.farePerPassenger * passengers),
      `Flight ${flight.from.code} to ${flight.to.code}, ${flight.airline}, ${plural(passengers, "passenger")}`,
      "Travel"
    );
    res.json({ message: "Flight booked", transaction, budget: await plans.afterSpend(req.user.userId) });
  });

  // Trip deal booking
  app.post("/api/bookings/package", authenticateToken, async (req: any, res) => {
    if (req.user.role === "admin") return res.status(403).json({ message: "Admin is read-only" });
    const deal = marketplace.packages.find(p => p.id === req.body.packageId);
    if (!deal) return res.status(400).json({ message: "Trip deal not found" });
    const transaction = addTransaction(req.user.userId, -deal.price, `Trip deal: ${deal.name}`, "Travel");
    res.json({ message: "Trip deal booked", transaction, budget: await plans.afterSpend(req.user.userId) });
  });

  // Food order: dishes priced from the menu, minimum order checked, delivery fee added
  app.post("/api/food/order", authenticateToken, async (req: any, res) => {
    if (req.user.role === "admin") return res.status(403).json({ message: "Admin is read-only" });
    const restaurant = marketplace.restaurants.find(r => r.id === req.body.restaurantId);
    if (!restaurant) return res.status(400).json({ message: "Restaurant not found" });
    const lines: { name: string; price: number; quantity: number }[] = [];
    for (const line of Array.isArray(req.body.items) ? req.body.items : []) {
      const dish = findMenuItem(restaurant, line?.id);
      const quantity = parseCount(line?.quantity, LIMITS.dishQuantity);
      if (!dish) return res.status(400).json({ message: "The basket has a dish that is not on the menu" });
      if (!quantity) return res.status(400).json({ message: `Choose between 1 and ${LIMITS.dishQuantity} of ${dish.name}` });
      lines.push({ name: dish.name, price: dish.price, quantity });
    }
    if (lines.length === 0) return res.status(400).json({ message: "The basket is empty" });

    const subtotal = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
    if (subtotal < restaurant.minOrder) {
      return res.status(400).json({ message: `${restaurant.name} has a minimum order of PKR ${restaurant.minOrder.toLocaleString("en-US")}` });
    }
    const total = subtotal + restaurant.deliveryFee;
    const count = lines.reduce((sum, l) => sum + l.quantity, 0);
    const transaction = addTransaction(req.user.userId, -total, `Order from ${restaurant.name} (${plural(count, "item")})`, "Food");
    res.json({ message: "Order placed", transaction, subtotal, deliveryFee: restaurant.deliveryFee, total, budget: await plans.afterSpend(req.user.userId) });
  });

  // User Profile (never the password hash)
  app.get("/api/user/profile", authenticateToken, (req: any, res) => {
    const user = users.find(u => u.id === req.user.userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    const { password: _, ...profile } = user;
    res.json(profile);
  });

  // Transactions
  app.get("/api/transactions", authenticateToken, (req: any, res) => {
    if (req.user.role === "admin") {
      return res.json(transactions); // Admin sees all
    }
    const userTransactions = transactions.filter(t => t.userId === req.user.userId);
    res.json(userTransactions);
  });

  // Dashboard Summary
  app.get("/api/dashboard/summary", authenticateToken, (req: any, res) => {
    const user = users.find(u => u.id === req.user.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const userTransactions = req.user.role === "admin" ? transactions : transactions.filter(t => t.userId === req.user.userId);
    const currentBalance = user.balance + userTransactions.reduce((acc, t) => acc + t.amount, 0);
    const monthlyIncome = user.role === "admin" ? 0 : 350000.00;
    const monthlyExpenses = user.role === "admin" ? 0 : 180000.00;

    res.json({
      totalBalance: currentBalance,
      monthlyIncome,
      monthlyExpenses,
      // Computed from the two figures above so the screen's numbers agree
      savingsRate: monthlyIncome ? (monthlyIncome - monthlyExpenses) / monthlyIncome : 0,
      creditScore: 785,
      investmentValue: 5450000.75,
      performance: [
        { month: "Jan", balance: 1100000 },
        { month: "Feb", balance: 1150000 },
        { month: "Mar", balance: 1180000 },
        { month: "Apr", balance: currentBalance }
      ]
    });
  });

  // Text fields from forms: trimmed, capped, never empty
  const parseText = (value: unknown, max = 80) => {
    const text = typeof value === "string" ? value.trim().slice(0, max) : "";
    return text || null;
  };

  const LEDGER_CATEGORIES = ["General", "Shopping", "Food", "Bills", "Income"];

  // Simulation: Add Transaction (Income adds to the balance; other categories are spending)
  app.post("/api/transactions/add", authenticateToken, async (req: any, res) => {
    if (req.user.role === "admin") return res.status(403).json({ message: "Admin is read-only" });
    const merchant = parseText(req.body.merchant);
    const category = LEDGER_CATEGORIES.includes(req.body.category) ? req.body.category : null;
    const amount = parseAmount(Math.abs(Number(req.body.amount)));
    if (!merchant || !category || !amount) return res.status(400).json({ message: "Enter a description, a category and an amount above zero" });
    const transaction = addTransaction(req.user.userId, category === "Income" ? amount : -amount, merchant, category);
    res.json({ message: "Transaction added successfully", transaction, budget: category === "Income" ? null : await plans.afterSpend(req.user.userId) });
  });

  /**
   * Money that leaves the budget or adds debt needs the PIN. Replays of the same
   * request number return the first answer, so a double tap never acts twice.
   * Returns true when the handler may go ahead.
   */
  const pinGate = (req: any, res: any, action: string) => {
    const prior = replay(req.user.userId, req.body.requestId);
    if (prior) { res.status(prior.status).json(prior.body); return false; }
    const pin = checkPin(req.user.userId, req.body.pin, action);
    if (pin.ok === false) {
      res.status(403).json({ message: pin.message, pinError: pin.reason, triesLeft: pin.triesLeft });
      return false;
    }
    return true;
  };
  const answer = (req: any, res: any, status: number, body: unknown) => {
    remember(req.user.userId, req.body.requestId, status, body);
    res.status(status).json(body);
  };

  // Simulation: Send Money (PIN)
  app.post("/api/transactions/transfer", authenticateToken, async (req: any, res) => {
    if (req.user.role === "admin") return res.status(403).json({ message: "Admin is read-only" });
    const to = parseText(req.body.to);
    const amount = parseAmount(req.body.amount);
    if (!to || !amount) return res.status(400).json({ message: "Enter a recipient and an amount above zero" });
    if (!pinGate(req, res, "transfer")) return;
    const transaction = addTransaction(req.user.userId, -amount, `Transfer to ${to}`, "Transfer");
    answer(req, res, 200, { message: "Transfer successful", transaction, budget: await plans.afterSpend(req.user.userId) });
  });

  // Simulation: Utility Bill Payment
  app.post("/api/bills/pay", authenticateToken, async (req: any, res) => {
    if (req.user.role === "admin") return res.status(403).json({ message: "Admin is read-only" });
    const provider = parseText(req.body.provider, 40);
    const consumerId = parseText(req.body.consumerId, 40);
    const amount = parseAmount(req.body.amount);
    if (!provider || !consumerId || !amount) return res.status(400).json({ message: "Enter a provider, a consumer number and an amount above zero" });
    const transaction = addTransaction(req.user.userId, -amount, `${provider} Bill - ${consumerId}`, "Bills");
    res.json({ message: "Bill paid successfully", transaction, budget: await plans.afterSpend(req.user.userId) });
  });

  // Simulation: ReadyCash Loan (the pre-approved limit is set here, not by the request)
  const READY_CASH_LIMIT = 15000;
  app.post("/api/loans/readycash", authenticateToken, (req: any, res) => {
    if (req.user.role === "admin") return res.status(403).json({ message: "Admin is read-only" });
    if (!pinGate(req, res, "quick_loan")) return;
    const transaction = addTransaction(req.user.userId, READY_CASH_LIMIT, "ReadyCash Credit Line", "Loan");
    answer(req, res, 200, { message: "Credit limit disbursed", transaction });
  });

  // Simulation: Mobile Load
  app.post("/api/mobile/load", authenticateToken, async (req: any, res) => {
    if (req.user.role === "admin") return res.status(403).json({ message: "Admin is read-only" });
    const operator = parseText(req.body.operator, 20);
    const mobileNumber = parseText(req.body.mobileNumber, 20);
    const amount = parseAmount(req.body.amount);
    if (!operator || !mobileNumber || !amount) return res.status(400).json({ message: "Enter an operator, a mobile number and an amount above zero" });
    const transaction = addTransaction(req.user.userId, -amount, `${operator} Load - ${mobileNumber}`, "Mobile Load");
    res.json({ message: "Top-up successful", transaction, budget: await plans.afterSpend(req.user.userId) });
  });

  // Admin Only: All Emails / Accounts
  app.get("/api/admin/accounts", authenticateToken, (req: any, res) => {
    if (req.user.role !== "admin") return res.status(403).json({ message: "Access denied" });
    res.json(users.map(u => ({ email: u.email, username: u.username, role: u.role, id: u.id })));
  });

  // --- RAG Agents (LangChain + LangGraph over docs/faq and docs/policies, no API key) ---
  const agents = createAgents(__dirname);

  // --- Smart Spend & Save (the monthly split, budget warnings, the limit decision) ---
  const plans = createPlanService({ kb: agents.kb, transactionsOf: userId => transactions.filter(t => t.userId === userId) });

  const planError = (res: any, e: any) => {
    if (e instanceof PlanError) return res.status(400).json({ message: e.message });
    console.error("[Plan]", e);
    res.status(500).json({ message: "Smart Spend & Save is unavailable" });
  };

  // The plan, its figures, any waiting decision, and the latest salary as the suggested deposit
  app.get("/api/plan", authenticateToken, (req: any, res) => {
    const salary = transactions.find(t => t.userId === req.user.userId && t.category === "Income");
    res.json({ ...plans.dashboard(req.user.userId), suggestedDeposit: salary?.amount ?? 100000 });
  });

  app.post("/api/plan/start", authenticateToken, (req: any, res) => {
    try { res.json(plans.start(req.user.userId, req.body || {})); } catch (e) { planError(res, e); }
  });

  app.put("/api/plan/settings", authenticateToken, async (req: any, res) => {
    try { res.json(await plans.settings(req.user.userId, req.body || {})); } catch (e) { planError(res, e); }
  });

  // The answer to the waiting step of the limit decision; confirming a move needs the PIN
  app.post("/api/plan/respond", authenticateToken, async (req: any, res) => {
    const value = typeof req.body?.value === "string" ? req.body.value.slice(0, 40) : "";
    if (!value) return res.status(400).json({ message: "Choose an option." });
    const prior = replay(req.user.userId, req.body.requestId);
    if (prior) return res.status(prior.status).json(prior.body);
    if (plans.waitingStep(req.user.userId) === "confirm" && value === "confirm") {
      const pin = checkPin(req.user.userId, req.body.pin, "savings_move");
      if (pin.ok === false) {
        audit(req.user.userId, "transfer_denied", { reason: pin.reason });
        return res.status(403).json({ message: pin.message, pinError: pin.reason, triesLeft: pin.triesLeft });
      }
    }
    try { answer(req, res, 200, await plans.respond(req.user.userId, value)); } catch (e) { planError(res, e); }
  });

  // A move from savings outside the limit decision (Savings screen, instead of a Quick Loan)
  app.post("/api/plan/move", authenticateToken, (req: any, res) => {
    try {
      plans.previewMove(req.user.userId, req.body?.amount);
      if (!pinGate(req, res, "savings_move")) return;
      answer(req, res, 200, plans.moveSavings(req.user.userId, req.body?.amount));
    } catch (e) { planError(res, e); }
  });

  app.post("/api/plan/preview-move", authenticateToken, (req: any, res) => {
    try { res.json(plans.previewMove(req.user.userId, req.body?.amount)); } catch (e) { planError(res, e); }
  });

  // "Thinking of buying something?"
  app.post("/api/plan/check", authenticateToken, (req: any, res) => {
    try { res.json(plans.check(req.user.userId, typeof req.body?.text === "string" ? req.body.text.slice(0, 80) : "")); } catch (e) { planError(res, e); }
  });

  // Budget impact of a payment before it is made (Send Money, Bills)
  app.post("/api/plan/impact", authenticateToken, (req: any, res) => {
    const amount = parseAmount(req.body?.amount);
    res.json({ impact: amount ? plans.impact(req.user.userId, amount) : null });
  });

  // --- Security Center: the user's audit trail, its chain, and BreachMirror AI's status ---
  app.get("/api/security/audit", authenticateToken, (req: any, res) => {
    res.json({ entries: auditFor(req.user.userId, 60), chain: verifyAudit() });
  });

  app.get("/api/security/breachmirror", authenticateToken, async (req: any, res) => {
    res.json(await breachMirrorStatus(PORT));
  });

  app.get("/api/agent/status", (req, res) => {
    res.json(agents.status());
  });

  // Help Center assistant
  app.post("/api/agent/chat", authenticateToken, async (req: any, res) => {
    const { message, history, lang } = req.body;
    if (typeof message !== "string" || !message.trim() || message.length > 500) {
      return res.status(400).json({ message: "Question must be between 1 and 500 characters" });
    }
    const turns: ChatTurn[] = (Array.isArray(history) ? history : [])
      .filter((t: any) => (t?.role === "user" || t?.role === "ai") && typeof t.content === "string")
      .slice(-10)
      .map((t: any) => ({ role: t.role, content: t.content.slice(0, 2000) }));
    try {
      const result = await agents.chat(message.trim(), turns, typeof lang === "string" ? lang : "en");
      let escalation = null;
      if (result.generatedBy === "none" && isSecurityQuestion(message)) {
        const status = await breachMirrorStatus(PORT);
        if (status.connected) escalation = { url: BREACHMIRROR_URL, label: "Ask BreachMirror AI's Security Team" };
      }
      if (result.redacted) audit(req.user.userId, "assistant_redacted", {});
      res.json({ ...result, escalation });
    } catch (e: any) {
      console.error("[Agent] Chat failed:", e);
      res.status(500).json({ message: "Assistant unavailable" });
    }
  });

  // Money Helper: analyses the signed-in user's own ledger on the server
  app.post("/api/agent/advisor", authenticateToken, async (req: any, res) => {
    const user = users.find(u => u.id === req.user.userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    const userTransactions = transactions.filter(t => t.userId === user.id);
    const balance = user.balance + userTransactions.reduce((acc, t) => acc + t.amount, 0);
    try {
      res.json(await agents.advise(userTransactions, balance, typeof req.body?.lang === "string" ? req.body.lang : "en"));
    } catch (e: any) {
      console.error("[Agent] Advisor failed:", e);
      res.status(500).json({ message: "Advisor unavailable" });
    }
  });

  // --- Vite / Static Handling ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      // The live-reload socket gets its own port per app port, so two dev servers don't clash on 24678
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR === "true" ? false : { port: PORT + 21678 } },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Waqf Server] Running on http://localhost:${PORT}`);
  });
}

startServer();
