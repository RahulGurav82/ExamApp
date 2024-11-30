const express = require("express");
const router = express.Router();

module.exports = (io) => {
    const rooms = []; // Store rooms in memory
    const userSubmissions = []; // Store user submissions

    // Function to generate a random 5-character alphanumeric string
    function generateRoomId() {
        const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
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
// ... existing code ...

    // Handle room creation
    router.post("/", (req, res) => {
        const { roomName } = req.body;
        const roomId = generateRoomId();
        
        // Create room object with additional details
        const room = {
            roomName,
            roomId,
            createdAt: new Date(),
            active: true,
            participants: []
        };

        rooms.push(room);
        console.log("Rooms after creation:", rooms); // Debug log


        // Emit the new room to all connected clients
        io.emit("roomCreated", {
            room,
            message: `New classroom "${roomName}" has been created`
        });

        req.flash("success", "Classroom created successfully!");
        res.redirect("/createClass/showRooms");
    });

    // Show all created rooms and user submissions
    router.get("/showRooms", (req, res) => {
        // Sort rooms by creation date
        const sortedRooms = rooms.sort((a, b) => b.createdAt - a.createdAt);
        res.render("Examiner/showRooms", { 
            rooms: sortedRooms, 
            userSubmissions,
            moment: require('moment') // For date formatting
        });
    });

    // Add a new route to join a specific room
    router.get("/room/:roomId", (req, res) => {
        const room = rooms.find(r => r.roomId === req.params.roomId);
        if (!room) {
            req.flash("error", "Classroom not found!");
            return res.redirect("/createClass/showRooms");
        }
        res.render("Examiner/room", { room });
    });

    // Endpoint to validate room ID
    router.post("/validateRoom", (req, res) => {
        const { roomId } = req.body;
        console.log("POST /validateRoom called");
        console.log("Body:", req.body);
        console.log("Rooms:", rooms); // Log all rooms
    
        const room = rooms.find(r => r.roomId === roomId);
        if (room) {
            return res.status(200).json({ success: true, message: "Room found." });
        }
        return res.status(404).json({ success: false, message: "Room not found." });
    });
    
    

    // Endpoint to add a participant to a room
    router.post("/addParticipant", (req, res) => {
        const { rollNumber, roomId } = req.body;
        const room = rooms.find(r => r.roomId === roomId);

        if (room) {
            const participant = {
                rollNo: rollNumber,
                joinTime: new Date(),
            };
            room.participants.push(participant);

            // Emit the new participant to all connected clients
            io.emit("participantJoined", { roomId, participant });

            return res.status(200).json({ success: true, message: "Participant added successfully." });
        }

        return res.status(404).json({ success: false, message: "Room not found." });
    });




    return router;
};
