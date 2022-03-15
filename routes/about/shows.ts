import express, { Request, Response, Router } from "express";
import { body, oneOf, param } from "express-validator";
import { Show, ShowSchema } from "../../db/models/shows";
import { BadRequestError } from "../../errors/bad-request-error";
import { NotFoundError } from "../../errors/not-found-error";
import { currentUser } from "../../middleware/current-user";
import { requireAuth } from "../../middleware/require-auth";
import { validateRequest } from "../../middleware/validateRequest";

export interface Show {
  date: string;
  location: string;
  name: string;
}

const router = express.Router();

router.get("/api/about/shows", async (req: Request, res: Response) => {
  const shows = await Show.select({});
  shows.sort((a, b) => {
    if (a.date === undefined || b.date === undefined) return 1;
    return a.date! < b.date! ? -1 : 1;
  });

  const upcomingShows: ShowSchema[] = [];
  const pastShows: ShowSchema[] = [];
  shows.forEach((s) => {
    if (!s.date) upcomingShows.push(s);
    else {
      let now = new Date(Date.now());
      now = new Date(now.toISOString().slice(0, 10));

      if (now < s.date) {
        upcomingShows.push(s);
      } else {
        pastShows.push(s);
      }
    }
  });

  res.status(200).send({
    upcomingShows,
    pastShows,
  });
});

router.post(
  "/api/about/shows",
  currentUser,
  requireAuth,
  [
    body("name").notEmpty().trim().withMessage("name is required"),
    body("location").optional().trim(),
    body("date").optional().isISO8601(),
    body("time").optional().trim(),
    body("description").optional().trim(),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    const { name } = req.body;
    const location: string = req.body.location;
    const date = req.body.date
      ? new Date(req.body.date.slice(0, req.body.date.length - 1))
      : undefined;
    const time: string = req.body.time;
    const description: string = req.body.description;

    const s = await Show.insert({ name, location, date, time, description });

    res.send({
      result: {
        value: 1,
        description: "Show created",
      },
      shows: [
        {
          id: s.id,
          name: s.name,
          location: s.location,
          date: s.date,
          time: s.time,
          description: s.description,
        },
      ],
    });
  }
);

// update the about text
router.put(
  "/api/about/shows",
  currentUser,
  requireAuth,
  [
    body("id").notEmpty().trim().toInt().withMessage("id is required"),
    body("name").notEmpty().trim().withMessage("name is required"),
    body("location").optional().trim(),
    body("date").optional().isDate(),
    body("time").optional().trim(),
    body("description").optional().trim(),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    const { id, name, location, date, time, description } = req.body;
    try {
      const s = await Show.update(
        { id },
        { name, location, date, time, description }
      );

      const updatedShow = s[0];

      res.send({
        result: {
          value: 1,
          description: "Show updated",
        },
        shows: [
          {
            id,
            name: updatedShow.name,
            location: updatedShow.location,
            date: updatedShow.date,
            time: updatedShow.time,
            description: updatedShow.description,
          },
        ],
      });
    } catch (err: any) {
      if (err.message === "Not found") throw new NotFoundError();
      throw err;
    }
  }
);

router.delete(
  "/api/about/shows/:id",
  currentUser,
  requireAuth,
  [param("id").exists().notEmpty().isInt().withMessage("Invalid/Missing id")],
  validateRequest,
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const numDel = await Show.delete({ id: parseInt(id) });

    if (numDel < 1) throw new NotFoundError();

    res.send({
      result: {
        value: numDel,
        description: "Show deleted",
      },
      shows: [
        {
          id,
        },
      ],
    });
  }
);
export { router as showsRouter };
