import OpenAI from 'openai';

interface FormattedContent {
  summary: string;
  tableOfContents: string;
  content: string;
}

// Split into separate functions for each part
export async function getSummary(text: string): Promise<string> {
  const response = await fetch('/api/format/summary', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) throw new Error('Failed to get summary');
  const data = await response.json();
  return data.summary;
}

export async function getTableOfContents(text: string): Promise<string> {
  const response = await fetch('/api/format/toc', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) throw new Error('Failed to get table of contents');
  const data = await response.json();
  return data.tableOfContents;
}

export async function getFormattedContent(text: string): Promise<string> {
  const response = await fetch('/api/format/content', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) throw new Error('Failed to format content');
  const data = await response.json();
  return data.content;
}

// Main function now runs requests in parallel
export async function formatText(text: string): Promise<FormattedContent> {
  try {
    const [summary, tableOfContents, content] = await Promise.all([
      getSummary(text),
      getTableOfContents(text),
      getFormattedContent(text),
    ]);

    return {
      summary,
      tableOfContents,
      content,
    };
  } catch (error) {
    console.error('Error formatting text:', error);
    throw new Error('Failed to format text');
  }
}

export function processSmartDates(text: string): string {
  // Add smart date processing logic here
  return text;
}

export function convertToMentions(text: string): string {
  // Add @mentions conversion logic here
  return text;
}

export function convertListsToTables(text: string): string {
  // Add list to table conversion logic here
  return text;
} 