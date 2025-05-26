
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
    .describe("Array of coordinates of current, non-sunk 'hit' cells. Use these to target adjacent cells."),
  opponentBoardState: z
    .array(z.array(z.string()))
    .describe('The current state of the opponent\'s board, showing hits, misses, and unknown cells (e.g., "?", "hit", "miss", "sunk").'),
  availableCoordinates: z
    .array(CoordinateSchema)
    .describe('Array of coordinates that have not been attacked yet. The AI\'s choice MUST be from this list.'),
});

export type AiOpponentAttackDecisionInput = z.infer<
  typeof AiOpponentAttackDecisionInputSchema
>;

const AiOpponentAttackDecisionOutputSchema = z.object({
  attackCoordinate: CoordinateSchema.describe(
    'The AI opponent\'s chosen coordinate for the next attack. This MUST be from the provided availableCoordinates.'
  ),
  reasoning: z.string().describe('The AI\'s reasoning for choosing this coordinate, explaining strategy (Targeting or Hunting mode).'),
});

export type AiOpponentAttackDecisionOutput = z.infer<
  typeof AiOpponentAttackDecisionOutputSchema
>;

export async function aiOpponentAttackDecision(
  input: AiOpponentAttackDecisionInput
): Promise<AiOpponentAttackDecisionOutput> {
  // Ensure availableCoordinates is not empty before calling the AI, or handle appropriately.
  if (input.availableCoordinates.length === 0) {
    // This case should ideally be handled by game logic (e.g., game over).
    // If it's reached, it implies an issue upstream or the AI is asked to play when no moves are possible.
    // For now, if this happens, we might return a "no move" or let the game state handle it.
    // However, the prompt requires a coordinate. To prevent an error if AI *must* return one,
    // this state should be avoided. For robustness, we can check if AI returns a coordinate
    // when availableCoordinates is empty and treat it as an error.
    // The current fallback in the flow handles if AI picks an unavailable one.
    // Let's assume the game calls this only when availableCoordinates is not empty.
  }
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
  prompt: `You are an AI opponent in a battleship game. Your goal is to sink all of the human player's ships efficiently.
The board is {{boardSize}}x{{boardSize}}, 0-indexed (0 to {{boardSize}}-1).

Your current view of the opponent's board (Your attacks: '?' for unknown, 'hit', 'miss', 'sunk'):
{{#each opponentBoardState}}
  {{this}}
{{/each}}

Previous confirmed hits on active (not yet sunk) ships: {{#if previousHits}}{{#each previousHits}}({{this.x}},{{this.y}}){{/each}}{{else}}None{{/if}}.
Available coordinates to attack (these are the ONLY valid choices for your attackCoordinate): {{#if availableCoordinates}}{{#each availableCoordinates}}({{this.x}},{{this.y}}){{/each}}{{else}}None available.{{/if}}

Your strategy:
1.  **Targeting Mode (if \`previousHits\` is not empty and there are available coordinates):**
    *   Focus on the coordinates in \`previousHits\`.
    *   Identify potential ship locations by looking for patterns (horizontal or vertical lines of 'hit' cells on your board view).
    *   Choose an **available** coordinate from \`availableCoordinates\` that is adjacent (up, down, left, or right) to one of the \`previousHits\`.
    *   If multiple such adjacent and available coordinates exist, prioritize those that extend a line of hits.
    *   If no such adjacent and available coordinates exist for any \`previousHits\` (e.g., all surrounded by misses/sunk/edge, or already attacked), then proceed to Hunting Mode.
2.  **Hunting Mode (if \`previousHits\` is empty, or Targeting Mode fails to find a move, or no available coordinates):**
    *   If no \`availableCoordinates\` exist, state that no move is possible in reasoning and return a placeholder or handle as per instructions if forced to pick. (Ideally, the game ends before this.)
    *   Otherwise, select a coordinate from \`availableCoordinates\`.
    *   Use a search pattern (e.g., checkerboard, diagonal, or spaced-out shots) to maximize coverage and find new ships. Avoid clustering shots too closely unless a hit is made.

**Crucial Rule:** You MUST choose your \`attackCoordinate\` from the \`availableCoordinates\` list. Do NOT invent coordinates or choose coordinates that have already been attacked (i.e., not in \`availableCoordinates\`). If \`availableCoordinates\` is empty, reflect this.

Provide your chosen \`attackCoordinate\` (which MUST be from \`availableCoordinates\`) and your detailed \`reasoning\`.
Return your answer as JSON in the following format:
${JSON.stringify({
    attackCoordinate: {x: 0, y: 0}, // This MUST be from availableCoordinates.
    reasoning: 'Detailed reasoning for the attack choice, explaining if in Targeting or Hunting mode and why this specific coordinate was chosen from availableCoordinates.',
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

    if (input.availableCoordinates.length === 0) {
      // This scenario should ideally be handled before calling the AI.
      // If AI is called with no available moves, it cannot make a valid choice.
      // The prompt asks it to state this. If it still returns a coordinate, it will be invalid.
      // Consider throwing an error here or returning a specific "no move" signal if the game can handle it.
      // For now, we'll let the AI attempt to respond; the validation below will catch invalid choices.
      console.warn("AI opponent attack decision called with no available coordinates.");
    }

    const {output} = await aiOpponentAttackDecisionPrompt(promptInput); 
    if (!output) {
      throw new Error("AI opponent attack decision flow did not return output.");
    }

    // If no available coordinates, AI should not have picked one.
    // If it did, or picked one not in the list, it's an error or needs fallback.
    if (input.availableCoordinates.length === 0) {
        if (output.attackCoordinate) { // AI picked a coordinate when none were available
             console.error("AI chose a coordinate when no_available_coordinates. Reasoning:", output.reasoning);
             // This is an AI error; ideally, it should have indicated no move.
             // To prevent game crash, we might need a specific handling for this.
             // For now, we'll let it be caught by the isAvailable check if it proceeds.
             // Or, more strictly:
             throw new Error("AI returned a coordinate when no_available_coordinates. Check AI reasoning.");
        }
        // If AI correctly did not return a coordinate (e.g., null), but the schema expects one, this path is tricky.
        // The schema *requires* an attackCoordinate. So AI must provide one.
        // This implies the game must not call AI if availableCoordinates is empty.
        // For robustness, if we reach here and availableCoordinates is empty, it's a game logic issue.
    }


    // Ensure the chosen coordinate is actually available
    const chosen = output.attackCoordinate;
    const isAvailable = input.availableCoordinates.some(coord => coord.x === chosen.x && coord.y === chosen.y);

    if (!isAvailable) {
      if (input.availableCoordinates.length > 0) {
        // Fallback if AI chooses an invalid coordinate AND there were available ones
        console.warn(`AI chose an unavailable coordinate (${chosen.x},${chosen.y}). Reasoning: "${output.reasoning}". Picking a random available one.`);
        const randomIndex = Math.floor(Math.random() * input.availableCoordinates.length);
        return {
          attackCoordinate: input.availableCoordinates[randomIndex],
          reasoning: `AI original choice was invalid (${chosen.x},${chosen.y}). Fallback to random available coordinate. Original reasoning: ${output.reasoning}`
        };
      } else {
        // AI chose an invalid coordinate, and there were NO available coordinates.
        // This is a critical error state, likely meaning game should have ended.
        console.error(`AI chose ${chosen.x},${chosen.y} but no_available_coordinates. Reasoning: ${output.reasoning}`);
        throw new Error("AI chose an invalid coordinate, and no coordinates were available. Game state error.");
      }
    }
    
    return output;
  }
);

