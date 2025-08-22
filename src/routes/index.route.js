const express = require('express');
const router = express.Router();

// Health check route
router.get('/', (req, res) => {
    res.json({
        status: 'success',
        message: 'API is running'
    });
});

module.exports = router;
