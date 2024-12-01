const express = require("express");
const router = express.Router();
const Room = require("../models/Room"); // Import the Room model

module.exports = (io) => {


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
    router.get("/room/:roomId", async (req, res) => {
        try {
            const room = await Room.findOne({ roomId: req.params.roomId });
            if (!room) {
                req.flash("error", "Classroom not found!");
                return res.redirect("/createClass/showRooms");
            }
            res.render("Examiner/room", { room, moment: require("moment") });
        } catch (error) {
            console.error("Error finding room:", error);
            req.flash("error", "Failed to fetch classroom details.");
            res.redirect("/createClass/showRooms");
        }
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


    // Endpoint to validate room ID
    router.post("/validateRoom", async (req, res) => {
        const { roomId } = req.body;
        console.log("Validating Room ID:", roomId);
    
        try {
            const room = await Room.findOne({ roomId });
            console.log("Room found:", room);
            if (room) {
                return res.status(200).json({ success: true, message: "Room found." });
            }
            return res.status(404).json({ success: false, message: "Room not found." });
        } catch (error) {
            console.error("Error validating room:", error);
            res.status(500).json({ success: false, message: "Internal server error." });
        }
    });
    

    // Endpoint to add a participant to a room
    router.post("/addParticipant", async (req, res) => {
        const { rollNumber, roomId } = req.body;

        try {
            const room = await Room.findOne({ roomId });
            if (room) {
                const participant = {
                    rollNo: rollNumber,
                    joinTime: new Date(),
                };
                room.participants.push(participant);
                await room.save();
                console.log("Updated Room Data:", room);

                io.emit("participantJoined", { roomId, participant });
                console.log("Emitted participantJoined:", { roomId, participant });
                return res.status(200).json({ success: true, message: "Participant added successfully." });
            }

            return res.status(404).json({ success: false, message: "Room not found." });
        } catch (error) {
            console.error("Error adding participant:", error);
            res.status(500).json({ success: false, message: "Internal server error." });
        }
    });

    return router;
};