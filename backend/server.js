//Imports
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const connect = require("./config/db");

//App + Port
const Port = 5000;
const app = express();

const allowedOrigins = ["http://localhost:3000", process.env.FRONTEND_URL].filter(Boolean);

//App Use / MiddleWare
app.use(cors({origin: allowedOrigins, credentials: true}));
app.use(express.json());
app.use((req, res, next) => {
  next();
});

app.use("/api/appointments", require("./routes/appointmentRoutes"));
app.use("/api/doctors", require("./routes/doctorRoutes"));



//Performs connection to mongoDb
connect();

app.get("/health", (req, res) => res.status(200).send("ok"));

//Routes Path
app.use("/api/auth", require("./routes/authRoutes"));


//Runs the Server
app.listen(Port, () => console.log(`Server running on port: ${Port}`));