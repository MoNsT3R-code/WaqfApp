import React, { useEffect, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  CreditCard, 
  Wallet, 
  PieChart, 
  Activity,
  LogOut,
  Bell,
  Search,
  User as UserIcon,
  Zap,
  ThumbsUp,
  ThumbsDown,
  Plus,
  X,
  Send,
  Receipt,
  Smartphone,
  Repeat,
  ShieldCheck,
  Ticket,
  Maximize,
  ArrowRightLeft,
  Building2,
  Cpu,
  Bed,
  Utensils,
  Plane,
  Star,
  Clock,
  Navigation,
  Lock,
  Key,
  HelpingHand,
  Languages,
  BookOpen,
  Info,
  Shield,
  Moon,
  Sun,
  Monitor,
  MessageSquare,
  Trash2,
  ShoppingCart,
  Minus,
  Trash
} from "lucide-react";
import { Logo } from "./Logo";
import { motion, AnimatePresence } from "motion/react";
import { formatCurrency, cn } from "../lib/utils";
import { GoogleGenAI } from "@google/genai";
import { translations, Language } from "../translations";
import { Theme } from "../App";

interface Transaction {
  id: string;
  amount: number;
  merchant: string;
  category: string;
  date: string;
}

interface Summary {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  savingsRate: number;
  creditScore: number;
  investmentValue: number;
  performance: { month: string; balance: number }[];
}

interface MarketplaceData {
  hotels: { id: string; name: string; location: string; price: number; rating: number; image: string; country: string }[];
  restaurants: { id: string; name: string; location: string; category: string; deliveryTime: string; minOrder: number; rating: number; image: string }[];
  flights: { id: string; route: string; airline: string; price: number; date: string; class: string }[];
  packages: { id: string; name: string; description: string; price: number; rating: number; image: string }[];
}

type ModalType = "add_tx" | "transfer" | "bill" | "load" | "loan" | "qr" | "travel" | "food" | "vault" | "privacy" | "help" | "flight_confirm" | null;
type TravelTab = "Hotels" | "Flights" | "Packages";

