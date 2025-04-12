// The 'use server' directive is necessary for Genkit flows that will be called by React server components.
'use server';
/**
 * @fileOverview Summarizes the notes for a given day.
 *
 * - summarizeDailyNotes - A function that summarizes the notes for a given day.
 * - SummarizeDailyNotesInput - The input type for the summarizeDailyNotes function.
 * - SummarizeDailyNotesOutput - The return type for the summarizeDailyNotes function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const SummarizeDailyNotesInputSchema = z.object({
  date: z.string().describe('The date for which to summarize notes (YYYY-MM-DD).'),
  notes: z.array(z.string()).describe('An array of notes for the given date.'),
});
export type SummarizeDailyNotesInput = z.infer<typeof SummarizeDailyNotesInputSchema>;

const SummarizeDailyNotesOutputSchema = z.object({
  summary: z.string().describe('A summary of the notes for the given date.'),
});
export type SummarizeDailyNotesOutput = z.infer<typeof SummarizeDailyNotesOutputSchema>;

export async function summarizeDailyNotes(input: SummarizeDailyNotesInput): Promise<SummarizeDailyNotesOutput> {
  return summarizeDailyNotesFlow(input);
}

const summarizeDailyNotesPrompt = ai.definePrompt({
  name: 'summarizeDailyNotesPrompt',
  input: {
    schema: z.object({
      date: z.string().describe('The date for which to summarize notes (YYYY-MM-DD).'),
      notes: z.array(z.string()).describe('An array of notes for the given date.'),
    }),
  },
  output: {
    schema: z.object({
      summary: z.string().describe('A summary of the notes for the given date.'),
    }),
  },
  prompt: `You are a personal assistant tasked with summarizing daily notes.

  Summarize the following notes for the date {{{date}}}. Focus on key points and important details.

  Notes:
  {{#each notes}}
  - {{{this}}}
  {{/each}}
  `,
});

const summarizeDailyNotesFlow = ai.defineFlow<
  typeof SummarizeDailyNotesInputSchema,
  typeof SummarizeDailyNotesOutputSchema
>({
  name: 'summarizeDailyNotesFlow',
  inputSchema: SummarizeDailyNotesInputSchema,
  outputSchema: SummarizeDailyNotesOutputSchema,
}, async input => {
  const {output} = await summarizeDailyNotesPrompt(input);
  return output!;
});
