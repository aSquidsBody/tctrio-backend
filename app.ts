import express from "express";
import "express-async-errors";
import { json } from "body-parser";
import cors from "cors";
import cookieParser from "cookie-parser";

import { initialize as initToken } from "./services/spotify";

import { spotifyTokenRouter } from "./routes/music/token";
import { highlightsRouter } from "./routes/music/spotifyPlaylists";
import { youtubeRouter } from "./routes/videos/youtube";
import { aboutRouter } from "./routes/about/about";
import { showsRouter } from "./routes/about/shows";
import { albumRouter } from "./routes/music/albums";
import { ContactRouter } from "./routes/contact";
import { signupRouter } from "./routes/users/signup";
import { signinRouter } from "./routes/users/signin";
import { currentUserRouter } from "./routes/users/currentUser";
import { NotFoundError } from "./errors/not-found-error";
import { errorHandler } from "./middleware/error-handler";
import { signOutRouter } from "./routes/users/signout";
import { updateRouter } from "./routes/users/update";
import { imagesRouter } from "./routes/images/images";
import { extendSessionRouter } from "./routes/users/extendSession";

require("dotenv").config();

const app = express();

initToken(); // initialize a spotify token

app.set("trust proxy", true);

// Middlewares
app.use(
  cors({
    credentials: true,
    origin: process.env.CLIENT_HOST || "http://localhost:8000",
  })
);
app.use(json()); // creates a .json() method in response objects
app.use(cookieParser());

// Routes
app.use(spotifyTokenRouter);
app.use(highlightsRouter);
app.use(youtubeRouter);
app.use(aboutRouter);
app.use(showsRouter);
app.use(albumRouter);
app.use(ContactRouter);
app.use(signinRouter);
app.use(signupRouter);
app.use(currentUserRouter);
app.use(updateRouter);
app.use(signOutRouter);
app.use(imagesRouter);
app.use(extendSessionRouter);

app.all("*", async (req, res) => {
  throw new NotFoundError();
});

app.use(errorHandler);

export { app };
