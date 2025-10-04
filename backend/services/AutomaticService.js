const axios = require('axios');
const { HfInference } = require('@huggingface/inference');

class AutomaticService {
  constructor() {
    this.apiKey = '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';
    this.apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
    this.model = 'meta-llama/llama-3.3-70b-instruct';
    
    // Initialize Hugging Face client
    this.hfToken = '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';
    this.hfClient = new HfInference(this.hfToken);
  }

  async callLlama(prompt) {
    try {
      const response = await axios.post(
        this.apiUrl,
        {
          model: this.model,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 2000
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'http://localhost:3000',
            'X-Title': 'Audio Manager App'
          }
        }
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('Llama API Error:', error.response?.data || error.message);
      throw error;
    }
  }

  async generateTagsTitle(transcription) {
    try {
      console.log('=== LLAMA API CALL START ===');
      console.log('Generating tags and title for transcription:', transcription.substring(0, 100) + '...');
      
      const prompt = `Analyze this audio transcription and respond ONLY with valid JSON (no markdown, no code blocks, no explanations):

Transcription: "${transcription}"

Respond with this exact JSON structure:
{
  "title": "A short descriptive title (max 50 chars)",
  "tags": ["tag1", "tag2", "tag3"],
  "mood": "positive/negative/neutral/excited/sad",
  "summary": "Brief summary (max 200 chars)"
}`;

      console.log('Calling Llama API...');
      let text = await this.callLlama(prompt);
      console.log('=== LLAMA API RESPONSE ===');
      console.log('Full AI Response:', text);
      console.log('Response length:', text.length);

      // Remove markdown code blocks if present
      text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      console.log('Text after cleanup:', text);
      
      // Try to find JSON in the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      console.log('JSON match found:', !!jsonMatch);
      
      if (jsonMatch) {
        console.log('Matched JSON string:', jsonMatch[0]);
        const parsedResult = JSON.parse(jsonMatch[0]);
        console.log('=== PARSED RESULT ===');
        console.log('Parsed result:', JSON.stringify(parsedResult, null, 2));
        
        // Validate the result has required fields
        if (parsedResult.title && parsedResult.tags && parsedResult.mood && parsedResult.summary) {
          console.log('=== VALIDATION PASSED ===');
          console.log('Returning successful result');
          return {
            status: 'success',
            data: parsedResult
          };
        } else {
          console.warn('=== VALIDATION FAILED ===');
          console.warn('AI response missing required fields');
          console.warn('Has title:', !!parsedResult.title);
          console.warn('Has tags:', !!parsedResult.tags);
          console.warn('Has mood:', !!parsedResult.mood);
          console.warn('Has summary:', !!parsedResult.summary);
          throw new Error('Invalid AI response structure');
        }
      } else {
        console.warn('=== NO JSON FOUND ===');
        console.warn('No JSON found in AI response');
        console.warn('Raw text was:', text);
        throw new Error('Could not parse AI response');
      }
    } catch (error) {
      console.error('=== LLAMA API ERROR ===');
      console.error('Error type:', error.constructor.name);
      console.error('Error message:', error.message);
      console.error('Full error:', error);
      console.error('Stack trace:', error.stack);
      
      // Generate basic tags from transcription
      const words = transcription.toLowerCase().split(' ');
      const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for'];
      const meaningfulWords = words.filter(w => w.length > 3 && !commonWords.includes(w));
      const tags = [...new Set(meaningfulWords.slice(0, 3))];
      
      // Fallback response with some intelligence
      console.log('=== USING FALLBACK ===');
      const fallbackData = {
        title: transcription.substring(0, 50) || 'Audio Recording',
        tags: tags.length > 0 ? tags : ['audio', 'recording'],
        mood: 'neutral',
        summary: transcription.substring(0, 200) || 'Audio transcription processed'
      };
      console.log('Fallback data:', JSON.stringify(fallbackData, null, 2));
      
      return {
        status: 'success',
        data: fallbackData
      };
    }
  }

