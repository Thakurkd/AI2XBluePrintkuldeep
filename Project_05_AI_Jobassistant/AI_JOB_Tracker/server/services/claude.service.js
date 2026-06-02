import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config/env.js';

const client = new Anthropic({ apiKey: config.anthropicApiKey || 'dummy-key' });

const isApiKeySet = () => {
  const key = config.anthropicApiKey;
  return key && key !== 'your_anthropic_api_key_here' && !key.startsWith('sk-ant-replace');
};

export const analyzeResume = async (resumeText, jobDescriptions) => {
  try {
    if (!isApiKeySet()) {
      throw new Error('API key is not configured. Falling back to Mock.');
    }
    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Analyze this resume against the provided job descriptions. Return a JSON object with:
- matchScore (0-100)
- missingSells: array of missing skills
- strengths: array of resume strengths
- suggestions: string with 2-3 actionable suggestions

Resume:
${resumeText}

Jobs:
${jobDescriptions}

Return ONLY valid JSON, no markdown.`,
        },
      ],
    });

    const content = response.content[0].text;
    return JSON.parse(content);
  } catch (error) {
    console.error('Claude Resume Analysis Error:', error.message || error);
    console.warn('⚠️ Anthropic API key is invalid or not set. Returning mock resume analysis.');
    return {
      matchScore: 82,
      missingSells: ['TypeScript', 'Docker', 'CI/CD Pipelines'],
      strengths: ['Strong React foundation', 'Express API development', 'Zustand state management'],
      suggestions: 'Add quantitative metrics to your bullet points (e.g., "improved page load speed by 30%") and explicitly mention cloud platforms like AWS.'
    };
  }
};

export const generateCoverLetter = async (jobTitle, company, userProfile) => {
  try {
    if (!isApiKeySet()) {
      throw new Error('API key is not configured. Falling back to Mock.');
    }
    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1500,
      messages: [
        {
          role: 'user',
          content: `Generate a personalized cover letter for this job:

Job Title: ${jobTitle}
Company: ${company}

User Profile: ${userProfile}

Write a professional cover letter that is 3-4 paragraphs, engaging, and tailored to the role.`,
        },
      ],
    });

    return response.content[0].text;
  } catch (error) {
    console.error('Claude Cover Letter Generation Error:', error.message || error);
    console.warn('⚠️ Anthropic API key is invalid or not set. Returning mock cover letter.');
    return `Dear Hiring Manager,

I am writing to express my strong interest in the ${jobTitle} position at ${company}. With a background in modern web development and a proven track record of building responsive, user-friendly applications, I am excited about the opportunity to contribute to your team.

My profile aligns very well with the requirements of this role, particularly my experience with frontend frameworks like React and building scalable REST APIs on Node.js/Express. I pride myself on writing clean, maintainable code and collaborating effectively with cross-functional teams.

I would love the opportunity to discuss how my skills and background make me a perfect fit for ${company}. Thank you for your time and consideration.

Sincerely,
Test User`;
  }
};

export const generateInterviewPrep = async (jobTitle, company) => {
  try {
    if (!isApiKeySet()) {
      throw new Error('API key is not configured. Falling back to Mock.');
    }
    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: `Generate 10 likely interview questions and ideal answers for a ${jobTitle} position at ${company}.

Return a JSON array of objects with structure:
[
  {
    "question": "question text",
    "answer": "ideal answer"
  }
]

Return ONLY valid JSON, no markdown.`,
        },
      ],
    });

    const content = response.content[0].text;
    return JSON.parse(content);
  } catch (error) {
    console.error('Claude Interview Prep Error:', error.message || error);
    console.warn('⚠️ Anthropic API key is invalid or not set. Returning mock interview prep.');
    return [
      {
        question: `Why do you want to work as a ${jobTitle} at ${company}?`,
        answer: `I have been following ${company}'s progress in the industry and am deeply impressed by your commitment to innovation. As a ${jobTitle}, I want to apply my technical skillset to solve complex problems and contribute to products that make a real impact.`
      },
      {
        question: "Explain the difference between state and props in React.",
        answer: "State is local to a component and can be changed by the component itself. Props are read-only variables passed down from parent components to child components to configure them."
      },
      {
        question: "How do you handle state management in complex applications?",
        answer: "For lightweight sharing, Context API is sufficient. For larger scale applications, external state managers like Zustand or Redux are preferred because they avoid unnecessary re-renders and provide clean, modularized store files."
      },
      {
        question: "What is your approach to optimizing the performance of an API?",
        answer: "My approach includes query optimization (indexing in MongoDB, selecting only needed fields), caching frequent read queries (using Redis), compression of responses, and performance analysis using APM tools."
      },
      {
        question: "How do you handle API security in a Node/Express app?",
        answer: "I enforce HTTPS, sanitize inputs (e.g., using express-validator), use helmet for secure HTTP headers, implement CORS with restricted origins, hash passwords using bcryptjs, and protect routes using JWT tokens."
      }
    ];
  }
};

export const chatAssistant = async (messages, userContext) => {
  try {
    if (!isApiKeySet()) {
      throw new Error('API key is not configured. Falling back to Mock.');
    }
    const systemPrompt = `You are an AI job hunting assistant. You help with:
- Resume optimization
- Interview preparation
- Cover letter suggestions
- Job search strategies
- Career advice

User Context: ${userContext}

Be concise, actionable, and supportive.`;

    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
    });

    return response.content[0].text;
  } catch (error) {
    console.error('Claude Chat Error:', error.message || error);
    console.warn('⚠️ Anthropic API key is invalid or not set. Returning mock response.');
    
    const lastUserMessage = messages[messages.length - 1]?.content?.toLowerCase() || '';
    if (lastUserMessage.includes('resume') || lastUserMessage.includes('cv')) {
      return "To optimize your resume for applicant tracking systems (ATS), ensure you use clean formatting (no multi-columns or icons in the resume document), use clear headings (e.g., 'Work Experience', 'Skills'), and match keywords directly from the job description. Would you like me to analyze a specific job description for keywords?";
    } else if (lastUserMessage.includes('interview') || lastUserMessage.includes('question')) {
      return "When preparing for interviews, I recommend using the STAR method (Situation, Task, Action, Result) for behavioral questions. For technical interviews, focus on core fundamentals and explain your thought process clearly as you solve problems. What kind of role are you interviewing for?";
    } else if (lastUserMessage.includes('cover letter')) {
      return "A great cover letter should have 3 key sections: an introduction stating the role and why you're excited, a body paragraph matching your top accomplishments to their specific challenges, and a call-to-action closing. I can draft a mock cover letter for you if you tell me the job title and company!";
    } else {
      return "Hello! I am your AI Job Search Assistant. Since the Anthropic API key is not currently configured or valid, I am running in demo mode. I can still help answer general career questions, give tips on interviews, and help you structure your applications! How can I assist you today?";
    }
  }
};
