const express = require("express");
const router = express.Router();
const Room = require("../models/Room"); // Import the Room model
// Import required models
const Degree = require("../models/Degree");
const Student = require("../models/Student");


module.exports = (io) => {
    // Function to generate a random 5-character alphanumeric string
    function generateRoomId() {
        const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";  // Only uppercase characters
        let roomId = "";
        for (let i = 0; i < 5; i++) {
            roomId += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return roomId;
    }
    

    // Render the create class form
    router.get("/", (req, res) => {
        res.render("Examiner/createClass");
    });

    // Handle room creation
    router.post("/", async (req, res) => {
        const { roomName } = req.body;
        const roomId = generateRoomId();

        try {
            const newRoom = new Room({
                roomName,
                roomId,
            });

            console.log("New Room Data:", newRoom); // Log room data before saving
            await newRoom.save();

            io.emit("roomCreated", {
                room: newRoom,
                message: `New classroom "${roomName}" has been created`,
            });

            req.flash("success", "Classroom created successfully!");
            res.redirect("/createClass/showRooms");
        } catch (error) {
            console.error("Error creating room:", error);
            req.flash("error", "Failed to create classroom.");
            res.redirect("/createClass");
        }
    });

    // Show all created rooms
    router.get("/showRooms", async (req, res) => {
        try {
            const rooms = await Room.find().sort({ createdAt: -1 }); // Fetch rooms from DB
            res.render("Examiner/showRooms", {
                rooms,
                moment: require("moment"), // For date formatting
            });
        } catch (error) {
            console.error("Error fetching rooms:", error);
            req.flash("error", "Failed to fetch classrooms.");
            res.redirect("/");
        }
    });

    // Add a new route to join a specific room
    // Add this to the room route
        
    router.get("/room/:roomId", async (req, res) => {
        try {
            const room = await Room.findOne({ roomId: req.params.roomId });
            if (!room) {
                req.flash("error", "Classroom not found!");
                return res.redirect("/createClass/showRooms");
            }

            // Fetch participants with their degree and live images
            const participantsWithImages = await Promise.all(
                room.participants.map(async (participant) => {
                    const degreeData = await Degree.findOne({ rollno: participant.rollNo });
                    const studentData = await Student.findOne({ rollNumber: participant.rollNo });
            
                    return {
                        rollNo: participant.rollNo,
                        joinTime: participant.joinTime,
                        degreeImage: degreeData?.photoUrl || null,
                        liveImage: studentData?.image || null,
                        department: degreeData?.department || "N/A",
                        year: degreeData?.year || "N/A",
                    };
                })
            );        

            res.render("Examiner/room", { 
                room, 
                participants: participantsWithImages,
                moment: require("moment") 
            });
        } catch (error) {
            console.error("Error finding room:", error);
            req.flash("error", "Failed to fetch classroom details.");
            res.redirect("/createClass/showRooms");
        }
    });

// Room logs and streams storage
const roomLogs = {};
const roomStreams = {};

// POST request to add a log entry for a specific room
router.post("/logs/:roomId", (req, res) => {
    const { roomId } = req.params;
    console.log("Request received for room:", roomId);
    console.log("Request body:", req.body);

    const { logMessage, status, rollNumber } = req.body;

    if (!roomLogs[roomId]) {
        roomLogs[roomId] = [];
    }

    const newLog = {
        rollNumber: rollNumber || "Unknown Roll Number",
        message: logMessage || "No logs message provided",
        status: status || "unknown",
        timestamp: new Date(), // Store as ISO string
    };
    

    roomLogs[roomId].push(newLog);
    console.log("Logs for room", roomId, ":", roomLogs[roomId]);

    // Broadcast the new log to connected clients
    if (roomStreams[roomId]) {
        roomStreams[roomId].forEach((stream) => {
            stream.write(`data: ${JSON.stringify(newLog)}\n\n`);
        });
    }

    res.status(200).json({ success: true, message: "Log entry added successfully." });
});

// Route to render logs page for a specific room
router.get("/logs/:roomId", (req, res) => {
    const { roomId } = req.params;
    const logs = roomLogs[roomId] || [];
    res.render("Examiner/logs", { roomId, logs });
});

// Route to fetch logs as JSON
router.get("/logs/:roomId/data", (req, res) => {
    const { roomId } = req.params;
    const logs = roomLogs[roomId] || [];
    res.json(logs);
});

// SSE Route for real-time log updates
router.get("/logs/:roomId/stream", (req, res) => {
    const { roomId } = req.params;

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // Add client to the room's stream list
    if (!roomStreams[roomId]) {
        roomStreams[roomId] = [];
    }
    roomStreams[roomId].push(res);

    // Remove client on disconnect
    req.on("close", () => {
        roomStreams[roomId] = roomStreams[roomId].filter((stream) => stream !== res);
    });
});

    



    // Route to delete a room
    router.post("/deleteRoom/:roomId", async (req, res) => {
        const { roomId } = req.params;

        try {
            const deletedRoom = await Room.findOneAndDelete({ roomId });
            if (deletedRoom) {
                io.emit("roomDeleted", { roomId });
                req.flash("success", `Room "${deletedRoom.roomName}" deleted successfully.`);
            } else {
                req.flash("error", "Room not found.");
            }
        } catch (error) {
            console.error("Error deleting room:", error);
            req.flash("error", "Failed to delete the room.");
        }

        res.redirect("/createClass/showRooms");
    });
    router.post('/CheckRoom', async (req, res) => {
        try {
            const { roomId } = req.body;
    
            if (!roomId) {
                return res.status(400).json({ success: false, message: 'roomId is required' });
            }
    
            // Check if the roomId exists in the database
            const roomExists = await Room.findOne({ roomId });
    
            if (!roomExists) {
                return res.status(200).json({
                    success: false,
                    message: 'Room not found. Unpin and exit the app.',
                    action: 'unpin_exit'
                });
            }
    
            // If roomId exists, return success
            res.status(200).json({
                success: true,
                message: 'Room is active.'
            });
        } catch (error) {
            console.error('Error checking roomId:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    });

    // Endpoint to validate room ID and add a participant
    router.post("/validateRoom", async (req, res) => {
        const { rollNumber, roomId } = req.body;
        console.log("Validating Room ID:", roomId);
    
        try {
            // Step 1: Validate the room
            const room = await Room.findOne({ roomId });
            if (!room) {
                console.error("Room not found:", roomId);
                return res.status(404).json({
                    success: false,
                    message: "Room not found.",
                });
            }
            console.log("Room found:", room);
    
            // Step 2: Validate the student
            const isValidStudent = await validateStudent(rollNumber);
            if (!isValidStudent) {
                console.error(`Validation failed for student roll number: ${rollNumber}`);
                return res.status(400).json({
                    success: false,
                    message: "Invalid roll number. Student validation failed.",
                });
            }
    
            // Step 3: Add the validated participant to the room
            const participant = {
                rollNo: rollNumber,
                joinTime: new Date(),
            };
            room.participants.push(participant);
            await room.save();
    
            console.log("Updated Room Data After Adding Participant:", room);
    
            // Emit event for real-time updates
            io.emit("participantJoined", { roomId, participant });
    
            return res.status(200).json({
                success: true,
                message: "Participant validated and added to the room successfully.",
            });
        } catch (error) {
            console.error("Error validating room or adding participant:", error);
            return res.status(500).json({
                success: false,
                message: "Internal server error.",
            });
        }
    });
    

    // Function to validate a student using the Degree model
    async function validateStudent(rollNumber) {
        try {
            // Query the Degree collection to find a matching roll number
            const student = await Degree.findOne({ rollno: rollNumber });

            // Return true if the student exists, false otherwise
            return !!student;
        } catch (error) {
            console.error("Error validating student:", error);
            return false;
        }
    }


    return router;
};
