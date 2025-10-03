require("dotenv").config();

// const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
const admin = require("firebase-admin");

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  }),
});

console.log("Firebase admin initialized", admin);

module.exports = admin;
