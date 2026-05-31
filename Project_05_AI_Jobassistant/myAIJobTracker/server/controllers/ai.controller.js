import {
  analyzeResume,
  generateCoverLetter,
  generateInterviewPrep,
  chatAssistant,
} from '../services/claude.service.js';
import { ollamaChat, checkOllamaHealth } from '../services/ollama.service.js';
import { Job } from '../models/Job.js';
import { User } from '../models/User.js';

export const analyzeResumeHandler = async (req, res) => {
  try {
    const { resumeText } = req.body;
    const jobs = await Job.find({ userId: req.userId }).limit(5);
    const jobDescriptions = jobs
      .map((j) => `${j.title} at ${j.company}: ${j.notes || ''}`)
      .join('\n');

    const analysis = await analyzeResume(resumeText, jobDescriptions);
    res.json(analysis);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const generateCoverLetterHandler = async (req, res) => {
  try {
    const { jobTitle, company } = req.body;
    const user = await User.findById(req.userId);
    const userProfile = `${user.name}, ${user.profile?.headline || ''}, Skills: ${
      user.profile?.skills?.join(', ') || 'N/A'
    }`;

    const coverLetter = await generateCoverLetter(jobTitle, company, userProfile);
    res.json({ coverLetter });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const interviewPrepHandler = async (req, res) => {
  try {
    const { jobTitle, company } = req.body;
    const questions = await generateInterviewPrep(jobTitle, company);
    res.json({ questions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── Main Chat Handler — Uses Ollama (llama3.2) with fallback chain ──
export const chatHandler = async (req, res) => {
  try {
    const { messages } = req.body;
    const user = await User.findById(req.userId);

    const systemPrompt = `You are an AI job hunting assistant helping ${user?.name || 'a job seeker'}. You help with:
- Resume optimization and writing tips
- Interview preparation and mock Q&A  
- Cover letter suggestions
- Job search strategies and career advice
- Analyzing job descriptions

Be concise, actionable, encouraging, and supportive. Focus on practical advice.`;

    // ── 1. Try Ollama (llama3.2) first ──
    try {
      console.log('🦙 Attempting Ollama chat with llama3.2...');
      const result = await ollamaChat(messages, systemPrompt);
      console.log('✅ Ollama response received');
      return res.json({
        response: result.text,
        model: result.model,
        provider: 'ollama',
      });
    } catch (ollamaError) {
      console.warn('⚠️  Ollama unavailable:', ollamaError.message);
    }

    // ── 2. Fallback: Try Claude API ──
    try {
      const response = await chatAssistant(
        messages,
        `User: ${user?.name || 'Unknown'}`
      );
      return res.json({
        response,
        model: 'claude-3-5-sonnet',
        provider: 'claude',
      });
    } catch (claudeError) {
      console.warn('⚠️  Claude unavailable:', claudeError.message);
    }

    // ── 3. Final fallback: Smart mock responses ──
    const lastMsg = messages[messages.length - 1]?.content?.toLowerCase() || '';
    let mockResponse =
      "⚠️ Both Ollama and Claude API are currently unavailable. Please start Ollama with `ollama serve` and pull the model with `ollama pull llama3.2`.";

    if (lastMsg.includes('resume') || lastMsg.includes('cv')) {
      mockResponse =
        "📄 **Resume Tips:** Use strong action verbs, quantify achievements (e.g., 'increased performance by 30%'), match keywords from job descriptions, and keep it to 1-2 pages. ATS-friendly formatting is key!";
    } else if (lastMsg.includes('interview')) {
      mockResponse =
        "🎯 **Interview Prep:** Use the STAR method (Situation, Task, Action, Result) for behavioral questions. Research the company, prepare 5 questions to ask, and practice your 'Tell me about yourself' answer.";
    } else if (lastMsg.includes('cover letter')) {
      mockResponse =
        "✉️ **Cover Letter:** Open with an engaging hook, match your top 2-3 achievements to their job requirements, and close with a confident call-to-action. Keep it under 300 words.";
    } else if (lastMsg.includes('salary') || lastMsg.includes('negotiat')) {
      mockResponse =
        "💰 **Salary Negotiation:** Research market rates on Glassdoor/LinkedIn. Give a range, never a single number. Ask: 'What is the budgeted range for this role?' before naming a figure.";
    }

    return res.json({ response: mockResponse, model: 'mock', provider: 'mock' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── Ollama Health Check ──
export const ollamaHealthHandler = async (req, res) => {
  try {
    const health = await checkOllamaHealth();
    res.json(health);
  } catch (error) {
    res.status(500).json({ available: false, reason: error.message });
  }
};

export const getInsights = async (req, res) => {
  try {
    const jobs = await Job.find({ userId: req.userId });

    const stats = {
      totalJobs: jobs.length,
      applied: jobs.filter((j) => j.status === 'applied').length,
      avgMatchScore:
        jobs.length > 0
          ? Math.round(
              jobs.reduce((sum, j) => sum + j.aiMatchScore, 0) / jobs.length
            )
          : 0,
      recentlyApplied: jobs.filter((j) => j.status === 'applied').slice(0, 3),
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
