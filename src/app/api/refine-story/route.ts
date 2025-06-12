import { NextResponse } from 'next/server';
import { generateChatCompletion } from '../../../lib/claude'; // Adjust path if necessary

interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { originalStory, suggestions } = body;

    if (!originalStory || !originalStory.description) {
      return NextResponse.json({ error: 'Original story description is required.' }, { status: 400 });
    }
    if (!suggestions || !Array.isArray(suggestions) || suggestions.length === 0) {
      return NextResponse.json({ error: 'At least one suggestion is required.' }, { status: 400 });
    }

    // Construct a detailed prompt for Claude
    const storyTitle = originalStory.title ? `Title: "${originalStory.title}"` : '';
    const storyDescription = `Description: "${originalStory.description}"`;
    const storyContext = [
      storyTitle,
      storyDescription,
      originalStory.jiraKey ? `JIRA Key: ${originalStory.jiraKey}` : '',
      originalStory.component ? `Component: ${originalStory.component}` : '',
      originalStory.priority ? `Priority: ${originalStory.priority}` : '',
    ].filter(Boolean).join('\n');

    const improvementPoints = suggestions.map(s => `- ${s}`).join('\n');

    const prompt = `You are an expert in Agile methodologies and user story writing. Your task is to refine the following user story based on the provided context and specific improvement suggestions. 

Original User Story Context:
${storyContext}

Selected Improvement Suggestions to address:
${improvementPoints}

Please provide a revised and improved version of the user story description. Focus on clarity, conciseness, testability, and incorporating the suggested improvements. The refined story should follow standard user story format (e.g., "As a [persona], I want [goal] so that [benefit]") if applicable, or maintain the original structure if it's more of a task or technical story, but ensure it's significantly improved based on the suggestions.

Output only the refined user story description text. Do not include any preamble, apologies, or explanations before or after the refined text itself.`;

    const messages: ClaudeMessage[] = [
      { role: 'user', content: prompt },
      { role: 'assistant', content: 'Okay, here is the refined user story description:' } // Pre-fill assistant to guide response format
    ];

    const refinedText = await generateChatCompletion(messages, {
      maxTokens: 1000, // Adjust as needed
      temperature: 0.7, // Adjust for creativity vs. precision
    });

    if (!refinedText || refinedText.trim() === '') {
        return NextResponse.json({ error: 'AI returned an empty refinement. Please try again or adjust suggestions.' }, { status: 500 });
    }

    return NextResponse.json({ refinedText: refinedText.trim() });

  } catch (error: any) {
    console.error('Error in /api/refine-story:', error);
    return NextResponse.json(
      { 
        error: 'Failed to refine story with AI.', 
        details: error.message || String(error) 
      },
      { status: 500 }
    );
  }
}
