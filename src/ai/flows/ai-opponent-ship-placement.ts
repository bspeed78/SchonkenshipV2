'use server';

/**
 * @fileOverview An AI opponent ship placement agent.
 *
 * - aiOpponentShipPlacement - A function that handles the AI opponent ship placement process.
 * - AiOpponentShipPlacementInput - The input type for the aiOpponentShipPlacement function.
 * - AiOpponentShipPlacementOutput - The return type for the aiOpponentShipPlacement function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiOpponentShipPlacementInputSchema = z.object({
  gridSize: z.number().describe('The size of the grid (e.g., 10 for a 10x10 grid).'),
  shipSizes: z
    .array(z.number())
    .describe('An array of ship sizes (e.g., [5, 4, 3, 3, 2] for an aircraft carrier, battleship, cruiser, submarine, and destroyer). Please place all ships of these exact sizes.'),
});
export type AiOpponentShipPlacementInput = z.infer<typeof AiOpponentShipPlacementInputSchema>;

const AiOpponentShipPlacementOutputSchema = z.array(
  z.object({
    row: z.number().int().min(0).describe('The starting row of the ship (0-indexed).'),
    col: z.number().int().min(0).describe('The starting column of the ship (0-indexed).'),
    length: z.number().int().min(1).describe('The length of the ship.'),
    orientation: z.enum(['horizontal', 'vertical']).describe('The orientation of the ship.'),
  })
).describe("An array of all placed ships. Ensure all ships from shipSizes are placed, they don't overlap, and are within grid boundaries.");
export type AiOpponentShipPlacementOutput = z.infer<typeof AiOpponentShipPlacementOutputSchema>;

export async function aiOpponentShipPlacement(input: AiOpponentShipPlacementInput): Promise<AiOpponentShipPlacementOutput> {
  try {
    return await aiOpponentShipPlacementFlow(input);
  } catch (error) {
    console.warn('AI ship placement failed, using fallback random placement:', error);
    return generateFallbackShipPlacement(input);
  }
}

function generateFallbackShipPlacement(input: AiOpponentShipPlacementInput): AiOpponentShipPlacementOutput {
  const placements: AiOpponentShipPlacementOutput = [];
  const occupiedCells = new Set<string>();
  
  for (const shipSize of input.shipSizes) {
    let placed = false;
    let attempts = 0;
    
    while (!placed && attempts < 100) {
      const orientation = Math.random() < 0.5 ? 'horizontal' : 'vertical';
      const maxRow = orientation === 'vertical' ? input.gridSize - shipSize : input.gridSize - 1;
      const maxCol = orientation === 'horizontal' ? input.gridSize - shipSize : input.gridSize - 1;
      
      const row = Math.floor(Math.random() * (maxRow + 1));
      const col = Math.floor(Math.random() * (maxCol + 1));
      
      let valid = true;
      const cellsToCheck: string[] = [];
      
      for (let i = 0; i < shipSize; i++) {
        const cellRow = orientation === 'vertical' ? row + i : row;
        const cellCol = orientation === 'horizontal' ? col + i : col;
        const cellKey = `${cellRow},${cellCol}`;
        
        if (occupiedCells.has(cellKey)) {
          valid = false;
          break;
        }
        cellsToCheck.push(cellKey);
      }
      
      if (valid) {
        cellsToCheck.forEach(cell => occupiedCells.add(cell));
        placements.push({ row, col, length: shipSize, orientation });
        placed = true;
      }
      
      attempts++;
    }
    
    if (!placed) {
      throw new Error(`Failed to place ship of size ${shipSize} after 100 attempts`);
    }
  }
  
  return placements;
}

const aiOpponentShipPlacementPrompt = ai.definePrompt({
  name: 'aiOpponentShipPlacementPrompt',
  input: {schema: AiOpponentShipPlacementInputSchema},
  output: {schema: AiOpponentShipPlacementOutputSchema},
  prompt: `You are an AI that strategically places ships on a grid for a game of Battleship.

    The grid size is {{gridSize}}x{{gridSize}}. The grid is 0-indexed, so rows and columns go from 0 to {{gridSize - 1}}.
    The ship sizes you must place are: {{shipSizes}}. You must place one ship for each size listed.

    Your goal is to place the ships in a way that makes it difficult for the opponent to find and sink them.
    Consider these strategies:
      - Place ships near the edges of the grid, but not always directly on the edge.
      - Vary the orientation of the ships (horizontal and vertical).
      - Avoid placing ships in obvious patterns (e.g., all in one line, all clustered together).
      - Ensure ships do not overlap.
      - Ensure ships are entirely within the grid boundaries. For a ship of length L, if placed horizontally starting at (row, col), it occupies (row, col) to (row, col+L-1). If vertical, it occupies (row, col) to (row+L-1, col).

    Return the ship placements as a JSON array of objects, where each object has the following properties:
      - row: The starting row of the ship (0-indexed).
      - col: The starting column of the ship (0-indexed).
      - length: The length of the ship (must match one of the provided shipSizes).
      - orientation: The orientation of the ship ('horizontal' or 'vertical').

    Example for a 10x10 grid and ships [5, 4]:
    [
      {
        "row": 2,
        "col": 3,
        "length": 5,
        "orientation": "horizontal"
      },
      {
        "row": 7,
        "col": 1,
        "length": 4,
        "orientation": "vertical"
      }
    ]
    Make sure the output is a valid JSON array. Adhere to the ship lengths provided. Do not place ships out of bounds. Do not overlap ships.
    Make sure ALL ships are placed exactly once. Double check your work for validity and adherence to all constraints.
    Do not explain your answer, only provide the JSON output.`, 
});

const aiOpponentShipPlacementFlow = ai.defineFlow(
  {
    name: 'aiOpponentShipPlacementFlow',
    inputSchema: AiOpponentShipPlacementInputSchema,
    outputSchema: AiOpponentShipPlacementOutputSchema,
  },
  async input => {
    const {output} = await aiOpponentShipPlacementPrompt(input);
    if (!output) {
        throw new Error("AI opponent ship placement flow did not return output.");
    }
    if (output.length !== input.shipSizes.length) {
        throw new Error(`AI did not place the correct number of ships. Expected ${input.shipSizes.length}, got ${output.length}`);
    }
    return output;
  }
);
