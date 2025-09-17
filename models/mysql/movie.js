import mysql from "mysql2/promise";

const config = {
  host: "localhost",
  user: "root",
  port: 3306,
  password: "",
  database: "moviesdb",
};

const connection = await mysql.createConnection(config);

export class MovieModel {
  static async getAll({ genre }) {
    if (genre) {
      const lowerCaseGenre = genre.toLowerCase();
      const [genres] = await connection.query(
        "SELECT id, name FROM genre WHERE LOWER(name) = ?;",
        [lowerCaseGenre]
      );
      if (genres.length === 0) return [];
      const [{ id }] = genres;
      const [movies] = await connection.query(
        "SELECT title, year, director, duration, poster, rate, BIN_TO_UUID(m.id) id, g.name \
        FROM movie m INNER JOIN movie_genres mg ON (m.id = mg.movie_id) \
        INNER JOIN genre g ON (mg.genre_id = g.id) \
        WHERE g.id = ?;",
        [id]
      );
      return movies;
    }

    const [movies] = await connection.query(
      "SELECT title, year, director, duration, poster, rate, BIN_TO_UUID(id) id \
      FROM movie;"
    );
    return movies;
  }

  static async getById({ id }) {
    const [movies] = await connection.query(
      "SELECT title, year, director, duration, poster, rate, BIN_TO_UUID(id) id \
      FROM movie WHERE BIN_TO_UUID(id) = ?;",
      [id]
    );

    if (movies.length === 0) return null;

    return movies[0];
  }

  static async create({ input }) {
    const { title, year, director, duration, poster, genre, rate } = input;

    const [uuidResult] = await connection.query("SELECT UUID() uuid;");
    const [{ uuid }] = uuidResult;

    try {
      await connection.query(
        "INSERT INTO movie (id, title, year, director, duration, poster, rate) \
        VALUES (UUID_TO_BIN(?), ?, ?, ?, ?, ?, ?);",
        [uuid, title, year, director, duration, poster, rate]
      );

      for (const g of genre) {
        const [genres] = await connection.query(
          "SELECT id FROM genre WHERE name = ?;",
          [g]
        );

        if (genres.length === 0) return null;

        const [{ id: genreId }] = genres;

        await connection.query(
          "INSERT INTO movie_genres (movie_id, genre_id) VALUES \
            (UUID_TO_BIN(?), ?);",
          [uuid, genreId]
        );
      }
    } catch (e) {
      throw new Error("Error creating the film: ", e);
    }

    const [movies] = await connection.query(
      "SELECT title, year, director, duration, poster, rate, BIN_TO_UUID(id) id \
      FROM movie WHERE id = UUID_TO_BIN(?);",
      [uuid]
    );
    return movies[0];
  }

  static async delete({ id }) {
    const [movies] = await connection.query(
      "SELECT title, year, director, duration, poster, rate, id \
      FROM movie WHERE id = UUID_TO_BIN(?);",
      [id]
    );
    if (movies.length === 0) {
      return false;
    }

    const [movieGenres] = await connection.query(
      "SELECT movie_id, genre_id FROM movie_genres \
      WHERE movie_id = UUID_TO_BIN(?);",
      [id]
    );

    try {
      await connection.query("DELETE FROM movie WHERE id = UUID_TO_BIN(?);", [
        id,
      ]);

      await connection.query(
        "DELETE FROM movie_genres WHERE movie_id = UUID_TO_BIN(?);",
        [id]
      );
    } catch (e) {
      throw new Error("Error deleting the film: ", e);
    }
    return true;
  }

  static async update({ id, input }) {
    const [movies] = await connection.query(
      "SELECT title, year, director, duration, poster, rate, BIN_TO_UUID(id) id \
      FROM movie WHERE id = UUID_TO_BIN(?);",
      [id]
    );
    if (movies.length === 0) {
      return false;
    }

    const keysClause = Object.keys(input)
      .map((key) => `${key} = ? `)
      .join(",");
    const valuesClause = Object.values(input);
    valuesClause.push(id);

    try {
      await connection.query(
        `UPDATE movie \
        SET ${keysClause} \
        WHERE id = UUID_TO_BIN(?);`,
        valuesClause
      );
    } catch (e) {
      throw new Error("Error updating the film: ", e);
    }
    const [updatedMovie] = await connection.query(
      "SELECT title, year, director, duration, poster, rate, BIN_TO_UUID(id) id \
      FROM movie WHERE id = UUID_TO_BIN(?);",
      [id]
    );

    return updatedMovie[0];
  }
}
