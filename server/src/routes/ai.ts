import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthRequest } from '../middleware/authenticate';
import dotenv from 'dotenv';

dotenv.config();
const router = Router();

// POST /api/v1/ai/mentor
router.post('/mentor', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { code, question, expectedOutput, currentOutput, hintsRevealed } = req.body;

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey.includes('your_gemini_api_key_here') || apiKey === '') {
      console.warn('[AI Mentor] Warning: GEMINI_API_KEY is not defined. Using offline rule-based hints fallback.');
      return res.json({
        message: "Offline Hint: Try reading the instructions carefully. Ensure your function is named exactly as requested, check spelling, and verify you are returning the expected type of value."
      });
    }

    const prompt = `You are a supportive, expert JavaScript Tutor. A student is working on a coding task and is stuck.

Task Instructions: ${question}
Expected Output: ${expectedOutput || 'N/A'}
Student's Current Code:
\`\`\`javascript
${code}
\`\`\`
Student's Current Output / Error:
${currentOutput || 'N/A'}
Number of Hints Already Revealed: ${hintsRevealed || 0}

Your goal: Provide a helpful, encouraging hint to guide the student toward the solution.
Rules:
1. STRICT RULE: DO NOT provide the direct code solution or correct implementation. Only guide.
2. Keep the answer extremely brief (maximum of 3 sentences).
3. Focus on suggesting syntax fixes, logic pointers, or explaining programming concepts.`;

    let generatedText = '';
    const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
    let success = false;

    for (const model of models) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: prompt }]
              }
            ],
            generationConfig: {
              maxOutputTokens: 150,
              temperature: 0.7
            }
          })
        });

        if (response.ok) {
          const json: any = await response.json();
          const candidateText = json?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (candidateText) {
            generatedText = candidateText.trim();
            success = true;
            break;
          }
        } else {
          console.warn(`[AI Mentor] Failed with model ${model}: status ${response.status}`);
        }
      } catch (err) {
        console.error(`[AI Mentor] Error contacting model ${model}:`, err);
      }
    }

    if (!success) {
      generatedText = "Double check your function parameters, variables, and return statements. Pay close attention to spelling and test-case output expectations!";
    }

    res.json({
      message: generatedText
    });
  } catch (error) {
    next(error);
  }
});

export default router;
