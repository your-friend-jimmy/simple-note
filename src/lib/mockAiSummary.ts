// Simulates an AI response with a delay
export async function getMockSummary(content: string): Promise<string> {
    // Add a realistic delay (between 1-2 seconds)
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

    // Check content for keywords and return appropriate mock summaries
    if (content.toLowerCase().includes('shopping list')) {
        const itemCount = content.split('\n').filter(line => line.trim().startsWith('-')).length;
        return `A shopping list containing ${itemCount} items including groceries and household supplies.`;
    }

    if (content.toLowerCase().includes('meeting')) {
        return "Meeting notes covering project updates, goals, and action items for team follow-up.";
    }

    if (content.toLowerCase().includes('recipe')) {
        const ingredients = content.split('\n').filter(line => /^\d\./.test(line)).length;
        return `Recipe instructions detailing ${ingredients} ingredients and preparation steps.`;
    }

    if (content.toLowerCase().includes('book')) {
        const books = content.split('\n').filter(line => /^\d\./.test(line)).length;
        return `A curated list of ${books} book recommendations for personal development and entertainment.`;
    }

    // Default summary for other types of notes
    const wordCount = content.split(/\s+/).length;
    return `A note containing ${wordCount} words discussing various topics and ideas.`;
}
