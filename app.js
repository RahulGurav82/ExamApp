require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const path = require("path");
const session = require("express-session");
const flash = require("connect-flash");
const { Server } = require("socket.io");
const http = require("http");

const addStudentsRoutes = require("./routes/addStudents");
const viewStudentsRoutes = require("./routes/viewStudents");
const addPapersRoutes = require("./routes/addPapers"); 
const uploadPapersRoutes = require("./routes/uploadPapers"); 
const showPapersRoutes = require("./routes/showPapers");
const examinerRoutes = require("./routes/examiner"); // Import the route
const createClassRoutes = require("./routes/createClass");
const addStudRoutes = require("./routes/addStud");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = 3000;

// Middleware setup
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(cors()); // Enable CORS

// Setup express-session for flash messages
app.use(
    session({
        secret: "secret", // Use a secure key in production
        resave: false,
        saveUninitialized: true,
    })
);

// Setup connect-flash
app.use(flash());

// Flash message middleware to set success/error messages
app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    next();
});

// MongoDB connection
mongoose
    .connect("mongodb+srv://Rahul:Rahul@mario.b6prz.mongodb.net/college", {
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

app.get("/", (req, res) => {
    res.send("App Work..!");
});

// Handle socket.io connections
io.on("connection", (socket) => {
    console.log("A user connected");

    // Join a room by the 5-character room ID
    socket.on("joinRoom", (roomId) => {
        socket.join(roomId);
        console.log(`User joined room: ${roomId}`);
    });

    // Broadcast message to the room
    socket.on("message", ({ roomId, message }) => {
        io.to(roomId).emit("message", message);
        console.log(`Message sent to room ${roomId}: ${message}`);
    });

    // Handle disconnection
    socket.on("disconnect", () => {
        console.log("A user disconnected");
    });
});


// Start server
app.listen(PORT, () => {
    console.log(`App running on http://localhost:${PORT}`);
});