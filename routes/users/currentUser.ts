import express from "express";

import { currentUser } from "../../middleware/current-user";

const router = express.Router();

// Return info on the user as defined by the JWT
router.get("/api/users/current-user", currentUser, (req, res) => {
  res.send({ currentUser: req.currentUser || null });
});

export { router as currentUserRouter };
