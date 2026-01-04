import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');

// Get the generative model
const getModel = () => {
    return genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
};

/**
 * Generate a bio based on user input
 * @param {Object} params - Parameters for bio generation
 * @param {string} params.name - User's name
 * @param {string} params.faculty - User's faculty
 * @param {string} params.department - User's department
 * @param {string} params.interests - User's interests/hobbies
 * @param {string} params.tone - Desired tone (professional, casual, fun)
 * @returns {Promise<string>} Generated bio
 */
export const generateSmartBio = async ({ name, faculty, department, interests, tone = 'casual' }) => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
        console.warn('Gemini API key not configured. AI features are disabled.');
        return `${name} | ${faculty} student`; // Return basic bio if no API key
    }

    try {
        const model = getModel();

        const prompt = `Generate a short, engaging bio (max 150 characters) for a university student with the following details:
    - Name: ${name}
    - Faculty: ${faculty}
    - Department: ${department}
    - Interests: ${interests}
    - Tone: ${tone}
    
    The bio should be suitable for a campus social network profile. Be creative but appropriate. Only return the bio text, nothing else.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text().trim();
    } catch (error) {
        console.error('Error generating bio:', error);
        throw new Error('Failed to generate bio. Please try again.');
    }
};

/**
 * Polish/enhance a post's text
 * @param {string} text - Original post text
 * @param {string} enhancement - Type of enhancement (grammar, professional, casual, fun)
 * @returns {Promise<string>} Enhanced text
 */
export const polishPost = async (text, enhancement = 'grammar') => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
        console.warn('Gemini API key not configured. AI features are disabled.');
        return text; // Return original text if no API key
    }

    try {
        const model = getModel();

        let instruction = '';
        switch (enhancement) {
            case 'professional':
                instruction = 'Make this text more professional while keeping the core message';
                break;
            case 'casual':
                instruction = 'Make this text more casual and friendly';
                break;
            case 'fun':
                instruction = 'Make this text more fun and engaging, add appropriate emojis';
                break;
            default:
                instruction = 'Fix any grammar or spelling errors, improve clarity';
        }

        const prompt = `${instruction}. Keep the text concise and suitable for a social media post. 
    
Original text: "${text}"

Return only the improved text, nothing else.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text().trim();
    } catch (error) {
        console.error('Error polishing post:', error);
        throw new Error('Failed to polish post. Please try again.');
    }
};

/**
 * Generate post suggestions based on trending topics
 * @param {string[]} trends - Array of trending hashtags
 * @param {string} userContext - Context about the user
 * @returns {Promise<string[]>} Array of post suggestions
 */
export const generatePostSuggestions = async (trends, userContext) => {
    try {
        const model = getModel();

        const prompt = `Based on these trending hashtags: ${trends.join(', ')}
    And this context: ${userContext}
    
    Generate 3 short, engaging post ideas (each under 200 characters) that could spark conversation on a campus social network. Format as a numbered list.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Parse the numbered list
        const suggestions = text
            .split(/\d+\./)
            .filter(s => s.trim())
            .map(s => s.trim());

        return suggestions;
    } catch (error) {
        console.error('Error generating suggestions:', error);
        return [];
    }
};

export default {
    generateSmartBio,
    polishPost,
    generatePostSuggestions
};
