import mongoose from 'mongoose';

const contentSchema = new mongoose.Schema({
    query: {
        type: String,
        required: true,
        trim: true
    },
    content: {
        type: String,
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt timestamp before saving
contentSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const Content = mongoose.model('Content', contentSchema);

export default Content;