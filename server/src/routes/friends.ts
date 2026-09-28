import { Router } from "express";
import { db } from "../../../db/src/prisma/db.js";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { userId, friendId } = req.body;

    const friendship = await db.orm.public.Friend.create({
      userId,
      friendId,
      status: "PENDING"
    });

    res.status(201).json(friendship);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to create friendship" });
  }
});


router.patch("/:id/accept", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const friendship = await db.orm.public.Friend
      .where({ id })
      .update({
        status: "ACCEPTED"
      });

    if (!friendship) {
      return res.status(404).json({
        message: "Friend request not found"
      });
    }

    res.json(friendship);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to accept friend request"
    });
  }
});



export default router;