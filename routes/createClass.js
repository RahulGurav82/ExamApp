const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

// Configure multer for photo uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, "../public/uploads")); // Directory for storing uploads
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}_${file.originalname}`); // Filename with timestamp
    },
});

const upload = multer({ storage });

// Function to generate a random 5-character alphanumeric string
function generateRoomId() {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let roomId = "";
    for (let i = 0; i < 5; i++) {
        roomId += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return roomId;
}

// Temporary storage for rooms and user submissions
let rooms = [];
let userSubmissions = [];

// Render the create class form
router.get("/", (req, res) => {
    res.render("Examiner/createClass");
});

// Handle room creation
router.post("/", (req, res) => {
    const { roomName } = req.body;

    // Generate a unique room ID using the generateRoomId function
    const roomId = generateRoomId();

    // Save the room details
    rooms.push({ roomName, roomId });

    // Flash success message and redirect to view created rooms
    req.flash("success", "Classroom created successfully!");
    res.redirect("/createClass/showRooms");
});

// Handle user submissions with photo uploads
router.post("/submit", upload.single("photo"), (req, res) => {
    const { rollNo, roomId } = req.body;
    const photoPath = `/uploads/${req.file.filename}`; // Path to uploaded photo

    // Store the submission details
    userSubmissions.push({ rollNo, roomId, photoPath });

    // Respond with success and room ID
    res.json({ success: true, roomId });
});

// Show all created rooms and user submissions
router.get("/showRooms", (req, res) => {
    res.render("Examiner/showRooms", { rooms, userSubmissions });
});

module.exports = router;
