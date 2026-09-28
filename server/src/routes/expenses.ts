import { Router } from "express";
import { db } from "../../../db/src/prisma/db.js";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { amount, description, paidById, participants } = req.body;

    const expense = await db.orm.public.Expense.create({
      amount,
      description,
      paidById,
    });

    for (const participant of participants) {
      await db.orm.public.ExpenseParticipants.create({
        expenseId: expense.id,
        userId: participant.userId,
        amountOwed: participant.amountOwed,
      });
    }

    res.status(201).json(expense);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to create expense" });
  }
});


router.get("/", async (req, res) => {
  try {
    const expenses = await db.orm.public.Expense.all();

    res.json(expenses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to get expenses" });
  }
});

router.get("/balances", async (req, res) => {
  try {
    const expenses = await db.orm.public.Expense
      .include("participants")
      .all();

    const balances: Record<number, number> = {};

    for (const expense of expenses) {
      const payerId = expense.paidById;

      balances[payerId] =
        (balances[payerId] || 0) + Number(expense.amount);

      for (const participant of expense.participants) {
        balances[participant.userId] =
          (balances[participant.userId] || 0) -
          Number(participant.amountOwed);
      }
    }

    res.json(balances);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to calculate balances",
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const expense = await db.orm.public.Expense
      .where({ id })
      .include("participants")
      .first();

    if (!expense) {
      return res.status(404).json({
        message: "Expense not found"
      });
    }

    res.json(expense);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to get expense"
    });
  }
});




export default router;