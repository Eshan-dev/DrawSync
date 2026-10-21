require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const connectToDB = require('./db');
const userRoute = require('./routes/userRoute');
const canvasRoute = require('./routes/canvasRoute');

const PORT = process.env.PORT || 3030;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
const CLIENT_URL = process.env.CLIENT_URL || '*';
const JWT_ACCESS_PASS = process.env.JWT_ACCESS_PASS;

const app = express();
connectToDB();
const Canvas = require('./models/canvasModel');
const User = require('./models/userModels');
const jwt = require('jsonwebtoken');

app.use(cors({ origin: CLIENT_URL }));
app.use(express.json());


app.use('/users', userRoute);
app.use('/canvas', canvasRoute);

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: CLIENT_URL,

    },
});
io.on('connection', (socket) => {
    socket.on('join-canvas', async ({ canvasId, token }) => {
        // console.log("canvas id", canvasId);
        if (!token) {
            socket.emit('error', 'token not provided');
            socket.disconnect(true);
            return;
        }
        const canvas = await Canvas.findById(canvasId);
        if (!canvas) {
            socket.emit('error', 'Canvas not found');
            socket.disconnect(true);
            return;
        }
        try {
            const decoded = jwt.verify(token, JWT_ACCESS_PASS);
            if (!decoded) {
                socket.emit('error', 'Invalid token');
                socket.disconnect(true);
                return;
            }
            const email = decoded.email;
            const user = await User.findOne({ email });

            if (!user) {
                socket.emit('error', 'User not found');
                socket.disconnect(true);
                return;
            }

            const isOwner = canvas.owner && canvas.owner.equals(user._id);
            const isShared = (canvas.shared_with && canvas.shared_with.some(id => (id.equals ? id.equals(user._id) : id.toString() === user._id.toString()))) ||
                (canvas.sharedUsers && canvas.sharedUsers.some(id => (id.equals ? id.equals(user._id) : id.toString() === user._id.toString())));

            if (!isOwner && !isShared) {
                socket.emit('error', 'User not authorized');
                socket.disconnect(true);
                return;
            }
        } catch (err) {
            socket.emit('error', 'Invalid token');
            socket.disconnect(true);
            return;
        }
        try {
            socket.join(canvasId);
            if (canvas) {
                socket.emit("recieve-elements", canvas.elements || []);
                // console.log("elements send");
            }
        }
        catch (e) {
            socket.emit("error", e.message);
        }
    })
    socket.on('update-canvas', async ({ elements, canvasId }) => {
        // Only allow updates if the socket has joined the canvas room (requires valid auth via join-canvas)
        if (!socket.rooms.has(canvasId)) {
            socket.emit('error', 'Not authorized to update this canvas');
            return;
        }
        try {
            socket.to(canvasId).emit('recieve-elements', elements);
            await Canvas.findByIdAndUpdate(canvasId, { elements });
        } catch (e) {
            console.error("Error updating canvas:", e.message);
        }
    })
})
server.listen(PORT, () => {
    console.log(`Backend running on ${BASE_URL}`);
});
