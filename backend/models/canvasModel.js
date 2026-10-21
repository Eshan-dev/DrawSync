const mongoose = require('mongoose');
// const Users = require('./userModels');

const canvasSchema = new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users",
        required: true,
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    elements: {
        type: [{ type: mongoose.Schema.Types.Mixed }],
    },
    shared_with: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Users",
        },
    ],
}, {
    timestamps: true
}
);

canvasSchema.statics.getAllCanvas = async function (email) {
    const user = await mongoose.model('Users').findOne({ email });
    if (!user) {
        throw new Error("User not found");
    }
    const id = user._id;
    try {
        const canvases = await this.find(
            {
                $or: [{ owner: id }, { shared_with: id }]
            }
        );
        // console.log("canvases : " + canvases);
        return canvases;
    }
    catch (error) {
        throw new Error("Error fetching canvases: " + error.message);
    }
};

canvasSchema.statics.createCanvas = async function (name, email) {
    const user = await mongoose.model('Users').findOne({ email });
    try {
        if (!user) {
            throw new Error("User not Found");
        }
        const canvas = new this({
            owner: user._id,
            name,
            elements: [],
            shared_with: []
        });
        const newCanvas = await canvas.save();
        return newCanvas;
    } catch (error) {
        throw new Error("Error creating canvas: " + error.message);
    }
}

canvasSchema.statics.deleteCanvas = async function (canvasId, email) {
    try {
        const canvas = await this.findById(canvasId);
        const user = await mongoose.model("Users").findOne({ email });
        if (!user) {
            throw new Error("User not found");
        }
        if (!canvas) {
            throw new Error("Canvas not found");
        }
        if (!canvas.owner.equals(user._id)) {
            throw new Error("User is not Authorized to delete this canvas");
        }
        else {
            const sol = await this.findByIdAndDelete(canvasId);
            return sol;
        }
    }
    catch (error) {
        throw new Error("Error deleting canvas: " + error.message);
    }
}
canvasSchema.statics.loadCanvas = async function (id, email) {
    try {
        const canvas = await this.findById(id);
        const user = await mongoose.model("Users").findOne({ email });
        if (!user || !canvas) {
            throw new Error("User not found");
        }
        if (!canvas.owner._id.equals(user._id) && !canvas.shared_with.includes(user._id)) {
            throw new Error("User is not Authorized to access this canvas");
        }
        return canvas;
    }
    catch (error) {
        throw new Error("Error loading canvas: " + error.message);
    }
}
canvasSchema.statics.updateCanvas = async function (id, email, elements) {
    try {
        const canvas = await this.findById(id);
        const user = await mongoose.model("Users").findOne({ email });
        if (!user) {
            throw new Error("User not found");
        }
        if (!canvas) {
            throw new Error("Canvas not found");
        }
        if (!canvas.owner._id.equals(user._id) && !canvas.shared_with.includes(user._id)) {
            throw new Error("User is not Authorized to update this canvas");
        }
        canvas.elements = elements;
        const updatedCanvas = await canvas.save();
        return updatedCanvas;
    }
    catch (error) {
        throw new Error("Error updating canvas: " + error.message);
    }
}
canvasSchema.statics.shareCanvas = async function (canvasId, ownerEmail, sharedWithEmail) {
    try {
        const canvas = await this.findById(canvasId);
        const ownerUser = await mongoose.model("Users").findOne({ email: ownerEmail });
        const sharedWithUser = await mongoose.model("Users").findOne({ email: sharedWithEmail });
        if (!canvas || !ownerUser || !sharedWithUser) {
            throw new Error("Canvas or user not found");
        }
        if (!canvas.owner.equals(ownerUser._id)) {
            throw new Error("User is not Authorized to share this canvas");
        }
        if (canvas.shared_with.includes(sharedWithUser._id)) {
            throw new Error("Canvas is already shared with User");
        }
        canvas.shared_with.push(sharedWithUser._id);
        await canvas.save();
        return {
            message: "Canvas shared successfully"
        }
    }
    catch (error) {
        throw new Error("Error sharing canvas: " + error.message);
    }
}
const Canvas = mongoose.model("Canvas", canvasSchema);
module.exports = Canvas;

