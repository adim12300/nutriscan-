export interface FoodSearchResult {
  id: string;
  name: string;
  brand: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  image: string;
}

export const searchFood = async (query: string): Promise<FoodSearchResult[]> => {
  if (!query) return [];
  
  try {
    const res = await fetch(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=20`);
    if (!res.ok) throw new Error("Network response was not ok");
    
    const data = await res.json();
    if (!data.products) return [];

    return data.products
      .filter((p: any) => p.product_name)
      .map((p: any) => {
        // Fallback to various nutriment fields depending on how they're stored
        const calories = p.nutriments?.['energy-kcal_100g'] ?? p.nutriments?.['energy-kcal'] ?? 0;
        const protein = p.nutriments?.proteins_100g ?? p.nutriments?.proteins ?? 0;
        const carbs = p.nutriments?.carbohydrates_100g ?? p.nutriments?.carbohydrates ?? 0;
        const fat = p.nutriments?.fat_100g ?? p.nutriments?.fat ?? 0;
        
        return {
          id: p.id || Math.random().toString(36).substr(2, 9),
          name: p.product_name,
          brand: p.brands || '',
          calories: Math.round(calories),
          protein: Math.round(protein * 10) / 10,
          carbs: Math.round(carbs * 10) / 10,
          fat: Math.round(fat * 10) / 10,
          image: p.image_front_thumb_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80'
        };
      })
      .filter((p: FoodSearchResult) => p.calories > 0); // Only keep items with nutrition info
  } catch (error) {
    console.error("Error fetching food data:", error);
    return [];
  }
};
