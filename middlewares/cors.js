import cors from "cors";
const ACCEPTED_ORIGINS = ["http://127.0.0.1:5500"];

const corsOptions = {
  origin: function (origin, callback) {
    if (ACCEPTED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }

    if (!origin) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },
  optionsSuccessStatus: 200,
};

export const corsMiddleware = () => cors(corsOptions);