export const Dashboard = ({ onLogout, lang, setLang, theme, setTheme, user }: { onLogout: () => void, lang: Language, setLang: (l: Language) => void, theme: Theme, setTheme: (t: Theme) => void, user: any }) => {
  const labels = translations[lang];
  const isAdmin = user?.role === "admin";
  const [summary, setSummary] = useState<Summary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [marketplace, setMarketplace] = useState<MarketplaceData | null>(null);
  const [adminAccounts, setAdminAccounts] = useState<any[]>([]);
  const [smartInsight, setSmartInsight] = useState<string | null>(null);
  const [isAdvisorLoading, setIsAdvisorLoading] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState<"up" | "down" | null>(null);
  
  // Support Assistant State
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "ai"; content: string }[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  
  // E2EE State
  const [vaultMessage, setVaultMessage] = useState<string>("Initializing secure environment...");
  const [isVaultEncrypted, setIsVaultEncrypted] = useState(true);

  // Flight Booking State
  const [pendingFlight, setPendingFlight] = useState<{ route: string; airline: string; price: number; date: string; class: string } | null>(null);

  // Modal & Tab State
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [travelTab, setTravelTab] = useState<TravelTab>("Hotels");
  const [foodCity, setFoodCity] = useState<string>("All");
  const [isProcessing, setIsProcessing] = useState(false);

  // Cart & Feedback State
  const [cart, setCart] = useState<any[]>([]);
  const [userFeedbacks, setUserFeedbacks] = useState<any[]>([]);
  const [newFeedback, setNewFeedback] = useState({ content: "", rating: 5 });
  const [editingFeedbackId, setEditingFeedbackId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [confirmData, setConfirmData] = useState<{ message: string; onConfirm: () => void } | null>(null);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  useEffect(() => {
    fetchCart();
    fetchFeedbacks();
    if (isAdmin) fetchAdminAccounts();
  }, [isAdmin]);

  const fetchAdminAccounts = async () => {
    try {
      const res = await fetch("/api/admin/accounts", {
        headers: { "Authorization": `Bearer ${localStorage.getItem("waqf_token")}` }
      });
      const data = await res.json();
      if (res.ok) {
        setAdminAccounts(data);
      }
    } catch (e) {
      console.error("Admin Fetch Error:", e);
    }
  };

  const showNotification = (message: string, type: "success" | "error" = "success") => {
    setNotification({ message, type });
  };

  const fetchCart = async () => {
    try {
      const res = await fetch(`/api/cart/${user.id}`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("waqf_token")}` }
      });
      const data = await res.json();
      setCart(data);
    } catch (e) {}
  };

  const fetchFeedbacks = async () => {
    try {
      const res = await fetch("/api/feedback");
      const data = await res.json();
      setUserFeedbacks(data);
    } catch (e) {}
  };

  const addToCart = async (item: any) => {
    if (isAdmin) {
      showNotification("Admin cannot add to portfolio", "error");
      return;
    }
    try {
      const res = await fetch("/api/cart/add", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("waqf_token")}`
        },
        body: JSON.stringify({ userId: user.id, item })
      });
      const data = await res.json();
      setCart(data);
      showNotification("Item added to Waqf Portfolio");
    } catch (e) {}
  };

  const updateCartQuantity = async (cartId: string, quantity: number) => {
    if (isAdmin) return;
    try {
      const res = await fetch("/api/cart/update", {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("waqf_token")}`
        },
        body: JSON.stringify({ userId: user.id, cartId, quantity })
      });
      const data = await res.json();
      setCart(data);
    } catch (e) {}
  };

  const removeFromCart = async (cartId: string) => {
    if (isAdmin) return;
    try {
      const res = await fetch("/api/cart/remove", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("waqf_token")}`
        },
        body: JSON.stringify({ userId: user.id, cartId })
      });
      const data = await res.json();
      setCart(data);
      showNotification("Item removed from portfolio");
    } catch (e) {}
  };

  const startEditingFeedback = (f: any) => {
    setNewFeedback({ content: f.content, rating: f.rating });
    setEditingFeedbackId(f.id);
  };

  const submitFeedback = async () => {
    if (isAdmin) {
      showNotification("Admin cannot post feedback", "error");
      return;
    }
    try {
      if (editingFeedbackId) {
        await fetch(`/api/feedback/${editingFeedbackId}`, {
          method: "PUT",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("waqf_token")}`
          },
          body: JSON.stringify(newFeedback)
        });
        showNotification("Feedback updated");
      } else {
        await fetch("/api/feedback", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("waqf_token")}`
          },
          body: JSON.stringify({ userId: user.id, username: user.username, ...newFeedback })
        });
        showNotification("Feedback submitted");
      }
      setNewFeedback({ content: "", rating: 5 });
      setEditingFeedbackId(null);
      fetchFeedbacks();
    } catch (e) {
      showNotification("Failed to submit feedback", "error");
    }
  };

  const handleDeleteAccount = async () => {
    if (isAdmin) {
      showNotification("Application owner account cannot be deleted", "error");
      return;
    }
    setConfirmData({
      message: "Are you sure you want to PERMANENTLY delete your account? This action cannot be undone.",
      onConfirm: async () => {
        try {
          const res = await fetch("/api/user/account", {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${localStorage.getItem("waqf_token")}` }
          });
          if (res.ok) {
            onLogout();
          }
        } catch (e) {
          showNotification("Failed to delete account", "error");
        }
      }
    });
  };

  // Simulated E2EE: Decrypting localized "Vault" data
  const toggleVault = async () => {
    if (isVaultEncrypted) {
      // Simulate decryption delay
      setIsProcessing(true);
      await new Promise(r => setTimeout(r, 800));
      setVaultMessage("CRYPTO_KEY_VAL: X-992-DELTA-PKR-SECURE. Current secret note: 'Your emergency backup key is safely stored in the Physical Vault PK-07'.");
      setIsVaultEncrypted(false);
    } else {
      setVaultMessage("Encrypted stream active. Key-pairing required.");
      setIsVaultEncrypted(true);
    }
    setIsProcessing(false);
  };

  const handleSupportQuery = async () => {
    if (!chatInput.trim() || isChatLoading) return;

    const userMsg = chatInput;
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setChatInput("");
    setIsChatLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        config: {
          systemInstruction: `You are the WaqfApp Assistant. WaqfApp is a secure, Islamic-focused digital wallet and philanthropy engine. 
          It supports:
          - Transfers/Payments
          - Bill Payments
          - Charity/Waqf (Sadaqah Jariyah)
          - Travel bookings (Hotels, Flights)
          - Digital Vault (E2EE)
          - Smart Advisor for finance
          Answer queries politely in ${lang}. Be helpful and concise. Use a friendly but professional tone. If you don't know something about the app, guide the user to the Help Center.`,
        },
        contents: [
          ...messages.map(m => ({ role: m.role === "user" ? "user" : "model", parts: [{ text: m.content }] })),
          { role: "user", parts: [{ text: userMsg }] }
        ],
      });

      const aiText = response.text || "I am currently processing your request. Please try again in a moment.";
      setMessages(prev => [...prev, { role: "ai", content: aiText }]);
    } catch (error) {
      console.error("Support API failed:", error);
      setMessages(prev => [...prev, { role: "ai", content: "Apologies, my knowledge bank is currently synchronizing. Please ask again shortly." }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const fetchData = async () => {
    const headers = { "Authorization": `Bearer ${localStorage.getItem("waqf_token")}` };
    const [summaryRes, transRes, marketRes] = await Promise.all([
      fetch("/api/dashboard/summary", { headers }),
      fetch("/api/transactions", { headers }),
      fetch("/api/marketplace", { headers })
    ]);
    const summaryData = await summaryRes.json();
    const transData = await transRes.json();
    const marketData = await marketRes.json();
    setSummary(summaryData);
    setTransactions(transData);
    setMarketplace(marketData);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const syncSmartAdvisor = async () => {
    if (!summary || !transactions) return;
    
    setIsAdvisorLoading(true);
    setFeedbackGiven(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `Act as a professional financial advisor in Pakistan. Analyze this user data in PKR:
        Total Balance: ${formatCurrency(summary.totalBalance)}
        Recent Activity: ${transactions.slice(0, 5).map(t => `${t.merchant}: ${t.amount}`).join(", ")}
        Based on this, suggest one specific action to optimize their WaqfApp wallet experience (e.g. paying bills earlier, using ReadyCash wisely, or top-up strategies). 2 sentences max.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt
      });
      setSmartInsight(response.text);
    } catch (error) {
      console.error("Advisor Error:", error);
      setSmartInsight("Optimize your liquidity by consolidating your utility payments during the first week of the month.");
    } finally {
      setIsAdvisorLoading(false);
    }
  };

  const handleAction = async (endpoint: string, data: any) => {
    if (isAdmin) {
      showNotification("Admin is read-only", "error");
      return;
    }
    setIsProcessing(true);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("waqf_token")}`
        },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        setActiveModal(null);
        await fetchData();
        showNotification("Operation completed successfully");
      }
    } catch (err) {
      console.error("Action Error:", err);
      showNotification("System interruption", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!summary) return null;

  return (
    <div className="flex min-h-screen">
      {/* Sidebar Navigation */}
      <nav className="w-20 bg-[var(--bg)] border-r border-[var(--border)] flex flex-col items-center py-8 gap-10 sticky top-0 h-screen hidden md:flex">
        <div className="w-10 h-10 bg-gradient-to-br from-[var(--accent)] to-[#0066ff] rounded-[18px] flex items-center justify-center shadow-[0_0_20px_var(--accent-glow)] transition-all hover:scale-105 group cursor-pointer">
          <HelpingHand className="w-6 h-6 text-[var(--bg)] transition-transform group-hover:-rotate-12" />
        </div>
        <div className="w-6 h-6 bg-[var(--accent)] rounded flex items-center justify-center cursor-pointer shadow-[0_0_10px_var(--accent-glow)]"><Wallet className="w-4 h-4 text-[var(--bg)]" /></div>
        <div className="w-6 h-6 bg-[var(--border)] rounded flex items-center justify-center opacity-60 hover:opacity-100 hover:bg-[var(--border)] transition-all cursor-pointer"><Building2 className="w-4 h-4 text-[var(--text-p)]" /></div>
        <div className="w-6 h-6 bg-[var(--border)] rounded flex items-center justify-center opacity-60 hover:opacity-100 hover:bg-[var(--border)] transition-all cursor-pointer"><Cpu className="w-4 h-4 text-[var(--text-p)]" /></div>
        <div className="w-6 h-6 bg-[var(--border)] rounded flex items-center justify-center opacity-60 hover:opacity-100 hover:bg-[var(--border)] transition-all cursor-pointer"><PieChart className="w-4 h-4 text-[var(--text-p)]" /></div>
        <div className="w-6 h-6 bg-[var(--border)] rounded flex items-center justify-center opacity-60 hover:opacity-100 hover:bg-[var(--border)] transition-all cursor-pointer"><TrendingUp className="w-4 h-4 text-[var(--text-p)]" /></div>
        <div 
          onClick={onLogout}
          className="mt-auto mb-4 w-6 h-6 bg-red-500/10 rounded flex items-center justify-center opacity-60 hover:opacity-100 hover:bg-red-500/20 transition-all cursor-pointer"
        >
          <LogOut className="w-4 h-4 text-red-500" />
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 text-[var(--text-p)] p-4 md:p-12 font-sans selection:bg-[var(--accent)]/30">
        <div className="text-center mb-8 opacity-60">
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[var(--accent)] text-sm md:text-lg font-arabic tracking-widest"
          >
            {labels.bismillah}
          </motion.p>
        </div>

        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 md:mb-16 gap-10">
          <div className="flex-1">
            <Logo size="lg" className="!items-start" />
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <button 
              onClick={() => setActiveModal("cart" as any)}
              className="relative p-3 bg-[var(--border)] border border-[var(--border)] rounded-2xl text-[var(--text-s)] hover:text-[var(--accent)] transition-all group"
            >
              <ShoppingCart className="w-5 h-5 group-hover:scale-110 transition-transform" />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-[var(--accent)] text-[var(--bg)] text-[10px] font-bold rounded-full flex items-center justify-center">
                  {cart.length}
                </span>
              )}
            </button>
            
            <button 
              onClick={() => setActiveModal("feedback_main" as any)}
              className="p-3 bg-[var(--border)] border border-[var(--border)] rounded-2xl text-[var(--text-s)] hover:text-[var(--accent)] transition-all"
            >
              <MessageSquare className="w-5 h-5" />
            </button>

            <div className="w-px h-8 bg-[var(--border)] mx-2 hidden md:block" />
            <div className="flex items-center gap-2 p-1 bg-[var(--border)] border border-[var(--border)] rounded-xl">
              {(["system", "light", "dark"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={cn(
                    "w-8 h-8 flex items-center justify-center rounded-lg transition-all",
                    theme === t ? "bg-[var(--accent)] text-[var(--bg)] shadow-[0_0_15px_var(--accent-glow)]" : "text-[var(--text-s)] hover:text-[var(--text-p)]"
                  )}
                  title={labels[`theme${t.charAt(0).toUpperCase() + t.slice(1)}` as any]}
                >
                  {t === "light" && <Sun className="w-3.5 h-3.5" />}
                  {t === "dark" && <Moon className="w-3.5 h-3.5" />}
                  {t === "system" && <Monitor className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 p-1 bg-[var(--border)] border border-[var(--border)] rounded-xl">
              {(["en", "ur", "ar"] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={cn(
                    "px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all",
                    lang === l ? "bg-[var(--accent)] text-[var(--bg)] shadow-[0_0_15px_var(--accent-glow)]" : "text-[var(--text-s)] hover:text-[var(--text-p)]"
                  )}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>

            <button 
              onClick={() => setActiveModal("qr")}
              className="p-3 bg-[var(--border)] border border-[var(--border)] rounded-xl hover:bg-[var(--border)] transition-all shadow-lg"
            >
              <Maximize className="w-5 h-5 text-[var(--accent)]" />
            </button>
            <div className="flex flex-col items-end hidden sm:flex">
              <span className="text-sm font-medium text-[var(--text-p)]">{user.name || user.username}</span>
              <span className="text-[10px] text-[var(--text-s)] uppercase tracking-widest">{user.role === 'admin' ? 'System Administrator' : 'Level 2 Account'}</span>
            </div>
            <div className="w-10 h-10 rounded-full border border-[var(--accent)] bg-[var(--border)] overflow-hidden flex items-center justify-center shadow-[0_0_15px_var(--accent-glow)]">
              <UserIcon className="w-5 h-5 text-[var(--text-s)]" />
            </div>
          </div>
        </header>

        {/* Daily Inspiration Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <div className="p-6 bg-gradient-to-r from-[var(--accent)]/5 to-transparent border-l-2 border-[var(--accent)] rounded-r-2xl">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-[var(--accent)]/10 rounded-xl">
                <BookOpen className="w-5 h-5 text-[var(--accent)]" />
              </div>
              <div>
                <p className="text-[14px] text-[var(--text-p)] leading-relaxed font-light italic mb-2">
                  "{labels.ayat}"
                </p>
                <div className="flex items-center gap-2 text-[var(--text-s)] text-[10px] uppercase tracking-widest">
                  <span className="w-4 h-px bg-[var(--text-s)]" />
                  {labels.ayatRef}
                </div>
              </div>
            </div>
          </div>
          <div className="p-6 bg-gradient-to-r from-purple-500/5 to-transparent border-l-2 border-purple-500 rounded-r-2xl">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-purple-500/10 rounded-xl">
                <Zap className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-[14px] text-white leading-relaxed font-light italic mb-2">
                  "{labels.hadith}"
                </p>
                <div className="flex items-center gap-2 text-[#888891] text-[10px] uppercase tracking-widest">
                  <span className="w-4 h-px bg-[#888891]" />
                  {labels.hadithRef}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <main className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Balance Overview */}
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-[var(--card)] to-[var(--bg)] border border-[var(--border)] rounded-[32px] p-8 md:p-10 relative overflow-hidden shadow-2xl"
            >
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                  <span className="text-xs text-[var(--text-s)] uppercase tracking-[0.2em]">{labels.balance}</span>
                  <div className="flex gap-2">
                    <button className="px-3 py-1 bg-[var(--border)] border border-[var(--border)] rounded-full text-[9px] uppercase tracking-widest text-[var(--accent)]">Add Money</button>
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-extralight text-[var(--text-s)]">PKR</span>
                  <span className="text-5xl md:text-6xl font-light tracking-tighter tabular-nums text-[var(--text-p)]">{summary.totalBalance.toLocaleString()}</span>
                </div>
                <div className="mt-8 flex gap-6 text-[10px] uppercase tracking-[0.1em] text-[var(--text-s)]">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-1 bg-[#00ffaa] rounded-full" />
                    <span>Inflow: +45.2k</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-1 bg-red-400 rounded-full" />
                    <span>Outflow: -12.8k</span>
                  </div>
                </div>
              </div>
              {/* Decorative Mesh */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--accent)] opacity-[0.03] rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            </motion.section>

            {/* Service Grid */}
            <section className="space-y-4">
              <h2 className="text-[10px] font-bold text-[var(--text-s)] uppercase tracking-[0.3em] px-2">{labels.primaryServices}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <QuickAction 
                  icon={<ArrowRightLeft className="w-6 h-6" />} 
                  label={labels.transfer} 
                  onClick={() => setActiveModal("transfer")}
                  delay={0.1}
                />
                <QuickAction 
                  icon={<Receipt className="w-6 h-6" />} 
                  label={labels.utilities} 
                  onClick={() => setActiveModal("bill")}
                  delay={0.2}
                />
                <QuickAction 
                  icon={<Smartphone className="w-6 h-6" />} 
                  label={labels.mobileLoad} 
                  onClick={() => setActiveModal("load")}
                  delay={0.3}
                />
                <QuickAction 
                  icon={<Plane className="w-6 h-6" />} 
                  label={labels.travel} 
                  onClick={() => setActiveModal("travel")}
                  delay={0.4}
                />
                <QuickAction 
                  icon={<Utensils className="w-6 h-6" />} 
                  label={labels.food} 
                  onClick={() => setActiveModal("food")}
                  delay={0.5}
                />
                <QuickAction 
                  icon={<Repeat className="w-6 h-6" />} 
                  label={labels.readyCash} 
                  onClick={() => setActiveModal("loan")}
                  delay={0.6}
                />
                <QuickAction 
                  icon={<ShieldCheck className="w-6 h-6" />} 
                  label={labels.secureVault} 
                  onClick={() => setActiveModal("vault")}
                  delay={0.7}
                />
                <QuickAction 
                  icon={<Ticket className="w-6 h-6" />} 
                  label={labels.tickets} 
                  onClick={() => {}}
                  delay={0.8}
                />
                <QuickAction 
                  icon={<TrendingUp className="w-6 h-6" />} 
                  label={labels.savings} 
                  onClick={() => {}}
                  delay={0.9}
                />
                <QuickAction 
                  icon={<Plus className="w-6 h-6" />} 
                  label={labels.more} 
                  onClick={() => setActiveModal("add_tx")}
                  delay={1.0}
                />
              </div>
            </section>

            {/* Spending Insights Chart */}
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-[32px] p-8 shadow-xl">
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-[10px] font-bold tracking-[0.2em] uppercase text-[var(--text-s)]">{labels.volumeTrajectory}</h2>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[var(--accent)]" />
                    <span className="text-[9px] text-[var(--text-p)]">Monthly</span>
                  </div>
                </div>
              </div>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={summary.performance}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="month" stroke="var(--text-s)" fontSize={9} tickLine={false} axisLine={false} />
                    <YAxis hide />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: "12px", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }} 
                      itemStyle={{ color: "var(--text-p)", fontSize: "10px" }}
                    />
                    <Area type="monotone" dataKey="balance" stroke="var(--accent)" fillOpacity={1} fill="url(#colorValue)" strokeWidth={1.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Global Oversight (Admin Only) */}
            {isAdmin && (
              <motion.section 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-gradient-to-br from-[var(--card)] to-[var(--bg)] border border-purple-500/30 rounded-[28px] p-8 shadow-xl relative overflow-hidden"
              >
                <div className="flex items-center gap-3 mb-6 relative z-10">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                    <Shield className="w-5 h-5 text-purple-500" />
                  </div>
                  <div>
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--text-p)]">Global Oversight</h3>
                    <p className="text-[9px] text-[var(--text-s)] uppercase tracking-wider opacity-60">System Identities</p>
                  </div>
                </div>

                <div className="space-y-3 max-h-[280px] overflow-y-auto pr-2 custom-scrollbar relative z-10">
                  {adminAccounts.length === 0 ? (
                    <div className="py-8 text-center opacity-30">
                      <Lock className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-[9px] uppercase tracking-widest">Awaiting Identity Sync</p>
                    </div>
                  ) : adminAccounts.map((acc) => (
                    <div key={acc.id} className="p-3 bg-[var(--border)]/30 border border-[var(--border)] rounded-xl flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-[var(--bg)] flex items-center justify-center text-[9px] font-bold text-[var(--accent)]">
                          {acc.username.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold text-[var(--text-p)] truncate">{acc.username}</p>
                          <p className="text-[9px] text-[var(--text-s)] truncate opacity-60">{acc.email}</p>
                        </div>
                      </div>
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[7px] uppercase font-bold whitespace-nowrap",
                        acc.role === "admin" ? "bg-purple-500/10 text-purple-500" : "bg-[var(--accent)]/10 text-[var(--accent)]"
                      )}>
                        {acc.role}
                      </span>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 pt-4 border-t border-[var(--border)] flex items-center gap-2 text-[8px] text-[var(--text-s)] uppercase tracking-widest opacity-40">
                   <Activity className="w-3 h-3" /> Audit Pulse Active
                </div>

                <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-purple-500/10 blur-3xl rounded-full" />
              </motion.section>
            )}
            
            {/* Smart Advisor Card */}
            <motion.section 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-br from-[var(--card)] to-[var(--bg)] border border-[var(--border)] rounded-[28px] p-8 shadow-xl relative overflow-hidden group"
            >
               <div className="absolute top-0 right-0 p-6 opacity-[0.05] group-hover:scale-110 transition-transform">
                  <Zap className="w-16 h-16 text-[var(--accent)]" />
               </div>
               <div className="relative z-10 flex flex-col items-center text-center gap-6">
                 <div className="w-14 h-14 bg-[var(--accent)]/5 rounded-2xl flex items-center justify-center border border-[var(--accent)]/10">
                    <div className="relative">
                      <Zap className="w-6 h-6 text-[var(--accent)]" />
                      <div className="absolute inset-0 bg-[var(--accent)] blur-lg opacity-40 animate-pulse" />
                    </div>
                 </div>
                 <div>
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] mb-3 text-[var(--accent)]">{labels.capitalFlow}</h3>
                    <div className="min-h-[80px] flex items-center justify-center px-4">
                      {isAdvisorLoading ? (
                        <div className="flex gap-1.5 Items-center">
                          {[0, 1, 2].map(i => (
                            <div key={i} className="w-1 h-1 bg-[var(--accent)] rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-[var(--text-s)] leading-relaxed italic">
                          {smartInsight ? `"${smartInsight}"` : "Advisor report pending. Synchronize to view latest data analysis."}
                        </p>
                      )}
                    </div>
                 </div>
                 {smartInsight && !isAdvisorLoading && (
                   <div className="flex gap-6 mt-2">
                      <button onClick={() => setFeedbackGiven("up")} className={cn("p-2 transition-all hover:scale-110", feedbackGiven === "up" ? "text-[var(--accent)]" : "text-[var(--text-s)]")}>
                        <ThumbsUp className="w-4 h-4" />
                      </button>
                      <button onClick={() => setFeedbackGiven("down")} className={cn("p-2 transition-all hover:scale-110", feedbackGiven === "down" ? "text-red-500" : "text-[var(--text-s)]")}>
                        <ThumbsDown className="w-4 h-4" />
                      </button>
                   </div>
                 )}
                 <button 
                   onClick={syncSmartAdvisor}
                   className="w-full py-4 bg-[var(--border)] border border-[var(--border)] text-[var(--text-p)] text-[9px] font-bold uppercase tracking-[0.2em] rounded-xl hover:bg-[var(--accent)] hover:text-[var(--bg)] transition-all shadow-lg active:scale-95"
                 >
                   {labels.syncAdvisor}
                 </button>
               </div>
            </motion.section>

            {/* Transaction Ledger */}
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-[28px] overflow-hidden flex flex-col shadow-xl">
               <div className="p-6 border-b border-[var(--border)] flex justify-between items-center bg-[var(--border)]">
                  <span className="text-[10px] font-bold text-[var(--text-s)] uppercase tracking-[0.2em]">{labels.liveLedger}</span>
                  <Activity className="w-3 h-3 text-[var(--accent)] animate-pulse" />
               </div>
               <div className="divide-y divide-[var(--border)] overflow-y-auto max-h-[440px] scrollbar-hide">
                  {transactions.map((t) => (
                    <motion.div 
                      key={t.id} 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-5 flex items-center gap-4 hover:bg-[var(--border)] transition-colors"
                    >
                      <div className="w-10 h-10 rounded-xl bg-[var(--bg)] flex items-center justify-center border border-[var(--border)] shadow-inner">
                        <CategoryIcon category={t.category} amount={t.amount} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-[var(--text-p)] truncate">{t.merchant}</p>
                        <p className="text-[9px] text-[var(--text-s)] uppercase tracking-wide">{t.category} • {new Date(t.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                      <div className="text-right">
                        <p className={cn("text-[13px] font-bold tabular-nums", t.amount > 0 ? "text-[#00ffaa]" : "text-[var(--text-p)]")}>
                          {t.amount > 0 ? "+" : "-"}{Math.abs(t.amount).toLocaleString()}
                        </p>
                        <p className="text-[8px] text-[var(--text-s)] uppercase">PKR</p>
                      </div>
                    </motion.div>
                  ))}
               </div>
               <button className="p-4 text-[9px] text-[var(--text-s)] text-center uppercase tracking-widest hover:text-[var(--text-p)] transition-colors bg-[var(--border)]">{labels.viewHistory}</button>
            </div>

            {/* Micro-promos */}
            <div className="p-6 bg-[var(--accent)]/5 border border-[var(--accent)]/20 rounded-[24px] flex items-center gap-4 group cursor-pointer shadow-lg shadow-cyan-500/5">
              <div className="w-10 h-10 rounded-full bg-[var(--accent)] flex items-center justify-center text-[var(--bg)] shadow-[0_0_20px_var(--accent-glow)] group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-[10px] font-bold uppercase text-[var(--accent)]">Secure Vault v2</h4>
                <p className="text-[10px] text-[var(--text-s)]">Biometric protection is now active.</p>
              </div>
            </div>

          </div>
        </main>

        <footer className="mt-20 border-t border-[var(--border)] pt-12 pb-12 flex flex-col items-center gap-6">
          <p className="text-[var(--text-s)] text-[10px] uppercase tracking-[0.4em] opacity-40">
            {labels.footer}
          </p>
          <div className="flex gap-8">
            <button 
              onClick={() => setActiveModal("privacy")}
              className="text-[var(--text-s)] text-[10px] uppercase tracking-widest hover:text-[var(--accent)] transition-colors flex items-center gap-2"
            >
              <Shield className="w-3 h-3" />
              {labels.privacyPolicy}
            </button>
            <button 
              onClick={() => setActiveModal("help")}
              className="text-[var(--text-s)] text-[10px] uppercase tracking-widest hover:text-[var(--accent)] transition-colors flex items-center gap-2"
            >
              <Info className="w-3 h-3" />
              {labels.helpCenter}
            </button>
            <button 
              onClick={handleDeleteAccount}
              className="text-red-500/50 text-[10px] uppercase tracking-widest hover:text-red-500 transition-colors flex items-center gap-2"
            >
              <Trash className="w-3 h-3" />
              Delete Account
            </button>
          </div>
        </footer>
      </div>

      {/* Universal Modal Controller */}
      <AnimatePresence>
        {activeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveModal(null)}
              className="absolute inset-0 bg-black/90 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="relative w-full max-w-md bg-[var(--card)] border border-[var(--border)] rounded-[40px] p-10 shadow-[0_30px_100px_rgba(0,0,0,0.5)] overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-[var(--accent)] shadow-[0_0_20px_var(--accent-glow)]" />
              
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-light tracking-tight text-[var(--text-p)]">
                  {activeModal === "cart" as any && "Portfolio"}
                  {activeModal === "feedback_main" as any && "Feedback"}
                  {activeModal === "transfer" && labels.transfer}
                  {activeModal === "bill" && labels.utilities}
                  {activeModal === "load" && labels.mobileLoad}
                  {activeModal === "travel" && labels.travel}
                  {activeModal === "food" && labels.food}
                  {activeModal === "vault" && labels.secureVault}
                  {activeModal === "loan" && labels.readyCash}
                  {activeModal === "qr" && labels.searchPlaceholder}
                  {activeModal === "add_tx" && labels.addMoney}
                  {activeModal === "privacy" && labels.privacyPolicy}
                  {activeModal === "help" && labels.helpCenter}
                  {activeModal === "flight_confirm" && labels.confirmBooking}
                </h2>
                <button onClick={() => setActiveModal(null)} className="p-2 border border-[var(--border)] rounded-full hover:bg-[var(--border)] transition-colors">
                  <X className="w-5 h-5 text-[var(--text-s)]" />
                </button>
              </div>

              {/* Dynamic Modal Forms */}
              <div className="space-y-6">
                  {activeModal === "cart" as any && (
                    <div className="space-y-6">
                      <div className="max-h-[400px] overflow-y-auto space-y-4 pr-2 scrollbar-hide">
                        {cart.length === 0 ? (
                          <div className="text-center py-12 opacity-40">
                            <ShoppingCart className="w-12 h-12 mx-auto mb-4" />
                            <p className="text-xs uppercase tracking-widest">Portfolio is empty</p>
                          </div>
                        ) : cart.map((item) => (
                          <div key={item.cartId} className="bg-[var(--card)] border border-[var(--border)] p-4 rounded-2xl flex items-center gap-4 group">
                            <div className="w-10 h-10 bg-[var(--accent)]/10 rounded-xl flex items-center justify-center">
                              {item.type === 'Hotel' ? <Bed className="w-5 h-5 text-[var(--accent)]" /> : <Plane className="w-5 h-5 text-[var(--accent)]" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs font-medium text-[var(--text-p)] truncate">{item.name || item.route}</h4>
                              <p className="text-[10px] text-[var(--text-s)]">{formatCurrency(item.price)}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center bg-[var(--bg)] rounded-lg border border-[var(--border)]">
                                <button 
                                  onClick={() => updateCartQuantity(item.cartId, (item.quantity || 1) - 1)}
                                  className="p-1.5 hover:text-[var(--accent)] transition-colors"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="text-[10px] w-6 text-center font-bold">{item.quantity || 1}</span>
                                <button 
                                  onClick={() => updateCartQuantity(item.cartId, (item.quantity || 1) + 1)}
                                  className="p-1.5 hover:text-[var(--accent)] transition-colors"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                              <button onClick={() => removeFromCart(item.cartId)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-all">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      {cart.length > 0 && (
                        <div className="space-y-4 pt-4 border-t border-[var(--border)]">
                           <div className="flex justify-between items-center text-xs">
                             <span className="text-[var(--text-s)] uppercase tracking-widest font-bold">Total Portfolio Value</span>
                             <span className="text-[var(--text-p)] font-bold">{formatCurrency(cart.reduce((s, i) => s + (i.price * (i.quantity || 1)), 0))}</span>
                           </div>
                           <button className="w-full py-4 bg-[var(--accent)] text-[var(--bg)] text-[10px] font-bold uppercase tracking-[0.4em] rounded-2xl shadow-[0_10px_30px_var(--accent-glow)]">
                             Initialize Settlement
                           </button>
                        </div>
                      )}
                    </div>
                  )}

                  {activeModal === "feedback_main" as any && (
                    <div className="space-y-8">
                       <div className="space-y-4">
                         <div className="flex justify-between items-center">
                           <div className="flex gap-2">
                             {[1, 2, 3, 4, 5].map(star => (
                               <button 
                                 key={star} 
                                 onClick={() => setNewFeedback({ ...newFeedback, rating: star })}
                                 className={cn("p-1 transition-all", newFeedback.rating >= star ? "text-yellow-400" : "text-[var(--text-s)] opacity-30")}
                               >
                                 <Star className={cn("w-5 h-5", newFeedback.rating >= star && "fill-current")} />
                               </button>
                             ))}
                           </div>
                           {editingFeedbackId && (
                             <button onClick={() => { setEditingFeedbackId(null); setNewFeedback({ content: "", rating: 5 }); }} className="text-[8px] uppercase tracking-widest text-red-500">Cancel Edit</button>
                           )}
                         </div>
                         <textarea 
                           value={newFeedback.content}
                           onChange={(e) => setNewFeedback({ ...newFeedback, content: e.target.value })}
                           placeholder="Share your thoughts on our services..."
                           className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-2xl p-4 text-xs min-h-[100px] outline-none focus:border-[var(--accent)]/50 transition-all text-[var(--text-p)]"
                         />
                         <button 
                           onClick={submitFeedback}
                           disabled={!newFeedback.content}
                           className="w-full py-3 bg-[var(--accent)] text-[var(--bg)] text-[10px] font-bold uppercase tracking-[0.2em] rounded-xl shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                         >
                           <MessageSquare className="w-3 h-3" />
                           {editingFeedbackId ? "Update Review" : "Submit Review"}
                         </button>
                       </div>

                       <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
                         <h4 className="text-[10px] uppercase tracking-widest text-[var(--text-s)] font-bold border-b border-[var(--border)] pb-2">Community Voices</h4>
                         {userFeedbacks.map(f => (
                           <div key={f.id} className="p-4 bg-[var(--card)] border border-[var(--border)] rounded-2xl group">
                             <div className="flex justify-between items-center mb-2">
                               <span className="text-[10px] font-bold text-[var(--accent)]">{f.username}</span>
                               <div className="flex items-center gap-4">
                                 <div className="flex gap-0.5">
                                   {[...Array(f.rating)].map((_, i) => <Star key={i} className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" />)}
                                 </div>
                                 <button 
                                   onClick={() => startEditingFeedback(f)}
                                   className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-[var(--text-s)] hover:text-[var(--accent)]"
                                 >
                                    <ArrowRightLeft className="w-3 h-3" />
                                 </button>
                               </div>
                             </div>
                             <p className="text-[10px] text-[var(--text-p)] leading-relaxed italic">"{f.content}"</p>
                           </div>
                         ))}
                       </div>
                    </div>
                  )}

                {activeModal === "flight_confirm" && pendingFlight && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                    <div className="bg-[var(--accent)]/5 border border-[var(--accent)]/10 rounded-3xl p-6 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Plane className="w-20 h-20 -rotate-12 text-[var(--accent)]" />
                      </div>
                      
                      <div className="relative space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[var(--accent)]/10 flex items-center justify-center border border-[var(--accent)]/20">
                            <Navigation className="w-5 h-5 text-[var(--accent)]" />
                          </div>
                          <div>
                            <p className="text-[9px] text-[var(--text-s)] uppercase tracking-widest">{labels.bookingSummary}</p>
                            <h3 className="text-lg font-medium text-[var(--text-p)]">{pendingFlight.route}</h3>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 py-4 border-y border-[var(--border)]">
                          <div>
                            <p className="text-[9px] text-[var(--text-s)] uppercase tracking-widest mb-1">{labels.travel}</p>
                            <p className="text-xs text-[var(--text-p)] font-medium">{pendingFlight.airline}</p>
                          </div>
                          <div>
                            <p className="text-[9px] text-[var(--text-s)] uppercase tracking-widest mb-1">{labels.tickets}</p>
                            <p className="text-xs text-[var(--text-p)] font-medium">{pendingFlight.class}</p>
                          </div>
                          <div>
                            <p className="text-[9px] text-[var(--text-s)] uppercase tracking-widest mb-1">{labels.overview}</p>
                            <p className="text-xs text-[var(--text-p)] font-medium">{pendingFlight.date}</p>
                          </div>
                          <div>
                             <p className="text-[9px] text-[var(--text-s)] uppercase tracking-widest mb-1">{labels.totalCost}</p>
                             <p className="text-lg font-bold text-[var(--accent)]">{formatCurrency(pendingFlight.price)}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <button 
                        onClick={() => setActiveModal("travel")}
                        className="flex-1 py-4 bg-[var(--card)] border border-[var(--border)] text-[var(--text-s)] text-[10px] font-bold uppercase tracking-[0.2em] rounded-2xl hover:bg-[var(--border)] transition-all"
                      >
                        {labels.cancel}
                      </button>
                      <button 
                        disabled={isProcessing}
                        onClick={() => handleAction("/api/bookings/flight", { 
                          flightDetails: pendingFlight.route, 
                          amount: pendingFlight.price 
                        })}
                        className="flex-[2] py-4 bg-[var(--accent)] text-[var(--bg)] text-[10px] font-bold uppercase tracking-[0.2em] rounded-2xl shadow-[0_10px_30px_var(--accent-glow)] hover:shadow-[0_15px_40px_var(--accent-glow)] transition-all flex items-center justify-center gap-2"
                      >
                        {isProcessing ? "..." : (
                          <>
                            <CreditCard className="w-4 h-4" />
                            {labels.confirmAndPay}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {activeModal === "privacy" && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                    <div className="p-4 bg-[var(--accent)]/5 border border-[var(--accent)]/10 rounded-2xl">
                      <p className="text-[var(--accent)] font-bold text-xs uppercase tracking-wider mb-2">{labels.privacyTitle}</p>
                      <p className="text-[var(--text-s)] text-xs leading-relaxed font-light">{labels.privacyContent}</p>
                    </div>
                  </div>
                )}

                {activeModal === "help" && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex items-center gap-3 p-4 bg-[var(--accent)]/5 border border-[var(--accent)]/10 rounded-2xl">
                      <div className="w-10 h-10 rounded-full bg-[var(--accent)]/10 flex items-center justify-center border border-[var(--accent)]/20">
                        <MessageSquare className="w-5 h-5 text-[var(--accent)]" />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-[var(--accent)] uppercase tracking-wider">{labels.supportAssistant}</p>
                        <p className="text-[10px] text-[var(--text-s)]">{labels.supportHelp}</p>
                      </div>
                    </div>

                    <div className="h-[300px] flex flex-col gap-4 overflow-y-auto pr-2 scrollbar-hide py-2 border-y border-[var(--border)]">
                      {messages.length === 0 && (
                        <div className="text-center py-8 opacity-40">
                           <Info className="w-8 h-8 mx-auto mb-2 text-[var(--text-s)]" />
                           <p className="text-xs text-[var(--text-s)]">{labels.helpContent}</p>
                        </div>
                      )}
                      {messages.map((m, i) => (
                        <div key={i} className={cn(
                          "max-w-[85%] p-4 rounded-3xl text-sm leading-relaxed",
                          m.role === "user" 
                            ? "bg-[var(--accent)]/10 border border-[var(--accent)]/20 self-end rounded-tr-none text-[var(--text-p)]" 
                            : "bg-[var(--card)] border border-[var(--border)] self-start rounded-tl-none text-[var(--text-s)]"
                        )}>
                          {m.content}
                        </div>
                      ))}
                      {isChatLoading && (
                        <div className="bg-[var(--card)] border border-[var(--border)] self-start p-4 rounded-3xl rounded-tl-none text-xs text-[var(--text-s)] italic animate-pulse">
                          {labels.thinking}
                        </div>
                      )}
                    </div>

                    <div className="relative">
                      <input 
                        type="text" 
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSupportQuery()}
                        placeholder={labels.askQuestion}
                        className="w-full bg-[var(--bg)] border border-[var(--border)] text-xs py-4 px-5 pr-14 rounded-2xl focus:outline-none focus:border-[var(--accent)]/30 transition-all text-[var(--text-p)] placeholder:text-[var(--text-s)]/30"
                      />
                      <button 
                        onClick={handleSupportQuery}
                        disabled={isChatLoading}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-[var(--accent)] text-[var(--bg)] rounded-xl hover:opacity-90 transition-all disabled:opacity-50"
                      >
                        <ArrowUpRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {activeModal === "vault" && (
                  <div className="space-y-8 py-4">
                    <div className="text-center group">
                      <div className={cn(
                        "w-20 h-20 rounded-[32px] flex items-center justify-center mx-auto mb-6 border transition-all duration-700",
                        isVaultEncrypted ? "bg-[var(--card)] border-[var(--border)]" : "bg-[var(--accent)]/10 border-[var(--accent)]/30 shadow-[0_0_40px_var(--accent-glow)]"
                      )}>
                        {isVaultEncrypted ? (
                          <Lock className="w-8 h-8 text-[var(--text-s)]" />
                        ) : (
                          <ShieldCheck className="w-8 h-8 text-[var(--accent)]" />
                        )}
                      </div>
                      <p className="text-[10px] text-[var(--text-s)] uppercase tracking-[0.4em] mb-2">Security Protocol</p>
                      <h3 className="text-xl font-light text-[var(--text-p)] italic">
                        {isVaultEncrypted ? "Channel Encrypted" : "Synchronized Tunnel"}
                      </h3>
                    </div>

                    <div className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 font-mono text-[11px] leading-relaxed relative overflow-hidden group">
                      {!isVaultEncrypted && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[var(--accent)]/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                      )}
                      <p className={isVaultEncrypted ? "text-[var(--text-s)]/40 blur-[2px]" : "text-[var(--accent)]"}>
                        {vaultMessage}
                      </p>
                    </div>

                    <button 
                      onClick={toggleVault}
                      disabled={isProcessing}
                      className={cn(
                        "w-full py-4 rounded-2xl text-[10px] font-bold uppercase tracking-[0.4em] transition-all flex items-center justify-center gap-3",
                        isVaultEncrypted 
                          ? "bg-[var(--accent)] text-[var(--bg)] hover:opacity-90 shadow-[0_10px_30px_var(--accent-glow)]" 
                          : "bg-[var(--card)] text-[var(--text-s)] border border-[var(--border)] hover:bg-[var(--border)]"
                      )}
                    >
                      {isProcessing ? "Computing..." : (isVaultEncrypted ? "Initialize Key-Pair" : "Seal Channel")}
                      <Key className="w-4 h-4" />
                    </button>
                    
                    <p className="text-[8px] text-[var(--text-s)] text-center uppercase tracking-widest leading-loose opacity-40">
                      Standard: ISO/IEC 18033-3 AES-256-GCM<br/>
                      Asymmetric Handshake: X25519 EdDSA
                    </p>
                  </div>
                )}
                {activeModal === "travel" && (
                  <div className="space-y-6">
                    <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide border-b border-[var(--border)]">
                      {(["Hotels", "Flights", "Packages"] as TravelTab[]).map(n => (
                        <button 
                          key={n} 
                          onClick={() => setTravelTab(n)}
                          className={cn(
                            "px-4 py-2 rounded-full text-[9px] uppercase tracking-widest border transition-all whitespace-nowrap", 
                            travelTab === n ? "bg-[var(--accent)] text-[var(--bg)] border-[var(--accent)]" : "bg-[var(--card)] text-[var(--text-s)] border-[var(--border)]"
                          )}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                    
                    <div className="space-y-4 max-h-[440px] overflow-y-auto pr-2 scrollbar-hide">
                      {travelTab === "Hotels" && marketplace?.hotels.map(hotel => (
                        <div key={hotel.id} className="bg-[var(--card)] rounded-[24px] border border-[var(--border)] overflow-hidden group">
                          <img src={hotel.image} alt={hotel.name} className="w-full h-32 object-cover group-hover:scale-105 transition-transform" referrerPolicy="no-referrer" />
                          <div className="p-5">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="px-1.5 py-0.5 bg-[var(--accent)]/10 rounded text-[7px] text-[var(--accent)] font-bold">{hotel.country}</span>
                                  <h4 className="text-sm font-medium text-[var(--text-p)]">{hotel.name}</h4>
                                </div>
                                <p className="text-[10px] text-[var(--text-s)] flex items-center gap-1"><Navigation className="w-2.5 h-2.5" /> {hotel.location}</p>
                              </div>
                              <div className="flex items-center gap-1 text-[var(--accent)] text-xs"><Star className="w-3 h-3 fill-current" /> {hotel.rating}</div>
                            </div>
                            <div className="flex justify-between items-center mt-4 pt-4 border-t border-[var(--border)]">
                              <div>
                                <p className="text-[9px] text-[var(--text-s)] uppercase tracking-widest">Starting from</p>
                                <p className="text-sm font-bold text-[var(--text-p)]">{formatCurrency(hotel.price)}</p>
                              </div>
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => addToCart({ ...hotel, type: 'Hotel' })}
                                  className="px-3 py-2 bg-[var(--card)] border border-[var(--border)] text-[var(--text-s)] rounded-xl hover:text-[var(--accent)]"
                                >
                                  <ShoppingCart className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => handleAction("/api/bookings/hotel", { hotelName: hotel.name, amount: hotel.price })}
                                  className="px-5 py-2 bg-[var(--accent)] text-[var(--bg)] text-[9px] font-bold uppercase tracking-widest rounded-xl hover:opacity-90 active:scale-95 transition-all"
                                >
                                  Reserve
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}

                      {travelTab === "Flights" && marketplace?.flights.map(flight => (
                        <div key={flight.id} className="bg-[var(--card)] rounded-[24px] border border-[var(--border)] p-6 flex flex-col gap-4">
                          <div className="flex justify-between items-start">
                            <div>
                                <p className="text-[9px] text-[var(--accent)] uppercase tracking-[0.2em] mb-1">{flight.airline}</p>
                                <h4 className="text-base font-medium text-[var(--text-p)]">{flight.route}</h4>
                                <p className="text-[10px] text-[var(--text-s)] mt-1">{flight.date} • {flight.class}</p>
                            </div>
                            <Plane className="w-5 h-5 text-[var(--text-s)] opacity-30" />
                          </div>
                          <div className="flex justify-between items-center pt-4 border-t border-[var(--border)]">
                            <p className="text-lg font-bold text-[var(--text-p)]">{formatCurrency(flight.price)}</p>
                            <div className="flex gap-2">
                                <button 
                                  onClick={() => addToCart({ ...flight, type: 'Flight' })}
                                  className="px-4 py-2 bg-[var(--card)] border border-[var(--border)] text-[var(--text-s)] rounded-xl hover:text-[var(--accent)]"
                                >
                                  <ShoppingCart className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => {
                                    setPendingFlight(flight);
                                    setActiveModal("flight_confirm");
                                  }}
                                  className="px-6 py-2.5 bg-[var(--card)] border border-[var(--accent)]/30 text-[var(--accent)] text-[9px] font-bold uppercase tracking-widest rounded-xl hover:bg-[var(--accent)] hover:text-[var(--bg)] transition-all"
                                >
                                  {labels.confirmAndPay}
                                </button>
                            </div>
                          </div>
                        </div>
                      ))}

                      {travelTab === "Packages" && marketplace?.packages.map(pkg => (
                        <div key={pkg.id} className="bg-[var(--card)] rounded-[24px] border border-[var(--border)] overflow-hidden">
                          <img src={pkg.image} alt={pkg.name} className="w-full h-28 object-cover" referrerPolicy="no-referrer" />
                          <div className="p-5">
                            <h4 className="text-sm font-medium mb-1 text-[var(--text-p)]">{pkg.name}</h4>
                            <p className="text-[10px] text-[var(--text-s)] mb-4">{pkg.description}</p>
                            <div className="flex justify-between items-center pt-4 border-t border-[var(--border)]">
                              <p className="text-lg font-bold text-[var(--text-p)]">{formatCurrency(pkg.price)}</p>
                              <button 
                                onClick={() => handleAction("/api/bookings/hotel", { hotelName: pkg.name, amount: pkg.price })}
                                className="px-5 py-2 bg-[var(--accent)] text-[var(--bg)] text-[9px] font-bold uppercase tracking-widest rounded-xl"
                              >
                                View Package
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeModal === "food" && (
                  <div className="space-y-6">
                    <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide border-b border-[var(--border)]">
                      {["All", "Lahore", "Karachi", "Islamabad", "Multan", "Faisalabad"].map(city => (
                        <button 
                          key={city} 
                          onClick={() => setFoodCity(city)}
                          className={cn(
                            "px-4 py-2 rounded-full text-[9px] uppercase tracking-widest border transition-all whitespace-nowrap", 
                            foodCity === city ? "bg-[var(--accent)] text-[var(--bg)] border-[var(--accent)]" : "bg-[var(--card)] text-[var(--text-s)] border-[var(--border)]"
                          )}
                        >
                          {city}
                        </button>
                      ))}
                    </div>
                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
                      {marketplace?.restaurants.filter(r => foodCity === "All" || r.location === foodCity).map(rest => (
                        <div key={rest.id} className="bg-[var(--card)] rounded-[24px] border border-[var(--border)] p-4 flex gap-4 hover:border-[var(--accent)]/30 transition-all group">
                          <div className="w-20 h-20 rounded-2xl overflow-hidden border border-[var(--border)]">
                            <img src={rest.image} alt={rest.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" referrerPolicy="no-referrer" />
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="text-sm font-medium text-[var(--text-p)]">{rest.name}</h4>
                                <p className="text-[10px] text-[var(--text-s)]">{rest.category} • {rest.location}</p>
                              </div>
                              <div className="flex items-center gap-1 text-[var(--accent)] text-xs"><Star className="w-3 h-3 fill-current" /> {rest.rating}</div>
                            </div>
                            <div className="flex items-center gap-4 mt-3 text-[9px] text-[var(--text-s)] uppercase tracking-widest">
                              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {rest.deliveryTime}</span>
                              <span className="flex items-center gap-1"><Utensils className="w-3 h-3" /> Min. {rest.minOrder}</span>
                            </div>
                            <button 
                              onClick={() => handleAction("/api/food/order", { restaurantName: rest.name, amount: 1500 })}
                              className="w-full mt-4 py-2 bg-[var(--card)] text-[var(--accent)] border border-[var(--accent)]/20 text-[9px] font-bold uppercase tracking-widest rounded-xl hover:bg-[var(--accent)] hover:text-[var(--bg)] transition-all"
                            >
                              Order Now
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {activeModal === "transfer" && (
                  <>
                    <InputGroup label="Recipient Account / Number" type="text" placeholder="e.g. 03450000000" />
                    <InputGroup label="Select Destination" dropdown={["JazzCash", "Easypaisa", "Bank Account (IBFT)"]} />
                    <InputGroup label="Amount (PKR)" type="number" placeholder="5,000" />
                    <SubmitButton label="Confirm Transfer" onClick={() => handleAction("/api/transactions/transfer", { amount: 5000, to: "0345..." })} loading={isProcessing} />
                  </>
                )}

                {activeModal === "bill" && (
                  <>
                    <InputGroup label="Service Provider" dropdown={["KESC / Electric", "SNGPL / Gas", "WASA / Water", "PTCL / Internet"]} />
                    <InputGroup label="Consumer Number" type="text" placeholder="9PKR-8822-XX" />
                    <InputGroup label="Amount (PKR)" type="number" placeholder="2,450" />
                    <SubmitButton label="Pay Bill" onClick={() => handleAction("/api/bills/pay", { provider: "KESC", consumerId: "9PKR-8822", amount: 2450 })} loading={isProcessing} />
                  </>
                )}

                {activeModal === "load" && (
                  <>
                    <InputGroup label="Network Operator" dropdown={["Jazz", "Telenor", "Zong", "Ufone"]} />
                    <InputGroup label="Mobile Number" type="text" placeholder="03XXXXXXXXX" />
                    <InputGroup label="Top-up Amount" type="number" placeholder="1,000" />
                    <SubmitButton label="Purchase Bundle" onClick={() => handleAction("/api/mobile/load", { operator: "Jazz", mobileNumber: "0300...", amount: 1000 })} loading={isProcessing} />
                  </>
                )}

                {activeModal === "loan" && (
                  <div className="text-center space-y-6">
                    <div className="py-8 bg-[var(--card)] rounded-3xl border border-[var(--border)]">
                      <p className="text-xs text-[var(--text-s)] uppercase tracking-widest mb-1">Pre-approved Limit</p>
                      <p className="text-4xl font-light text-[var(--accent)]">PKR 15,000</p>
                    </div>
                    <p className="text-[10px] text-[var(--text-s)] leading-relaxed">ReadyCash is an instant credit facility. Repayment terms of 15-30 days apply with standard markup.</p>
                    <SubmitButton label="Disburse Now" onClick={() => handleAction("/api/loans/readycash", { amount: 15000 })} loading={isProcessing} />
                  </div>
                )}

                {activeModal === "qr" && (
                  <div className="flex flex-col items-center gap-8 py-4">
                    <div className="w-56 h-56 border-2 border-dashed border-[var(--accent)]/30 rounded-[40px] flex items-center justify-center relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-t from-[var(--accent)]/10 to-transparent animate-pulse" />
                        <Maximize className="w-12 h-12 text-[var(--accent)] opacity-40 group-hover:scale-125 transition-transform" />
                        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[var(--accent)]" />
                        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[var(--accent)]" />
                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[var(--accent)]" />
                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[var(--accent)]" />
                    </div>
                    <p className="text-[10px] text-[var(--text-s)] text-center uppercase tracking-widest leading-loose">Align QR code for instantaneous <br /> biometric payment processing</p>
                    <button onClick={() => setActiveModal(null)} className="w-full py-4 bg-[var(--card)] border border-[var(--border)] text-[var(--text-p)] text-[10px] font-bold uppercase tracking-widest rounded-2xl hover:bg-[var(--border)] transition-all">Terminate Scanner</button>
                  </div>
                )}

                {activeModal === "add_tx" && (
                  <>
                     <InputGroup label="Descriptor" type="text" placeholder="e.g. Local Grocery" />
                     <InputGroup label="Volume (PKR)" type="number" placeholder="5,000" />
                     <InputGroup label="Classification" dropdown={["General", "Shopping", "Food", "Bills", "Income"]} />
                     <SubmitButton label="Append to Ledger" onClick={() => handleAction("/api/transactions/add", { merchant: "Manual Entry", amount: -500, category: "General" })} loading={isProcessing} />
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border backdrop-blur-md"
            style={{ 
              backgroundColor: notification.type === "success" ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)",
              borderColor: notification.type === "success" ? "rgba(34, 197, 94, 0.3)" : "rgba(239, 68, 68, 0.3)"
            }}
          >
            <div className={cn("w-2 h-2 rounded-full animate-pulse", notification.type === "success" ? "bg-green-500" : "bg-red-500")} />
            <span className="text-[10px] uppercase tracking-widest font-bold text-[var(--text-p)]">{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmData && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setConfirmData(null)}
               className="absolute inset-0 bg-black/80 backdrop-blur-sm"
             />
             <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative bg-[var(--card)] border border-[var(--border)] rounded-[32px] p-8 max-w-sm w-full text-center space-y-6 shadow-2xl"
             >
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto border border-red-500/20">
                  <Trash className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-sm font-medium text-[var(--text-p)]">{confirmData.message}</h3>
                <div className="flex gap-3">
                  <button onClick={() => setConfirmData(null)} className="flex-1 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-xl text-[10px] uppercase tracking-widest font-bold">Cancel</button>
                  <button 
                    onClick={() => { confirmData.onConfirm(); setConfirmData(null); }} 
                    className="flex-1 py-3 bg-red-500 text-white rounded-xl text-[10px] uppercase tracking-widest font-bold shadow-lg shadow-red-500/20"
                  >
                    Confirm
                  </button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const QuickAction = ({ icon, label, onClick, delay }: { icon: React.ReactNode; label: string; onClick: () => void; delay: number }) => (
  <motion.button 
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay }}
    onClick={onClick}
    className="group bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 flex flex-col items-center gap-4 hover:border-[var(--accent)] hover:bg-[var(--accent-glow)] transition-all shadow-xl active:scale-95"
  >
    <div className="w-12 h-12 rounded-2xl bg-[var(--border)] flex items-center justify-center text-[var(--text-s)] group-hover:text-[var(--accent)] group-hover:shadow-[0_0_20px_var(--accent-glow)] transition-all">
      {icon}
    </div>
    <span className="text-[10px] font-bold text-[var(--text-s)] group-hover:text-[var(--text-p)] uppercase tracking-widest transition-colors">{label}</span>
  </motion.button>
);

const CategoryIcon = ({ category, amount }: { category: string; amount: number }) => {
  if (amount > 0) return <ArrowUpRight className="w-5 h-5 text-[#00ffaa]" />;
  if (category.toLowerCase().includes("bill")) return <Receipt className="w-5 h-5 text-red-400" />;
  if (category.toLowerCase().includes("transfer")) return <ArrowRightLeft className="w-5 h-5 text-[var(--accent)]" />;
  if (category.toLowerCase().includes("load")) return <Smartphone className="w-5 h-5 text-orange-400" />;
  if (category.toLowerCase().includes("loan")) return <Repeat className="w-5 h-5 text-purple-400" />;
  return <Wallet className="w-5 h-5 text-[var(--text-s)]" />;
};

const InputGroup = ({ label, type, placeholder, dropdown }: { label: string; type?: string; placeholder?: string; dropdown?: string[] }) => (
  <div className="space-y-2">
    <label className="text-[9px] text-[var(--text-s)] uppercase tracking-[0.3em] ml-2 block">{label}</label>
    {dropdown ? (
      <select className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-2xl px-5 py-4 text-xs font-medium text-[var(--text-p)] focus:border-[var(--accent)]/50 outline-none transition-all appearance-none cursor-pointer">
        {dropdown.map(opt => <option key={opt}>{opt}</option>)}
      </select>
    ) : (
      <input 
        type={type} 
        placeholder={placeholder}
        className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-2xl px-5 py-4 text-xs font-medium text-[var(--text-p)] focus:border-[var(--accent)]/50 outline-none transition-all placeholder:text-[var(--text-s)]/30"
      />
    )}
  </div>
);

const SubmitButton = ({ label, onClick, loading }: { label: string; onClick: () => void; loading: boolean }) => (
  <button 
    onClick={onClick}
    disabled={loading}
    className="w-full py-5 bg-[var(--accent)] text-[var(--bg)] text-[10px] font-bold uppercase tracking-[0.3em] rounded-2xl shadow-[0_10px_40px_var(--accent-glow)] hover:shadow-[0_15px_50px_var(--accent-glow)] active:scale-[0.98] transition-all relative overflow-hidden"
  >
    {loading ? "Transmitting..." : label}
    <div className="absolute inset-0 bg-white/20 -translate-x-full hover:translate-x-full transition-transform duration-700 skew-x-12" />
  </button>
);

