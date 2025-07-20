import "dotenv/config";
import express from "express";
import { connectDb } from "./config/db.js";
import { router } from "./routes/route.js";
import cors from "cors";
import logger from "morgan";
import cookieParser from "cookie-parser";

const port = process.env.PORT || 3001;
const app = express();
app.use(cookieParser());
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// app.use(cors());

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://your-vercel-frontend.vercel.app",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  })
);

app.get("/", (req, res) => {
  res.send("Backend is alive 🚀")
})

app.use("/api", router);

(async function startServer() {
  await connectDb();
  app.listen(port, () => {
    console.log(`Server running on port: ${port}`);
  });
})();
