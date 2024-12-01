const express = require("express");
const router = express.Router();
const Paper = require("../models/Paper"); // Replace with the correct model import

// Endpoint to fetch paper by QP code
router.get("/", async (req, res) => {
    const { qpCode } = req.query;

    try {
        const paper = await Paper.findOne({ qpCode }); // Find the paper by QP code
        if (!paper) {
            return res.status(404).json({ success: false, message: "Paper not found" });
        }

        res.json({
            success: true,
            data: paper.image, // Assuming `image` contains the Base64 or URL of the image
        });
    } catch (error) {
        console.error("Error fetching paper:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

module.exports = router;
