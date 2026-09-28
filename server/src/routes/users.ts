import { Router } from "express";
import { db } from "../../../db/src/prisma/db.js";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const user = await db.orm.public.User.create({
      name,
      email,
      password
    });

    res.status(201).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to create user" });
  }
});

router.get("/", async (req, res) => {
  try {
    const users = await db.orm.public.User.all();

    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to get users" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const user = await db.orm.public.User.first({ id });

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to get user"
    });
  }
});

router.get("/search/:name", async (req, res) => {
  const users = await db.orm.public.User
    .where({ name: req.params.name })
    .all();

  res.json(users);
});








export default router;