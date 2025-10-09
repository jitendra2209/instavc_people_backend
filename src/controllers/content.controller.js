import { GoogleGenerativeAI } from '@google/generative-ai';
import Content from '../models/content.model.js';

console.log('Initializing content controller...');

// Initialize Gemini AI with the API key
const genAI = new GoogleGenerativeAI(process.env.API_KEY);

// Generate content using Gemini AI and store in database
export const generateContent = async (req, res) => {
    console.log('generateContent function called');
    try {
        const { query } = req.body;
        const userId = req.user.id; // Assuming we have user info from auth middleware

        if (!query) {
            return res.status(400).json({
                success: false,
                message: 'Query is required'
            });
        }

        // Initialize the model
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

        // Generate content
        const result = await model.generateContent(query);
        const response = await result.response;
        const generatedText = response.text();

        // Create new content entry in database
        const content = new Content({
            query,
            content: generatedText,
            userId
        });

        // Save to database
        await content.save();

        return res.status(201).json({
            success: true,
            data: content
        });

    } catch (error) {
        console.error('Error generating content:', error);
        return res.status(500).json({
            success: false,
            message: 'Error generating content',
            error: error.message
        });
    }
};

// Get content by ID
export const getContentById = async (req, res) => {
    console.log('getContentById function called with ID:', req.params.id);
    try {
        const { id } = req.params;
        
        // Validate if the id is a valid MongoDB ObjectId
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid content ID format'
            });
        }
        
        const content = await Content.findById(id);

        if (!content) {
            return res.status(404).json({
                success: false,
                message: 'Content not found'
            });
        }

        return res.status(200).json({
            success: true,
            data: content
        });
    } catch (error) {
        console.error('Error fetching content:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching content',
            error: error.message
        });
    }
};

// Get all content for a user
export const getUserContent = async (req, res) => {
    console.log('getUserContent function called');
    try {
        const userId = req.user.id;
        const contents = await Content.find({ userId })
            .sort({ createdAt: -1 }); // Sort by newest first

        return res.status(200).json({
            success: true,
            data: contents
        });
    } catch (error) {
        console.error('Error fetching user content:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching user content',
            error: error.message
        });
    }
};