const Canvas = require('../models/canvasModel');

const getAllCanvases = async function (req, res) {
    const email = req.email || req.body?.email;

    if (!email) {
        return res.status(400).json({ message: "User email is required" });
    }

    try {
        const canvases = await Canvas.getAllCanvas(email);
        res.status(200).json(canvases);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const createCanvas = async (req, res) => {
    const email = req.email || req.body?.email;
    const { name } = req.body || {};

    if (!name) {
        return res.status(400).json({ message: "Canvas name is required" });
    }

    try {
        const newCanvas = await Canvas.createCanvas(name, email);
        res.status(201).json(newCanvas);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const deleteCanvas = async (req, res) => {
    try {
        const { canvasId } = req.params;
        const email = req.email || req.body?.email;

        if (!canvasId) {
            return res.status(400).json({ message: "Canvas ID is required" });
        }

        const deletedCanvas = await Canvas.deleteCanvas(canvasId, email);
        res.status(200).json({
            message: "Canvas deleted successfully",
            canvas: deletedCanvas
        });
    } catch (error) {
        res.status(400).json({ message: "Error deleting canvas: " + error.message });
    }
};
const loadCanvas = async (req, res) => {
    try {
        const email = req.email;
        const id = req.params.id;
        const canvas = await Canvas.loadCanvas(id, email);
        res.status(200).json(canvas);
    }
    catch (error) {
        res.status(400).json({ message: "Error loading canvas: " + error.message });
    }
}
const updateCanvas = async (req, res) => {
    // console.log("HERE");
    try {
        const email = req.email;
        const { id, elements } = req.body;
        if (!id || !elements) {
            throw new Error("Canvas id or elements not found");
        }
        const canvas = await Canvas.updateCanvas(id, email, elements);
        res.status(200).json({ msg: "Canvas updated succesfully" });
    }
    catch (e) {
        res.status(400).json({ msg: "Error updating canvas: " + e.message });
    }
}
const shareCanvas = async (req, res) => {
    try {
        const { canvasId, shareWithEmail } = req.body;
        const email = req.email;
        // console.log(canvasId, shareWithEmail, email);
        if (!canvasId || !shareWithEmail || !email) {
            throw new Error("Please provide canvas id and share with email address");
        }
        const result = await Canvas.shareCanvas(canvasId, email, shareWithEmail);
        res.status(200).json({ message: "Canvas shared successfully" });
    }
    catch (e) {
        res.status(400).json({ message: "Error sharing canvas: " + e.message });
    }
}
module.exports = { getAllCanvases, createCanvas, deleteCanvas, loadCanvas, updateCanvas, shareCanvas };