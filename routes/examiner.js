const express = require("express");
const router = express.Router();

// Examiner main page
router.get("/", (req, res) => {
    res.render("examiner/examiner");
});

module.exports = router;
