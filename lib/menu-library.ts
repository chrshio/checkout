import type { Tile, MenuGroup, MenuItem, MenuCategory, ActionTile, DiscountTile } from './pos-types';

// Featured Items with images
export const featuredItems: MenuItem[] = [
  { id: 'cappuccino', name: 'Cappuccino', price: 6.00, type: 'item', image: '/cappuccino.jpg', description: 'Equal parts espresso, steamed milk, and thick foam. Rich and velvety.' },
  { id: 'matcha', name: 'Matcha', price: 6.50, type: 'item', image: '/matcha.jpg', description: 'Ceremonial-grade matcha whisked with your choice of milk. Earthy and smooth.' },
  { id: 'iced-coffee', name: 'Iced coffee', price: 5.00, type: 'item', image: '/iced-coffee.jpg', description: 'Cold-brewed overnight for a smooth, low-acidity cup. Served over ice.' },
  { id: 'latte', name: 'Latte', price: 6.00, type: 'item', image: '/latte.jpg', description: 'Double espresso topped with silky steamed milk and a light layer of foam.' },
  { id: 'espresso', name: 'Espresso', price: 4.00, type: 'item', image: '/espresso.jpg', description: 'A concentrated shot of our house blend, pulled fresh to order.' },
];

// Tea items (light gray background)
export const teaItems: MenuItem[] = [
  { id: 'earl-grey', name: 'Earl grey', price: 4.00, type: 'item' },
  { id: 'green', name: 'Green', price: 4.00, type: 'item' },
  { id: 'turmeric', name: 'Turmeric', price: 4.50, type: 'item' },
  { id: 'chamomile', name: 'Chamomile', price: 4.00, type: 'item', soldOut: true },
  { id: 'ginger', name: 'Ginger', price: 4.00, type: 'item' },
];

export const icedTeaItems: MenuItem[] = [
  { id: 'iced-earl-grey', name: 'Iced earl grey', price: 4.50, type: 'item' },
  { id: 'iced-green', name: 'Iced green', price: 4.50, type: 'item' },
  { id: 'iced-matcha', name: 'Iced matcha', price: 7.00, type: 'item', description: 'Ceremonial-grade matcha over ice with your choice of milk.' },
  { id: 'arnold-palmer', name: 'Arnold Palmer', price: 5.00, type: 'item', description: 'Half iced tea, half fresh-squeezed lemonade.' },
  { id: 'peach-tea', name: 'Peach tea', price: 5.00, type: 'item' },
];

export const beanItems: MenuItem[] = [
  { id: 'house-blend', name: 'House blend', price: 18.00, type: 'item', description: '12oz bag of our signature house blend. Balanced, smooth, and approachable.' },
  { id: 'ethiopia-single', name: 'Ethiopia', price: 22.00, type: 'item', description: 'Single-origin natural process. Bright stone fruit and floral notes.' },
  { id: 'colombia-single', name: 'Colombia', price: 21.00, type: 'item', description: 'Single-origin washed. Caramel sweetness with clean citrus finish.' },
  { id: 'decaf-blend', name: 'Decaf', price: 19.00, type: 'item', description: 'Swiss water process decaf. Full flavor, no compromise.' },
];

export const merchItems: MenuItem[] = [
  { id: 'tote-bag', name: 'Tote bag', price: 25.00, type: 'item', category: 'merch' },
  { id: 'ceramic-mug', name: 'Ceramic mug', price: 32.00, type: 'item', category: 'merch' },
  { id: 'snapback', name: 'Snapback', price: 40.00, type: 'item', category: 'merch' },
  { id: 'tee-shirt', name: 'Tee shirt', price: 35.00, type: 'item', category: 'merch' },
];

// Bakery items (cream/yellow background)
export const bakeryItems: MenuItem[] = [
  { id: 'croissant', name: 'Croissant', price: 4.50, type: 'item', category: 'bakery' },
  { id: 'cookie', name: 'Cookie', price: 3.50, type: 'item', category: 'bakery' },
  { id: 'granola', name: 'Granola', price: 5.00, type: 'item', category: 'bakery' },
  { id: 'baguette', name: 'Baguette', price: 4.00, type: 'item', category: 'bakery' },
  { id: 'sourdough', name: 'Sourdough', price: 6.00, type: 'item', category: 'bakery' },
];

// Category tiles (black background) — items populated after the item arrays above
export const categories: MenuCategory[] = [
  { id: 'coffees', name: 'Coffees', type: 'category', items: featuredItems },
  { id: 'hot-teas', name: 'Hot teas', type: 'category', items: teaItems },
  { id: 'iced-teas', name: 'Iced teas', type: 'category', items: icedTeaItems },
  { id: 'beans', name: 'Beans', type: 'category', items: beanItems },
  { id: 'merch', name: 'Merch', type: 'category', items: merchItems },
];

// Action and discount tiles
export const discountTiles: (ActionTile | DiscountTile)[] = [
  { id: 'discounts', name: 'Discounts', type: 'action', action: 'open-discounts', variant: 'success' },
  { id: 'fnf', name: 'F&F', type: 'discount', discountType: 'percentage', value: 15 },
  { id: '10-off', name: '10% off', type: 'discount', discountType: 'percentage', value: 10 },
];

// Full menu groups
export const menuGroups: MenuGroup[] = [
  {
    id: 'featured',
    name: 'Featured',
    tiles: featuredItems,
  },
  {
    id: 'categories',
    name: 'Categories',
    tiles: categories,
  },
  {
    id: 'teas',
    name: 'Teas',
    tiles: teaItems,
  },
  {
    id: 'bakery',
    name: 'Bakery',
    tiles: bakeryItems,
  },
  {
    id: 'actions',
    name: 'Actions & Discounts',
    tiles: discountTiles,
  },
];

// Helper function to get all tiles flat
export function getAllTiles(): Tile[] {
  return menuGroups.flatMap(group => group.tiles);
}

// Helper function to find tile by id
export function getTileById(id: string): Tile | undefined {
  return getAllTiles().find(tile => tile.id === id);
}

// Helper function to get tiles by type
export function getTilesByType<T extends Tile>(type: Tile['type']): T[] {
  return getAllTiles().filter(tile => tile.type === type) as T[];
}
