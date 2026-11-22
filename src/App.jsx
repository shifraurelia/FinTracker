
import { useState, useEffect } from "react";
import "./App.css";

const tutorialSteps = [
  {
    label: "WELCOME",
    icon: "✦",
    title: "Welcome to FINTRACKER!",
    description:
      "Your finances, under control. FINTRACKER helps you manage your personal finances in one simple place.",
    detail: "Let's take a quick tour of your new financial dashboard."
  },
  {
    label: "STEP 1 OF 4",
    icon: "▦",
    title: "Your Dashboard",
    description:
      "Your financial overview is available here. Check your Current Balance, Total Income, Total Expenses, and Total Transactions.",
    detail: "You can also see your Monthly Overview and Recent Transactions."
  },
  {
    label: "STEP 2 OF 4",
    icon: "＋",
    title: "Record Transaction",
    description:
      "Record your daily financial activities by selecting Income or Expense.",
    detail:
      "Enter the transaction name, category, amount, and date, then press Save Transaction."
  },
  {
    label: "STEP 3 OF 4",
    icon: "▤",
    title: "Monthly Journal",
    description:
      "Keep track of your financial activities in one organized transaction history.",
    detail:
      "Review the transactions you have recorded and see where your money goes."
  },
  {
    label: "STEP 4 OF 4",
    icon: "⚙",
    title: "Settings & Appearance",
    description:
      "Customize your FINTRACKER experience through the Settings page.",
    detail:
      "Switch between Light Mode and Dark Mode, or reopen this tutorial whenever you need help."
  },
  {
    label: "YOU'RE ALL SET!",
    icon: "✓",
    title: "Ready to get started?",
    description:
      "You're now familiar with the main features of FINTRACKER.",
    detail:
      "Start recording your transactions and take control of your personal finances!"
  }
];

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [page, setPage] = useState("Dashboard");
  const [transactions, setTransactions] = useState([]);
  const [type, setType] = useState("Income");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );

  const [showTutorial, setShowTutorial] = useState(
    () =>
      localStorage.getItem("fintracker-tutorial-completed") !== "true"
  );

  const [tutorialStep, setTutorialStep] = useState(0);

  // LOAD TRANSACTIONS FROM SQLITE
  async function loadTransactions() {
    try {
      setError("");

      const data = await window.fintracker.getTransactions();
      setTransactions(data);
    } catch (err) {
      setError("Failed to load transactions: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTransactions();
  }, []);

  // ALL-TIME TOTALS
  const totalIncome = transactions
    .filter((item) => item.type === "Income")
    .reduce((sum, item) => sum + Number(item.amount), 0);

  const totalExpenses = transactions
    .filter((item) => item.type === "Expense")
    .reduce((sum, item) => sum + Number(item.amount), 0);

  const balance = totalIncome - totalExpenses;

  // MONTHLY JOURNAL FILTER
  const monthlyTransactions = transactions.filter((item) =>
    String(item.date || "").startsWith(selectedMonth)
  );

  const monthlyIncome = monthlyTransactions
    .filter((item) => item.type === "Income")
    .reduce((sum, item) => sum + Number(item.amount), 0);

  const monthlyExpenses = monthlyTransactions
    .filter((item) => item.type === "Expense")
    .reduce((sum, item) => sum + Number(item.amount), 0);

  const monthlyBalance = monthlyIncome - monthlyExpenses;

  const monthLabel = new Date(
    `${selectedMonth}-01T00:00:00`
  ).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric"
  });

  // TUTORIAL FUNCTIONS
  function finishTutorial() {
    localStorage.setItem("fintracker-tutorial-completed", "true");
    setShowTutorial(false);
    setTutorialStep(0);
  }

  function openTutorial() {
    setTutorialStep(0);
    setShowTutorial(true);
  }

  function nextTutorial() {
    if (tutorialStep === tutorialSteps.length - 1) {
      finishTutorial();
    } else {
      setTutorialStep((previous) => previous + 1);
    }
  }

  function previousTutorial() {
    setTutorialStep((previous) => Math.max(0, previous - 1));
  }

  // ADD TRANSACTION TO SQLITE
  async function addTransaction(event) {
    event.preventDefault();

    if (saving) return;

    const form = event.currentTarget;
    const data = new FormData(form);

    const transaction = {
      title: String(data.get("title") || "").trim(),
      category: String(data.get("category") || ""),
      amount: Number(data.get("amount")),
      date: String(data.get("date") || ""),
      type
    };

    if (
      !transaction.title ||
      !transaction.category ||
      !transaction.date ||
      !Number.isFinite(transaction.amount) ||
      transaction.amount <= 0
    ) {
      setError("Please enter valid transaction details.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      await window.fintracker.addTransaction(transaction);
      await loadTransactions();

      form.reset();
      setPage("Dashboard");
    } catch (err) {
      setError("Failed to save transaction: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  const currentTutorial = tutorialSteps[tutorialStep];

  return (
    <div className={darkMode ? "app dark" : "app"}>

      {/* SIDEBAR */}
      <aside className="sidebar">
        <h2>✦ FINTRACKER</h2>
        <p className="menu-label">MENU</p>

        <nav>
          {[
            "Dashboard",
            "Record Transaction",
            "Monthly Journal",
            "Settings"
          ].map((item) => (
            <a
              key={item}
              className={page === item ? "active" : ""}
              onClick={() => setPage(item)}
            >
              {item === "Dashboard" && "▦ "}
              {item === "Record Transaction" && "＋ "}
              {item === "Monthly Journal" && "▤ "}
              {item === "Settings" && "⚙ "}
              {item}
            </a>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <p>Your finances,<br />under control.</p>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="main">

        <header>
          <div>
            <p className="eyebrow">FINANCIAL OVERVIEW</p>
            <h1>{page}</h1>
            <p className="subtitle">
              Manage your finances with confidence.
            </p>
          </div>

          <button onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? "☀ Light Mode" : "☾ Dark Mode"}
          </button>
        </header>

        {/* ERROR MESSAGE */}
        {error && (
          <div
            style={{
              padding: "12px",
              marginBottom: "16px",
              color: "#dc2626",
              background: "#fee2e2",
              borderRadius: "8px"
            }}
          >
            {error}
          </div>
        )}

        {/* LOADING MESSAGE */}
        {loading && <p>Loading your transactions...</p>}

        {!loading && (
          <>

            {/* DASHBOARD */}
            {page === "Dashboard" && (
              <>
                <section className="balance-card">
                  <p>✦ CURRENT BALANCE</p>
                  <h2>
                    Rp {balance.toLocaleString("id-ID")}
                  </h2>
                  <span>Your finances at a glance</span>
                </section>

                <section className="summary-grid">
                  <div className="summary-card">
                    <p>Total Income</p>
                    <h2>
                      Rp {totalIncome.toLocaleString("id-ID")}
                    </h2>
                    <span>↗ Money received</span>
                  </div>

                  <div className="summary-card">
                    <p>Total Expenses</p>
                    <h2>
                      Rp {totalExpenses.toLocaleString("id-ID")}
                    </h2>
                    <span>↘ Money spent</span>
                  </div>

                  <div className="summary-card">
                    <p>Total Transactions</p>
                    <h2>{transactions.length}</h2>
                    <span>All recorded entries</span>
                  </div>
                </section>

                <section className="bottom-grid">
                  <div className="panel">
                    <h3>Monthly Overview</h3>
                    <p>
                      Income: Rp {monthlyIncome.toLocaleString("id-ID")}
                    </p>
                    <p>
                      Expenses: Rp {monthlyExpenses.toLocaleString("id-ID")}
                    </p>
                    <p>
                      Balance: Rp {monthlyBalance.toLocaleString("id-ID")}
                    </p>
                  </div>

                  <div className="panel">
                    <h3>Recent Transactions</h3>

                    {transactions.length === 0 ? (
                      <p>No transactions recorded yet.</p>
                    ) : (
                      transactions.slice(0, 5).map((item) => (
                        <div className="transaction-row" key={item.id}>
                          <div>
                            <strong>{item.title}</strong>
                            <p>{item.category} · {item.date}</p>
                          </div>

                          <strong
                            className={
                              item.type === "Income" ? "income" : "expense"
                            }
                          >
                            {item.type === "Income" ? "+" : "-"} Rp{" "}
                            {Number(item.amount).toLocaleString("id-ID")}
                          </strong>
                        </div>
                      ))
                    )}
                  </div>
                </section>
              </>
            )}

            {/* RECORD TRANSACTION */}
            {page === "Record Transaction" && (
              <section className="panel transaction-form">
                <h3>Add New Transaction</h3>
                <p>Enter the details of your financial activity.</p>

                <form onSubmit={addTransaction}>
                  <label>Transaction Type</label>

                  <div className="type-buttons">
                    <button
                      type="button"
                      className={type === "Income" ? "selected" : ""}
                      onClick={() => setType("Income")}
                    >
                      + Income
                    </button>

                    <button
                      type="button"
                      className={type === "Expense" ? "selected" : ""}
                      onClick={() => setType("Expense")}
                    >
                      − Expense
                    </button>
                  </div>

                  <label>Transaction Name</label>
                  <input
                    name="title"
                    placeholder="e.g. Monthly allowance"
                    required
                  />

                  <label>Category</label>
                  <select name="category" required>
                    <option value="">Choose category</option>

                    {(type === "Income"
                      ? ["Allowance", "Salary", "Gift", "Other Income"]
                      : ["Food", "Transport", "Shopping", "Education", "Other Expense"]
                    ).map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>

                  <label>Amount (Rp)</label>
                  <input
                    name="amount"
                    type="number"
                    min="1"
                    step="any"
                    placeholder="Enter amount"
                    required
                  />

                  <label>Date</label>
                  <input
                    name="date"
                    type="date"
                    defaultValue={new Date().toLocaleDateString("en-CA")}
                    required
                  />

                  <button
                    className="submit-button"
                    type="submit"
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save Transaction"}
                  </button>
                </form>
              </section>
            )}

            {/* MONTHLY JOURNAL */}
            {page === "Monthly Journal" && (
              <>
                <section className="panel">
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "15px"
                    }}
                  >
                    <div>
                      <h3>Monthly Journal</h3>
                      <p>Review your financial activity by month.</p>
                    </div>

                    <div>
                      <label
                        htmlFor="month-filter"
                        style={{ display: "block", marginBottom: "6px" }}
                      >
                        Select Month
                      </label>

                      <input
                        id="month-filter"
                        type="month"
                        value={selectedMonth}
                        onChange={(event) =>
                          setSelectedMonth(event.target.value)
                        }
                      />
                    </div>
                  </div>
                </section>

                <section className="summary-grid">
                  <div className="summary-card">
                    <p>Monthly Income</p>
                    <h2>
                      Rp {monthlyIncome.toLocaleString("id-ID")}
                    </h2>
                    <span>↗ Money received</span>
                  </div>

                  <div className="summary-card">
                    <p>Monthly Expenses</p>
                    <h2>
                      Rp {monthlyExpenses.toLocaleString("id-ID")}
                    </h2>
                    <span>↘ Money spent</span>
                  </div>

                  <div className="summary-card">
                    <p>Monthly Balance</p>
                    <h2>
                      Rp {monthlyBalance.toLocaleString("id-ID")}
                    </h2>
                    <span>{monthLabel}</span>
                  </div>
                </section>

                <section className="panel">
                  <h3>Transactions - {monthLabel}</h3>

                  <p>
                    {monthlyTransactions.length} transaction(s) recorded
                  </p>

                  {monthlyTransactions.length === 0 ? (
                    <p>No transactions found for this month.</p>
                  ) : (
                    monthlyTransactions.map((item) => (
                      <div className="transaction-row" key={item.id}>
                        <div>
                          <strong>{item.title}</strong>
                          <p>{item.category} · {item.date}</p>
                        </div>

                        <strong
                          className={
                            item.type === "Income" ? "income" : "expense"
                          }
                        >
                          {item.type === "Income" ? "+" : "-"} Rp{" "}
                          {Number(item.amount).toLocaleString("id-ID")}
                        </strong>
                      </div>
                    ))
                  )}
                </section>
              </>
            )}

            {/* SETTINGS */}
            {page === "Settings" && (
              <section className="panel">
                <h3>Appearance</h3>
                <p>Choose how FINTRACKER looks on your screen.</p>

                <button onClick={() => setDarkMode(!darkMode)}>
                  Switch to {darkMode ? "Light" : "Dark"} Mode
                </button>

                <div className="tutorial-settings">
                  <h3>Need some help?</h3>
                  <p>
                    Learn how to use FINTRACKER and explore its features.
                  </p>

                  <button
                    className="submit-button"
                    onClick={openTutorial}
                  >
                    ✦ View Tutorial Again
                  </button>
                </div>
              </section>
            )}

          </>
        )}
      </main>

      {/* WELCOME TUTORIAL */}
      {showTutorial && (
        <div className="tutorial-overlay">
          <div className="tutorial-modal">

            <button
              className="tutorial-close"
              onClick={finishTutorial}
              aria-label="Skip tutorial"
            >
              ×
            </button>

            <div className="tutorial-brand">
              ✦ FINTRACKER
            </div>

            <div className="tutorial-icon">
              {currentTutorial.icon}
            </div>

            <p className="tutorial-label">
              {currentTutorial.label}
            </p>

            <h2>{currentTutorial.title}</h2>

            <p className="tutorial-description">
              {currentTutorial.description}
            </p>

            <div className="tutorial-detail">
              {currentTutorial.detail}
            </div>

            <div className="tutorial-progress">
              {tutorialSteps.map((step, index) => (
                <span
                  key={step.label}
                  className={index === tutorialStep ? "active" : ""}
                />
              ))}
            </div>

            <div className="tutorial-actions">
              <button
                className="tutorial-skip"
                onClick={finishTutorial}
              >
                Skip
              </button>

              <div className="tutorial-navigation">
                {tutorialStep > 0 && (
                  <button
                    className="tutorial-back"
                    onClick={previousTutorial}
                  >
                    Back
                  </button>
                )}

                <button
                  className="tutorial-next"
                  onClick={nextTutorial}
                >
                  {tutorialStep === tutorialSteps.length - 1
                    ? "Get Started"
                    : "Next →"}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default App;
