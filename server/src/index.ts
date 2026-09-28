import express from "express";
import cors from "cors";
import usersRouter from "./routes/users.js";
import friendsRouter from "./routes/friends.js";

import expensesRouter from "./routes/expenses.js";

const app = express();
app.use("/friends", friendsRouter);

app.use(cors());
app.use(express.json());
app.use("/expenses", expensesRouter);

app.use("/users", usersRouter);

app.get("/", (req, res) => {
  res.json({ message: "ExpenseManager API is running" });
})

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});