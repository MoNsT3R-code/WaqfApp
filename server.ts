import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import session from "express-session";
import cookieParser from "cookie-parser";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;
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
  const ADMIN_EMAIL = "m.sehar2004@gmail.com";
  const ADMIN_PASS_RAW = "mm.mmm123M^";

  const users = [
    {
      id: "admin-1",
      email: ADMIN_EMAIL,
      username: "application_owner",
      phone: "+92", // Generic admin phone
      password: await bcrypt.hash(ADMIN_PASS_RAW, 10),
      name: "Application Owner",
      balance: 0,
      currency: "PKR",
      isVerified: true,
      twoFactorEnabled: true,
      twoFactorSecret: "123456",
      role: "admin"
    },
    {
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
    }
  ];

  const pendingVerifications: Record<string, string> = {};

  // --- API Routes ---

  // Auth: Register
  app.post("/api/auth/register", async (req, res) => {
    const { email, phone, username, password } = req.body;
    
    // Check if user exists
    if (users.find(u => u.email === email || u.username === username)) {
      return res.status(400).json({ message: "Identity already exists in system" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    const newUser = {
      id: (users.length + 1).toString(),
      email,
      phone,
      username,
      password: hashedPassword,
      name: username,
      balance: 50000.00, // Starting balance
      currency: "PKR",
      isVerified: false,
      twoFactorEnabled: false,
      twoFactorSecret: "123456", // Default secret for all users
      role: "user"
    };

    users.push(newUser);
    pendingVerifications[email] = verificationCode;
    
    console.log(`[AUTH] Verification code for ${email}: ${verificationCode}`);
    res.json({ message: "Registration successful. Verification code sent to your Gmail/Phone.", email });
  });

  // Auth: Verify
  app.post("/api/auth/verify", (req, res) => {
    const { email, code } = req.body;
    if (pendingVerifications[email] === code) {
      const user = users.find(u => u.email === email);
      if (user) user.isVerified = true;
      delete pendingVerifications[email];
      res.json({ message: "Account verified successfully" });
    } else {
      res.status(400).json({ message: "Invalid verification code" });
    }
  });

  // Auth: Login
  app.post("/api/auth/login", async (req, res) => {
    const { identity, password } = req.body; 
    const user = users.find(u => u.email === identity || u.username === identity);
    
    if (user && await bcrypt.compare(password, user.password)) {
      if (!user.isVerified) {
        return res.status(403).json({ message: "Account pending verification", status: "unverified", email: user.email });
      }

      // Force 2FA for admin
      if (user.role === "admin" || user.twoFactorEnabled) {
        return res.json({ status: "2fa_required", userId: user.id });
      }

      const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "24h" });
      const { password: _, ...userWithoutPassword } = user;
      res.json({ token, user: userWithoutPassword });
    } else {
      res.status(401).json({ message: "Access denied. Invalid credentials." });
    }
  });

  // Auth: Verify 2FA
  app.post("/api/auth/2fa/verify", (req, res) => {
    const { userId, code } = req.body;
    const user = users.find(u => u.id === userId);
    
    if (user && user.twoFactorSecret === code) {
      const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "24h" });
      const { password: _, ...userWithoutPassword } = user;
      res.json({ token, user: userWithoutPassword });
    } else {
      res.status(401).json({ message: "Invalid 2FA code" });
    }
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
  const carts: Record<string, any[]> = {};

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

  // Feedback: Get All
  app.get("/api/feedback", (req, res) => {
    res.json(feedbacks);
  });

  // Feedback: Add
  app.post("/api/feedback", (req, res) => {
    const { userId, username, content, rating } = req.body;
    const newFeedback = {
      id: Math.random().toString(36).substr(2, 9),
      userId,
      username: username || "Anonymous",
      content,
      rating: rating || 5,
      date: new Date().toISOString()
    };
    feedbacks.unshift(newFeedback);
    res.json(newFeedback);
  });

  // Feedback: Edit
  app.put("/api/feedback/:id", (req, res) => {
    const { id } = req.params;
    const { content, rating } = req.body;
    const feedback = feedbacks.find(f => f.id === id);
    if (feedback) {
      feedback.content = content;
      feedback.rating = rating;
      feedback.date = new Date().toISOString();
      return res.json(feedback);
    }
    res.status(404).json({ message: "Feedback not found" });
  });

  // Cart: Get
  app.get("/api/cart/:userId", (req, res) => {
    const { userId } = req.params;
    res.json(carts[userId] || []);
  });

  // Cart: Add
  app.post("/api/cart/add", (req, res) => {
    const { userId, item } = req.body;
    if (!carts[userId]) carts[userId] = [];
    
    const existing = carts[userId].find(i => i.id === item.id);
    if (existing) {
      existing.quantity = (existing.quantity || 1) + 1;
    } else {
      carts[userId].push({ ...item, quantity: 1, cartId: Math.random().toString(36).substr(2, 9) });
    }
    res.json(carts[userId]);
  });

  // Cart: Update/Edit quantity
  app.put("/api/cart/update", (req, res) => {
    const { userId, cartId, quantity } = req.body;
    if (carts[userId]) {
      const item = carts[userId].find(i => i.cartId === cartId);
      if (item) {
        if (quantity <= 0) {
          carts[userId] = carts[userId].filter(i => i.cartId !== cartId);
        } else {
          item.quantity = quantity;
        }
      }
    }
    res.json(carts[userId] || []);
  });

  // Cart: Remove
  app.post("/api/cart/remove", (req, res) => {
    const { userId, cartId } = req.body;
    if (carts[userId]) {
      carts[userId] = carts[userId].filter(item => item.cartId !== cartId);
    }
    res.json(carts[userId] || []);
  });

  // Google OAuth Roots (Gmail Connection/Login)
  app.get("/api/auth/google/url", (req, res) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const protocol = req.headers["x-forwarded-proto"] || "http";
    const host = req.headers.host;
    const baseUrl = process.env.APP_URL || `${protocol}://${host}`;
    const redirectUri = `${baseUrl}/api/auth/google/callback`;

    console.log(`[OAUTH] Initiating flow. Redirect URI: ${redirectUri}`);

    if (!clientId || clientId === "REPLACE_WITH_CLIENT_ID") {
      return res.status(400).json({ 
        message: "Google OAuth is not configured. Please set GOOGLE_CLIENT_ID in .env",
        docs: "https://console.cloud.google.com/apis/credentials"
      });
    }
    
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile",
      access_type: "offline",
      prompt: "consent"
    });
    
    res.json({ url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}` });
  });

  app.get(["/api/auth/google/callback", "/api/auth/google/callback/"], async (req, res) => {
    const { code } = req.query;
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const protocol = req.headers["x-forwarded-proto"] || "http";
    const host = req.headers.host;
    const baseUrl = process.env.APP_URL || `${protocol}://${host}`;
    const redirectUri = `${baseUrl}/api/auth/google/callback`;

    if (!code) return res.status(400).send("No authorization code provided");

    try {
      // 1. Exchange code for tokens
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code: code as string,
          client_id: clientId!,
          client_secret: clientSecret!,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      });

      const tokens = await tokenResponse.json();
      if (!tokens.access_token) throw new Error("Failed to retrieve access token");

      // 2. Get user info
      const userResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      const googleUser = await userResponse.json();

      // 3. Find or Create User
      let user = users.find(u => u.email === googleUser.email);
      const isAdmin = googleUser.email === ADMIN_EMAIL;

      if (!user) {
        user = {
          id: (users.length + 1).toString(),
          email: googleUser.email,
          username: googleUser.name.replace(/\s+/g, "_").toLowerCase(),
          phone: "+92",
          password: await bcrypt.hash(Math.random().toString(36), 10), // Random password for OAuth users
          name: googleUser.name,
          balance: 0,
          currency: "PKR",
          isVerified: true,
          twoFactorEnabled: isAdmin, // Enable 2FA by default for admin
          twoFactorSecret: "123456",
          role: isAdmin ? "admin" : "user"
        };
        users.push(user);
      } else {
        // Update existing user with Google info
        user.name = googleUser.name;
        user.isVerified = true;
        if (isAdmin) user.role = "admin";
      }

      // 4. Generate Session Token
      const sessionToken = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: "24h" }
      );

      const { password: _, ...userWithoutPassword } = user;

      // 5. Return success script
      res.send(`
        <html>
          <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #0a0a0a; color: white;">
            <script>
              if (window.opener) {
                window.opener.postMessage({ 
                  type: 'GMAIL_AUTH_SUCCESS', 
                  email: '${user.email}',
                  token: '${sessionToken}',
                  user: ${JSON.stringify(userWithoutPassword)}
                }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <div style="text-align: center;">
              <h2 style="color: #4ADE80;">Identity Synchronized</h2>
              <p>Welcome, ${user.name}. You may now proceed.</p>
            </div>
          </body>
        </html>
      `);
    } catch (error: any) {
      console.error("[OAUTH] Error:", error);
      res.status(500).send("OAuth synchronization failed: " + error.message);
    }
  });

  // Marketplace
  const marketplace = {
    hotels: [
      // Saudi Arabia
      { id: "sa1", name: "Fairmont Makkah Clock Royal Tower", location: "Makkah", price: 85000, rating: 4.9, image: "https://picsum.photos/seed/makkah1/400/300", country: "SA" },
      { id: "sa2", name: "Pullman Zamzam Madina", location: "Madina", price: 65000, rating: 4.8, image: "https://picsum.photos/seed/madina1/400/300", country: "SA" },
      { id: "sa3", name: "Ritz-Carlton Jeddah", location: "Jeddah", price: 75000, rating: 4.9, image: "https://picsum.photos/seed/jeddah1/400/300", country: "SA" },
      { id: "sa4", name: "Hilton Makkah Convention", location: "Makkah", price: 55000, rating: 4.7, image: "https://picsum.photos/seed/makkah2/400/300", country: "SA" },
      // Pakistan
      { id: "pk1", name: "Pearl Continental", location: "Lahore", price: 25000, rating: 4.8, image: "https://picsum.photos/seed/lahore1/400/300", country: "PK" },
      { id: "pk2", name: "Serena Hotel", location: "Islamabad", price: 45000, rating: 4.9, image: "https://picsum.photos/seed/islo1/400/300", country: "PK" },
      { id: "pk3", name: "Movenpick Karachi", location: "Karachi", price: 30000, rating: 4.7, image: "https://picsum.photos/seed/karachi1/400/300", country: "PK" },
      { id: "pk4", name: "Ramada Multan", location: "Multan", price: 18000, rating: 4.5, image: "https://picsum.photos/seed/multan1/400/300", country: "PK" },
      { id: "pk5", name: "Faisalabad Serena", location: "Faisalabad", price: 22000, rating: 4.6, image: "https://picsum.photos/seed/fsd1/400/300", country: "PK" }
    ],
    restaurants: [
      { id: "r1", name: "Savour Foods", location: "Islamabad", category: "Pulao", deliveryTime: "25 min", minOrder: 500, rating: 4.7, image: "https://picsum.photos/seed/pulao1/400/300" },
      { id: "r2", name: "Bundu Khan", location: "Lahore", category: "BBQ", deliveryTime: "40 min", minOrder: 1000, rating: 4.6, image: "https://picsum.photos/seed/bbq1/400/300" },
      { id: "r3", name: "Kolachi", location: "Karachi", category: "Seafood", deliveryTime: "55 min", minOrder: 2500, rating: 4.9, image: "https://picsum.photos/seed/sea1/400/300" },
      { id: "r4", name: "Gourmet", location: "Faisalabad", category: "Desi", deliveryTime: "30 min", minOrder: 800, rating: 4.4, image: "https://picsum.photos/seed/desi1/400/300" },
      { id: "r5", name: "Cafe Bilal", location: "Multan", category: "Cafe", deliveryTime: "35 min", minOrder: 600, rating: 4.5, image: "https://picsum.photos/seed/cafe1/400/300" }
    ],
    flights: [
      { id: "f1", route: "Lahore (LHE) -> Jeddah (JED)", airline: "PIA", price: 125000, date: "2026-05-15", class: "Economy" },
      { id: "f2", route: "Karachi (KHI) -> Madina (MED)", airline: "Saudi Arabian Airlines", price: 145000, date: "2026-05-18", class: "Business" },
      { id: "f3", route: "Islamabad (ISB) -> Riyadh (RUH)", airline: "Airblue", price: 110000, date: "2026-05-20", class: "Economy" }
    ],
    packages: [
      { id: "p1", name: "Umrah Luxury Plus", description: "15 Days / Makkah & Madina / Flights included", price: 350000, rating: 4.9, image: "https://picsum.photos/seed/umrah/400/300" },
      { id: "p2", name: "Jeddah Business Hub", description: "5 Days / 5-Star Hotel / Flights included", price: 210000, rating: 4.7, image: "https://picsum.photos/seed/package2/400/300" }
    ]
  };

  // --- API Routes ---

  // Marketplace
  app.get("/api/marketplace", (req, res) => {
    res.json(marketplace);
  });

  // Simulation: Hotel Booking
  app.post("/api/bookings/hotel", authenticateToken, (req: any, res) => {
    if (req.user.role === "admin") return res.status(403).json({ message: "Admin is read-only" });
    const { hotelName, checkIn, amount } = req.body;
    const newTransaction = {
      id: Math.random().toString(36).substr(2, 9),
      userId: req.user.userId,
      amount: -parseFloat(amount),
      merchant: `Stay at ${hotelName}`,
      category: "Travel",
      date: new Date().toISOString()
    };
    transactions.unshift(newTransaction);
    res.json({ message: "Booking confirmed", transaction: newTransaction });
  });

  // Simulation: Food Order
  app.post("/api/food/order", authenticateToken, (req: any, res) => {
    if (req.user.role === "admin") return res.status(403).json({ message: "Admin is read-only" });
    const { restaurantName, amount } = req.body;
    const newTransaction = {
      id: Math.random().toString(36).substr(2, 9),
      userId: req.user.userId,
      amount: -parseFloat(amount),
      merchant: `Order from ${restaurantName}`,
      category: "Food",
      date: new Date().toISOString()
    };
    transactions.unshift(newTransaction);
    res.json({ message: "Order placed", transaction: newTransaction });
  });

  // User Profile
  app.get("/api/user/profile", authenticateToken, (req: any, res) => {
    const user = users.find(u => u.id === req.user.userId);
    res.json(user);
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
    
    res.json({
      totalBalance: currentBalance,
      monthlyIncome: user.role === "admin" ? 0 : 350000.00,
      monthlyExpenses: user.role === "admin" ? 0 : 180000.00,
      savingsRate: 0.48,
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

  // Simulation: Add Transaction
  app.post("/api/transactions/add", authenticateToken, (req: any, res) => {
    if (req.user.role === "admin") return res.status(403).json({ message: "Admin is read-only" });
    const { amount, merchant, category } = req.body;
    const newTransaction = {
      id: Math.random().toString(36).substr(2, 9),
      userId: req.user.userId,
      amount: parseFloat(amount),
      merchant: merchant || "Generic Store",
      category: category || "General",
      date: new Date().toISOString()
    };
    transactions.unshift(newTransaction);
    res.json({ message: "Transaction added successfully", transaction: newTransaction });
  });

  // Simulation: Utility Bill Payment
  app.post("/api/bills/pay", authenticateToken, (req: any, res) => {
    if (req.user.role === "admin") return res.status(403).json({ message: "Admin is read-only" });
    const { provider, consumerId, amount } = req.body;
    const newTransaction = {
      id: Math.random().toString(36).substr(2, 9),
      userId: req.user.userId,
      amount: -parseFloat(amount),
      merchant: `${provider} Bill - ${consumerId}`,
      category: "Bills",
      date: new Date().toISOString()
    };
    transactions.unshift(newTransaction);
    res.json({ message: "Bill paid successfully", transaction: newTransaction });
  });

  // Simulation: ReadyCash Loan
  app.post("/api/loans/readycash", authenticateToken, (req: any, res) => {
    if (req.user.role === "admin") return res.status(403).json({ message: "Admin is read-only" });
    const { amount } = req.body;
    const newTransaction = {
      id: Math.random().toString(36).substr(2, 9),
      userId: req.user.userId,
      amount: parseFloat(amount),
      merchant: "ReadyCash Credit Line",
      category: "Loan",
      date: new Date().toISOString()
    };
    transactions.unshift(newTransaction);
    res.json({ message: "Credit limit disbursed", transaction: newTransaction });
  });

  // Simulation: Mobile Load
  app.post("/api/mobile/load", authenticateToken, (req: any, res) => {
    if (req.user.role === "admin") return res.status(403).json({ message: "Admin is read-only" });
    const { operator, mobileNumber, amount } = req.body;
    const newTransaction = {
      id: Math.random().toString(36).substr(2, 9),
      userId: req.user.userId,
      amount: -parseFloat(amount),
      merchant: `${operator} Load - ${mobileNumber}`,
      category: "Mobile Load",
      date: new Date().toISOString()
    };
    transactions.unshift(newTransaction);
    res.json({ message: "Top-up successful", transaction: newTransaction });
  });

  // Admin Only: All Emails / Accounts
  app.get("/api/admin/accounts", authenticateToken, (req: any, res) => {
    if (req.user.role !== "admin") return res.status(403).json({ message: "Access denied" });
    res.json(users.map(u => ({ email: u.email, username: u.username, role: u.role, id: u.id })));
  });

  // --- Vite / Static Handling ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
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
