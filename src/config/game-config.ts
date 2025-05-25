
import type { ShipDefinition } from '@/types/battleship';
import { Rocket, Ship as ShipIconLucide, Anchor, Triangle, RectangleHorizontal } from 'lucide-react'; // Tentative icons

export const BOARD_SIZE = 10;

export const SHIP_DEFINITIONS: ShipDefinition[] = [
  { id: 'carrier', name: 'Carrier', size: 5 },
  { id: 'battleship', name: 'Battleship', size: 4 },
  { id: 'cruiser', name: 'Cruiser', size: 3 },
  { id: 'submarine', name: 'Submarine', size: 3 },
  { id: 'destroyer', name: 'Destroyer', size: 2 },
];

export const SHIP_ICONS: { [key: string]: React.ElementType } = {
  carrier: Rocket,
  battleship: ShipIconLucide,
  cruiser: Anchor,
  submarine: Triangle, // Using Triangle as a placeholder
  destroyer: RectangleHorizontal, // Using RectangleHorizontal as placeholder
};
