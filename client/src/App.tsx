import { useEffect, useState } from "react";

const API = "http://localhost:3000";

type User = {
  id: number;
  name: string;
  email: string;
};

type Participant = {
  id: number;
  userId: number;
  amountOwed: number | string;
};

type Expense = {
  id: number;
  amount: number | string;
  description: string;
  paidById: number;
  created: string;
  participants: Participant[];
};

function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paidById, setPaidById] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);

  const [loading, setLoading] = useState(false);

  // -----------------------------
  // LOAD USERS
  // -----------------------------

  const fetchUsers = async () => {
    const response = await fetch(`${API}/users`);
    const data = await response.json();

    setUsers(data);
  };

  // -----------------------------
  // LOAD EXPENSES + PARTICIPANTS
  // -----------------------------

  const fetchExpenses = async () => {
    const response = await fetch(`${API}/expenses`);
    const data = await response.json();

    // Get participants for every expense
    const detailedExpenses: Expense[] = await Promise.all(
      data.map(async (expense: Expense) => {
        const response = await fetch(`${API}/expenses/${expense.id}`);
        return response.json();
      })
    );

    setExpenses(detailedExpenses);
  };

  useEffect(() => {
    fetchUsers();
    fetchExpenses();
  }, []);

  // -----------------------------
  // CALCULATE BALANCES
  // -----------------------------

  const calculateBalances = () => {
    const result: Record<number, number> = {};

    // Start everybody at 0
    users.forEach((user) => {
      result[user.id] = 0;
    });

    for (const expense of expenses) {
      const total = Number(expense.amount);
      const payerId = expense.paidById;

      // Payer gets the FULL amount as positive
      result[payerId] = (result[payerId] || 0) + total;

      // People who owe money get negative balance
      for (const participant of expense.participants) {
        // Never make payer owe himself
        if (participant.userId === payerId) {
          continue;
        }

        const owed = Number(participant.amountOwed);

        result[participant.userId] =
          (result[participant.userId] || 0) - owed;
      }
    }

    return result;
  };

  const balances = calculateBalances();

  // -----------------------------
  // CREATE EXPENSE
  // -----------------------------

  const createExpense = async () => {
    if (!description.trim()) {
      alert("Enter a description");
      return;
    }

    const total = Number(amount);

    if (!total || total <= 0) {
      alert("Enter a valid amount");
      return;
    }

    if (!paidById) {
      alert("Select who paid");
      return;
    }

    if (selectedUsers.length === 0) {
      alert("Select who participated");
      return;
    }

    const payerId = Number(paidById);

    // Remove payer from people who owe money
    const peopleWhoOwe = selectedUsers.filter(
      (userId) => userId !== payerId
    );

    if (peopleWhoOwe.length === 0) {
      alert("Select at least one person other than the payer");
      return;
    }

    // Split the FULL amount between the people who owe
const participants = peopleWhoOwe.map((userId) => ({
  userId,
  amountOwed: total,
}));

    try {
      setLoading(true);

      const response = await fetch(`${API}/expenses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: total,
          description: description.trim(),
          paidById: payerId,
          participants,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create expense");
      }

      // Reset form
      setDescription("");
      setAmount("");
      setPaidById("");
      setSelectedUsers([]);

      // Reload expenses
      await fetchExpenses();
    } catch (error) {
      console.error(error);
      alert("Failed to create expense");
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------
  // HELPERS
  // -----------------------------

  const getUserName = (id: number) => {
    return users.find((user) => user.id === id)?.name || "Unknown";
  };

  return (
    <div
      style={{
        maxWidth: "900px",
        margin: "0 auto",
        padding: "30px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1>ExpenseManager</h1>

      <p style={{ color: "#666" }}>
        Track shared expenses and see who owes whom.
      </p>

      {/* ========================= */}
      {/* BALANCES */}
      {/* ========================= */}

      <section
        style={{
          border: "1px solid #ddd",
          borderRadius: "10px",
          padding: "20px",
          marginBottom: "30px",
        }}
      >
        <h2>Balances</h2>

        {users.length === 0 && <p>No users yet.</p>}

        {users.map((user) => {
          const balance = balances[user.id] || 0;

          return (
            <div
              key={user.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "12px 0",
                borderBottom: "1px solid #eee",
              }}
            >
              <strong>{user.name}</strong>

              <strong
                style={{
                  color:
                    balance > 0
                      ? "green"
                      : balance < 0
                      ? "red"
                      : "#666",
                }}
              >
                {balance > 0 && "+"}
                ₹{balance.toFixed(2)}
              </strong>
            </div>
          );
        })}

        <p style={{ color: "#666", fontSize: "14px" }}>
          + = should receive &nbsp; | &nbsp; - = owes
        </p>
      </section>

      {/* ========================= */}
      {/* CREATE EXPENSE */}
      {/* ========================= */}

      <section
        style={{
          border: "1px solid #ddd",
          borderRadius: "10px",
          padding: "20px",
          marginBottom: "30px",
        }}
      >
        <h2>Add Expense</h2>

        <input
          style={{ padding: "10px", width: "250px" }}
          placeholder="What was it for?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <br />
        <br />

        <input
          style={{ padding: "10px", width: "250px" }}
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        <br />
        <br />

        <select
          style={{ padding: "10px", width: "275px" }}
          value={paidById}
          onChange={(e) => setPaidById(e.target.value)}
        >
          <option value="">Who paid?</option>

          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </select>

        <h3>Who was this expense for?</h3>

        {users
  .filter((user) => user.id !== Number(paidById))
  .map((user) => (
    <label
      key={user.id}
      style={{
        display: "block",
        marginBottom: "8px",
      }}
    >
      <input
        type="checkbox"
        checked={selectedUsers.includes(user.id)}
        onChange={() => {
          setSelectedUsers((current) =>
            current.includes(user.id)
              ? current.filter((id) => id !== user.id)
              : [...current, user.id]
          );
        }}
      />

      {"  "}
      {user.name}
    </label>
  ))}

        <br />

        <button
          onClick={createExpense}
          disabled={loading}
          style={{
            padding: "10px 20px",
            cursor: "pointer",
          }}
        >
          {loading ? "Adding..." : "Add Expense"}
        </button>
      </section>

      {/* ========================= */}
      {/* EXPENSE HISTORY */}
      {/* ========================= */}

      <section>
        <h2>Expense History</h2>

        {expenses.length === 0 ? (
          <p>No expenses yet.</p>
        ) : (
          expenses.map((expense) => (
            <div
              key={expense.id}
              style={{
                border: "1px solid #ddd",
                borderRadius: "10px",
                padding: "15px",
                marginBottom: "12px",
              }}
            >
              <h3>{expense.description}</h3>

              <p>
                <strong>₹{Number(expense.amount).toFixed(2)}</strong>
              </p>

              <p>
                Paid by{" "}
                <strong>{getUserName(expense.paidById)}</strong>
              </p>

              <p>
                Owed by:
              </p>

              {expense.participants.map((participant) => (
                <div key={participant.id}>
                  {getUserName(participant.userId)} owes ₹
                  {Number(participant.amountOwed).toFixed(2)}
                </div>
              ))}
            </div>
          ))
        )}
      </section>
    </div>
  );
}

export default App;