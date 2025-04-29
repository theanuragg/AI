import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import cors from 'cors';
import { marked } from 'marked'; // Import marked to parse markdown

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors({ origin: '*' }));

// Endpoint for generating content
app.post('/api/generate', async (req, res) => {
  const { prompt } = req.body;
  
  // Check if prompt is provided
  if (!prompt) {
     res.status(400).json({ error: 'Prompt is required' });
  }
  
  try {
    // Call the Google Gemini API
    interface GeminiResponse {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    }

    const response = await axios.post<GeminiResponse>(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
      {
        contents: [{ parts: [{ text: prompt }] }]
      },
      {
        headers: { 'Content-Type': 'application/json' },
        params: { key: process.env.GEMINI_API_KEY }
      }
    );
    
    console.log('Raw response:', response.data); // Debugging raw response
    
    // Extract generated content from the response
    const generatedText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (generatedText) {
      // Process text as markdown to handle code blocks and formatting
      const htmlContent = marked(generatedText);
      
      // Return the HTML content
      res.json({ 
        text: generatedText, // Original text for reference
        html: htmlContent     // HTML content for rendering
      });
    } else {
      res.status(500).json({ error: 'No response content from AI.' });
    }
  } catch (error: any) {
    // Improved error handling
    console.error('Error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Error generating content' });
  }
});

const PORT = 8000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});