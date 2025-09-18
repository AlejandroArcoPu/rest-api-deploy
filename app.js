import express, { json } from "express";
import { createMovieRouter } from "./routes/movies.js";
import { corsMiddleware } from "./middlewares/cors.js";
import "dotenv/config";

export const createApp = ({ movieModel }) => {
  const app = express();

  app.use(json());
  app.use(corsMiddleware());
  app.disable("x-powered-by");

  app.get("/", (req, res) => {
    res.json({ message: "Hola mundo" });
  });

  app.use("/movies", createMovieRouter({ movieModel }));

  const PORT = process.env.PORT ?? 1234;

  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
};
