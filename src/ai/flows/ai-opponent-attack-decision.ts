
// Implemented the AI opponent attack decision flow with hit tracking and strategic targeting.
'use server';
/**
 * @fileOverview An AI opponent attack decision flow.
 *
 * - aiOpponentAttackDecision - A function that determines the AI opponent's next attack.
 * - AiOpponentAttackDecisionInput - The input type for the aiOpponentAttackDecision function.
 * - AiOpponentAttackDecisionOutput - The return type for the aiOpponentAttackDecision function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CoordinateSchema = z.object({
  x: z.number().int().min(0).max(9).describe('X coordinate (0-9)'),
  y: z.number().int().min(0).max(9).describe('Y coordinate (0-9)'),
});

export type Coordinate = z.infer<typeof CoordinateSchema>;

const AiOpponentAttackDecisionInputSchema = z.object({
  boardSize: z.number().int().describe('The size of the game board (e.g., 10 for a 10x10 board).'),
  previousHits: z
    .array(CoordinateSchema)
    .describe('Array of coordinates where previous hits have occurred.'),
  opponentBoardState: z
    .array(z.array(z.string()))
    .describe('The current state of the opponent\'s board, showing hits, misses, and unknown cells (e.g., "?", "hit", "miss", "sunk").'),
  availableCoordinates: z
    .array(CoordinateSchema)
    .describe('Array of coordinates that have not been attacked yet.'),
});

export type AiOpponentAttackDecisionInput = z.infer<
  typeof AiOpponentAttackDecisionInputSchema
>;

const AiOpponentAttackDecisionOutputSchema = z.object({
  attackCoordinate: CoordinateSchema.describe(
    'The AI opponent\'s chosen coordinate for the next attack.'
  ),
  reasoning: z.string().describe('The AI\'s reasoning for choosing this coordinate.'),
});

export type AiOpponentAttackDecisionOutput = z.infer<
  typeof AiOpponentAttackDecisionOutputSchema
>;

export async function aiOpponentAttackDecision(
  input: AiOpponentAttackDecisionInput
): Promise<AiOpponentAttackDecisionOutput> {
  return aiOpponentAttackDecisionFlow(input);
}

// Internal schema for the prompt, with opponentBoardState as string[]
const AiOpponentAttackDecisionPromptInternalInputSchema = AiOpponentAttackDecisionInputSchema.extend({
    opponentBoardState: z
    .array(z.string())
    .describe('The current state of the opponent\'s board, with each string representing a pre-joined row.'),
});


const aiOpponentAttackDecisionPrompt = ai.definePrompt({
  name: 'aiOpponentAttackDecisionPrompt',
  input: {schema: AiOpponentAttackDecisionPromptInternalInputSchema}, // Use internal schema
  output: {schema: AiOpponentAttackDecisionOutputSchema},
  prompt: `You are an AI opponent in a battleship game. Your goal is to sink all of the human player's ships.

Given the current state of the game, choose the next coordinate to attack. You should consider the following:

*   Prioritize attacking coordinates near previous hits to try and sink ships. Consider patterns (horizontal/vertical lines of hits).
*   If there are no previous hits or no clear pattern, choose a coordinate from availableCoordinates, perhaps using a checkerboard pattern or other intelligent searching strategy. Avoid clustering all shots.
*   Do not attack the same coordinate twice (ensure choice is from availableCoordinates).

Board Size: {{boardSize}}
Previous Hits on Opponent: {{previousHits}}
Opponent Board State (Your view: '?' for unknown, 'hit', 'miss', 'sunk'):
{{#each opponentBoardState}}
  {{this}}
{{/each}}
Available Coordinates to Attack: {{availableCoordinates}}

Choose the next coordinate to attack from the availableCoordinates and explain your reasoning. Return your answer as JSON in the following format:

${JSON.stringify({
    attackCoordinate: {x: 0, y: 0},
    reasoning: 'Reasoning for the attack choice.',
  })}
`,
});

const aiOpponentAttackDecisionFlow = ai.defineFlow(
  {
    name: 'aiOpponentAttackDecisionFlow',
    inputSchema: AiOpponentAttackDecisionInputSchema, // Flow input is the original schema
    outputSchema: AiOpponentAttackDecisionOutputSchema,
  },
  async (input: AiOpponentAttackDecisionInput) => { // Explicitly type input
    const formattedBoardState = input.opponentBoardState.map(row => row.join(' '));
    const promptInput = {
      ...input,
      opponentBoardState: formattedBoardState,
    };

    const {output} = await aiOpponentAttackDecisionPrompt(promptInput); // Pass the augmented input
    if (!output) {
      throw new Error("AI opponent attack decision flow did not return output.");
    }
    // Ensure the chosen coordinate is actually available
    const chosen = output.attackCoordinate;
    const isAvailable = input.availableCoordinates.some(coord => coord.x === chosen.x && coord.y === chosen.y);
    if (!isAvailable && input.availableCoordinates.length > 0) {
      // Fallback if AI chooses an invalid coordinate
      console.warn("AI chose an unavailable coordinate. Picking a random available one.");
      const randomIndex = Math.floor(Math.random() * input.availableCoordinates.length);
      return {
        attackCoordinate: input.availableCoordinates[randomIndex],
        reasoning: "AI made an error, fallback to random available coordinate."
      };
    }
    if (input.availableCoordinates.length === 0 && !output.attackCoordinate) {
        // This case should ideally not happen if game ends correctly
        throw new Error("No available coordinates to attack, but AI tried to pick one.");
    }
    return output;
  }
);