  async generateTodoList(transcription) {
    try {
      console.log('=== GENERATING TODO LIST WITH LLAMA ===');
      console.log('Transcription length:', transcription.length);
      
      const prompt = `Based on this audio transcription, generate a practical to-do list of action items the listener should complete after watching/listening. Focus on key takeaways, action steps, and important tasks mentioned.

Transcription: "${transcription}"

Respond ONLY with valid JSON (no markdown, no code blocks, no explanations):
{
  "todos": [
    {
      "task": "Clear, actionable task description",
      "priority": "high/medium/low",
      "category": "learning/action/research/practice"
    }
  ],
  "keyTakeaways": ["takeaway 1", "takeaway 2", "takeaway 3"]
}

Generate 5-10 relevant todos based on the content.`;

      console.log('Calling Llama API for todo list...');
      let text = await this.callLlama(prompt);
      
      console.log('Todo list AI Response:', text);

      // Remove markdown code blocks if present
      text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      // Try to find JSON in the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const parsedResult = JSON.parse(jsonMatch[0]);
        console.log('Parsed todo list:', parsedResult);
        
        if (parsedResult.todos && Array.isArray(parsedResult.todos)) {
          console.log('Todo list generation successful');
          return {
            status: 'success',
            data: parsedResult
          };
        }
      }
      
      throw new Error('Could not parse todo list response');
    } catch (error) {
      console.error('=== TODO LIST GENERATION ERROR ===');
      console.error('Error:', error.message);
      
      // Fallback todo list
      return {
        status: 'success',
        data: {
          todos: [
            {
              task: 'Review the main points from this audio',
              priority: 'high',
              category: 'learning'
            },
            {
              task: 'Take notes on key concepts discussed',
              priority: 'medium',
              category: 'learning'
            },
            {
              task: 'Research topics mentioned for deeper understanding',
              priority: 'medium',
              category: 'research'
            }
          ],
          keyTakeaways: ['Review the audio content', 'Apply learned concepts', 'Follow up on action items']
        }
      };
    }
  }

  async generateImageFromTranscription(transcription) {
    try {
      console.log('=== GENERATING IMAGE FROM TRANSCRIPTION ===');
      console.log('Transcription length:', transcription.length);
      
      // Step 1: Generate a concise image prompt from the transcription using LLM
      const promptGenerationPrompt = `Based on this audio transcription, create a concise, descriptive image prompt (max 100 words) that captures the main theme or subject. The prompt should be suitable for text-to-image generation.

Transcription: "${transcription.substring(0, 500)}"

Respond with ONLY the image prompt text, no JSON, no explanations, just the prompt itself.`;

      console.log('Generating image prompt from transcription...');
      const imagePrompt = await this.callLlama(promptGenerationPrompt);
      console.log('Generated image prompt:', imagePrompt);
      
      // Step 2: Use Pollinations.ai (completely free, no API key needed)
      console.log('Generating image with Pollinations.ai (free service)...');
      
      const encodedPrompt = encodeURIComponent(imagePrompt.trim());
      const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true`;
      
      const response = await axios.get(pollinationsUrl, {
        responseType: 'arraybuffer',
        timeout: 60000 // 60 second timeout
      });
      
      const imageBuffer = Buffer.from(response.data);
      console.log('Successfully generated image with Pollinations.ai');
      
      // Convert to base64
      const base64Image = imageBuffer.toString('base64');
      
      return {
        status: 'success',
        data: {
          imagePrompt: imagePrompt.trim(),
          imageBase64: base64Image,
          imageUrl: `data:image/png;base64,${base64Image}`,
          generatedBy: 'Pollinations.ai (Free)'
        }
      };
    } catch (error) {
      console.error('=== IMAGE GENERATION ERROR ===');
      console.error('Error type:', error.constructor.name);
      console.error('Error message:', error.message);
      console.error('Full error:', error);
      
      return {
        status: 'error',
        message: error.message || 'Failed to generate image',
        data: null
      };
    }
  }
}

module.exports = new AutomaticService();