const express = require("express");

const router = express.Router();

// Hardcoded subscription plan JSON
const PLAN = {
    tier: "premium",
    name: "Premium Membership",
    pricing: [
        {
            id: "premium_1month",
            label: "1 Month",
            duration: "1_month",
            price: 100,
            currency: "INR",
            tier: "premium",
        },
        {
            id: "premium_3month",
            label: "3 Months",
            duration: "3_month",
            price: 250,
            currency: "INR",
            tier: "premium",
        },
        {
            id: "premium_1year",
            label: "1 Year",
            duration: "1_year",
            price: 800,
            currency: "INR",
            tier: "premium",
        }
    ]

};

router.get("/", async (req, res) => {
    try {

        console.log("Fetching plan");
        return res.status(200).json({
            success: true,
            plan: PLAN
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: "Failed to fetch plan"
        });
    }

});

module.exports = router;
