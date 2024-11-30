require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const session = require("express-session");
const flash = require("connect-flash");
const { Server } = require("socket.io");
const http = require("http");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
const server = http.createServer(app);
const io = new Server(server);
const PORT = 3000;

// Middleware
app.use(cors()); // Enable CORS
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


// Session and Flash Messages
app.use(session({
    secret: process.env.SESSION_SECRET || "defaultSecret",
    resave: false,
    saveUninitialized: true,
}));
app.use(flash());
app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    next();
});

// Static Files
app.use(express.static(path.join(__dirname, "public")));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => console.error("Database connection error:", err));

// Routes

const addStudentsRoutes = require("./routes/addStudents");
const viewStudentsRoutes = require("./routes/viewStudents");
const addPapersRoutes = require("./routes/addPapers");
const uploadPapersRoutes = require("./routes/uploadPapers");
const showPapersRoutes = require("./routes/showPapers");
const examinerRoutes = require("./routes/examiner");
const addStudRoutes = require("./routes/addStud");
const createClassRouter = require("./routes/createClass")(io);

app.use("/addStudents", addStudentsRoutes);
app.use("/viewStudents", viewStudentsRoutes);
app.use("/addPapers", addPapersRoutes);
app.use("/uploadPapers", uploadPapersRoutes);
app.use("/showPapers", showPapersRoutes);
app.use("/examiner", examinerRoutes);
app.use("/addStud", addStudRoutes);
app.use("/createClass", createClassRouter);
app.use("/examiner", examinerRoutes);


// Socket.IO
io.on("connection", (socket) => {
    console.log("A user connected");

    socket.on("joinRoom", (roomId) => {
        socket.join(roomId);
        console.log(`User joined room: ${roomId}`);
    });

    socket.on("message", ({ roomId, message }) => {
        io.to(roomId).emit("message", message);
        console.log(`Message sent to room ${roomId}: ${message}`);
    });

    socket.on("disconnect", () => {
        console.log("A user disconnected");
    });
});

// Root Route
app.get("/", (req, res) => {
    res.send("App Work..!");
});

// Error Handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send("Something went wrong!");
});

// Start Server
server.listen(PORT, () => {
    console.log(`App running on http://localhost:${PORT}`);
});
