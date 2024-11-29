const express = require("express");
const router = express.Router();
const Student = require("../models/Student"); // Import the Student model

// Handle the POST request to save student data
router.post("/submit", (req, res) => {
    console.log(req.body); // Log the received data
    const { rollNumber, roomId, image } = req.body;
    
    const newStudent = new Student({
        rollNumber,
        roomId,
        image,
    });

    newStudent.save()
        .then(() => {
            res.status(200).send("Student data saved successfully");
        })
        .catch((error) => {
            console.error("Error saving student:", error);
            res.status(500).send("Error saving student");
        });
});


module.exports = router;
