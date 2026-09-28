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
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});