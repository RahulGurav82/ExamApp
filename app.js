require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const session = require("express-session");
const flash = require("connect-flash");
const { Server } = require("socket.io");
const http = require("http");
const cors = require("cors");

const addStudentsRoutes = require("./routes/addStudents");
const viewStudentsRoutes = require("./routes/viewStudents");
const addPapersRoutes = require("./routes/addPapers");
const uploadPapersRoutes = require("./routes/uploadPapers");
const showPapersRoutes = require("./routes/showPapers");
const examinerRoutes = require("./routes/examiner");
const createClassRoutes = require("./routes/createClass");
const addStudRoutes = require("./routes/addStud");

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = 3000;

app.use(cors()); // Enable CORS
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Setup session and flash messages
app.use(session({
    secret: "secret", // Use a secure key in production
    resave: false,
    saveUninitialized: true,
}));
app.use(flash());

// Flash message middleware
app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    next();
});

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log("Connected to MongoDB"))
.catch((err) => console.error("Database connection error:", err));

// Routes
app.use("/addStudents", addStudentsRoutes);
app.use("/viewStudents", viewStudentsRoutes);
app.use("/addPapers", addPapersRoutes);
app.use("/uploadPapers", uploadPapersRoutes);
app.use("/showPapers", showPapersRoutes);
app.use("/examiner", examinerRoutes);
app.use("/createClass", createClassRoutes);
app.use("/addStud", addStudRoutes);

// Socket.io connection
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

// Root route
app.get("/", (req, res) => {
    res.send("App Work..!");
});

// Start server
server.listen(PORT, () => {
    console.log(`App running on http://localhost:${PORT}`);
});
