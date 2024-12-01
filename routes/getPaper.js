const express = require("express");
const router = express.Router();
const Paper = require("../models/Papers"); // Replace with the correct model import

// Endpoint to fetch paper by QP code
router.get("/", async (req, res) => {
    console.log("Received request to fetch paper.");
    console.log("Query Parameters:", req.query);
    console.log("Request Body (if any):", req.body);

    const { qpCode } = req.query;

    if (!qpCode) {
        console.log("Error: Missing qpCode in query parameters.");
        return res.status(400).json({ success: false, message: "QP Code is required" });
    }

    console.log(`Searching for paper with QP Code: ${qpCode}`);

    try {
        const paper = await Paper.findOne({ qpCode }); // Find the paper by QP code

        if (!paper) {
            console.log(`No paper found for QP Code: ${qpCode}`);
            return res.status(404).json({ success: false, message: "Paper not found" });
        }

        console.log(`Paper found for QP Code: ${qpCode}`);
        console.log("Paper Data:", paper);

        res.json({
            success: true,
            data: paper.image, // Assuming `image` contains the Base64 or URL of the image
        });
    } catch (error) {
        console.error("Error fetching paper:", error.message);
        console.error("Stack Trace:", error.stack);

        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

module.exports = router;
