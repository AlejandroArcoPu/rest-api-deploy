import { validateMovie, validatePartialMovie } from "../schemas/movies.js";
export class MovieController {
  constructor({ movieModel }) {
    this.movieModel = movieModel;
  }
  getAll = async (req, res) => {
    const { genre } = req.query;
    const movies = await this.movieModel.getAll({ genre });
    res.json(movies);
  };

  getById = async (req, res) => {
    const { id } = req.params;
    const movie = await this.movieModel.getById({ id });
    if (!movie) {
      res.status(404).json({ message: "Movie not found" });
      return;
    }
    res.json(movie);
  };

  create = async (req, res) => {
    const result = validateMovie(req.body);

    if (result.error) {
      return res.status(400).json({ error: JSON.parse(result.error.message) });
    }

    try {
      const newMovie = await this.movieModel.create({ input: result.data });
      res.status(201).json(newMovie);
    } catch (e) {
      return res.status(500).json({ error: "Internal server error" });
    }
  };

  delete = async (req, res) => {
    const { id } = req.params;

    const deleted = await this.movieModel.delete({ id });

    if (!deleted) {
      return res.status(404).json({ message: "Movie not found" });
    }

    return res.status(204).json({ message: "Movie deleted" });
  };

  update = async (req, res) => {
    const result = validatePartialMovie(req.body);

    if (result.error) {
      return res.status(400).json({ error: JSON.parse(result.error.message) });
    }

    const { id } = req.params;
    const updatedMovie = await this.movieModel.update({
      id,
      input: result.data,
    });
    if (!updatedMovie) {
      return res.status(404).json({ message: "Movie not found" });
    }
    return res.json(updatedMovie);
  };
}
