import express from "express";
import http from "http";
import { Server as IOServer } from "socket.io";
import cors from "cors";
const app = express();
const server = http.createServer(app);
const io = new IOServer(server, {
    cors: {
        origin: "https://rider-tracking-git-main-harshans-projects-45bd805f.vercel.app/", // your Vite frontend origin
        methods: ["GET", "POST"]
    }
});
app.use(cors());
app.use(express.json());
// In-memory store for latest rider locations
const riders = new Map();
app.get('/', (req, res) => {
    res.send('Server is up now!');
});
// Simple API to update rider location (use POST from Postman / curl)
app.post("/update-location", (req, res) => {
    const { riderId, lat, lng } = req.body;
    if (!riderId || typeof lat !== "number" || typeof lng !== "number") {
        return res.status(400).json({
            error: "Missing or invalid fields. Expect { riderId: string, lat: number, lng: number }"
        });
    }
    const payload = {
        riderId,
        lat,
        lng,
        updatedAt: new Date().toISOString()
    };
    // Save latest
    console.log("Saving rider location:", riders);
    riders.set(riderId, payload);
    // Emit to all connected clients (admins)
    io.emit("riderLocationUpdate", payload);
    console.log("Updated rider location:", payload);
    return res.json({ success: true, payload });
});
io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);
    // Send current riders to the newly connected client
    for (const loc of riders.values()) {
        socket.emit("riderLocationUpdate", loc);
    }
    socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
    });
});
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
