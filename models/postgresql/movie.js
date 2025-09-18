import sql from "./db.js";

export class MovieModel {
  static async getAll({ genre }) {
    if (genre) {
      const lowerCaseGenre = genre.toLowerCase();
      const genres = await sql`
      SELECT id, name FROM genre WHERE LOWER(name) = ${lowerCaseGenre};`;
      console.log("genres", genres);
      if (genres.length === 0) return [];
      const [{ id }] = genres;
      const movies = await sql`
        SELECT title, year, director, duration, poster, rate, m.id, g.name \
        FROM movie m INNER JOIN movie_genres mg ON (m.id = mg.movie_id) \
        INNER JOIN genre g ON (mg.genre_id = g.id) \
        WHERE g.id = ${id};`;
      return movies;
    }

    const movies = await sql`
      SELECT title, year, director, duration, poster, rate, id \
      FROM movie;`;
    return movies;
  }

  static async getById({ id }) {
    const movies = await sql`
      SELECT title, year, director, duration, poster, rate, id \
      FROM movie WHERE id = ${id};`;

    if (movies.length === 0) return null;

    return movies[0];
  }

  static async create({ input }) {
    const { title, year, director, duration, poster, genre, rate } = input;

    const uuidResult = await sql`SELECT uuid_generate_v4() as generated_uuid;`;
    const [{ generated_uuid: uuid }] = uuidResult;
    try {
      await sql`
        INSERT INTO movie (id, title, year, director, duration, poster, rate) \
        VALUES (${uuid}, ${title}, ${year}, ${director}, ${duration}, ${poster}, ${rate});`;

      for (const g of genre) {
        const genres = await sql`
          SELECT id FROM genre WHERE name = ${g};`;
        if (genres.length === 0) return null;

        const [{ id: genreId }] = genres;

        await sql`
          INSERT INTO movie_genres (movie_id, genre_id) VALUES \
            (${uuid}, ${genreId});`;
      }
    } catch (e) {
      throw new Error("Error creating the film: ", e);
    }

    const movies = await sql`
      SELECT title, year, director, duration, poster, rate, id \
      FROM movie WHERE id = ${uuid};`;

    return movies[0];
  }

  static async delete({ id }) {
    const movies = await sql`
      SELECT title, year, director, duration, poster, rate, id \
      FROM movie WHERE id = ${id};`;

    if (movies.length === 0) {
      return false;
    }

    try {
      //FK always firsst
      await sql`
        DELETE FROM movie_genres WHERE movie_id = ${id};`;
      await sql`DELETE FROM movie WHERE id = ${id};`;
    } catch (e) {
      throw new Error("Error deleting the film: ", e);
    }
    return true;
  }

  static async update({ id, input }) {
    const movies = await sql`
      SELECT title, year, director, duration, poster, rate, id \
      FROM movie WHERE id = ${id};`;

    if (movies.length === 0) {
      return false;
    }

    const keys = Object.keys(input);

    try {
      await sql`
        UPDATE movie \
        SET ${sql(input, keys)} \
        WHERE id = ${id};`;
    } catch (e) {
      throw new Error("Error updating the film: ", e);
    }
    const updatedMovie = await sql`
      SELECT title, year, director, duration, poster, rate, id \
      FROM movie WHERE id = ${id};`;

    return updatedMovie[0];
  }
}
