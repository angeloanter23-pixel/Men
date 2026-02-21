export const defaultMenu = {
  "categories": [
    { "id": "cat1", "name": "Main Dishes", "order_index": 0 },
    { "id": "cat2", "name": "Drinks", "order_index": 1 },
    { "id": "cat3", "name": "Desserts", "order_index": 2 }
  ],
  "items": [
    {
      "id": "item1",
      "name": "Classic Cheeseburger",
      "description": "Juicy beef patty with melted cheddar, lettuce, and tomato.",
      "price": 250,
      "image_url": "https://picsum.photos/seed/burger/400/300",
      "cat_name": "Main Dishes",
      "category_id": "cat1",
      "is_popular": true,
      "serving_time": "15-20 min",
      "pax": "1 Person"
    },
    {
      "id": "item2",
      "name": "Iced Caramel Macchiato",
      "description": "Rich espresso with creamy milk and sweet caramel syrup.",
      "price": 180,
      "image_url": "https://picsum.photos/seed/coffee/400/300",
      "cat_name": "Drinks",
      "category_id": "cat2",
      "is_popular": true,
      "serving_time": "5 min",
      "pax": "1 Person"
    },
    {
      "id": "item3",
      "name": "Truffle Pasta",
      "description": "Creamy pasta infused with aromatic truffle oil and parmesan.",
      "price": 350,
      "image_url": "https://picsum.photos/seed/pasta/400/300",
      "cat_name": "Main Dishes",
      "category_id": "cat1",
      "is_popular": true,
      "serving_time": "20-25 min",
      "pax": "1-2 Persons"
    },
    {
      "id": "item4",
      "name": "Chocolate Lava Cake",
      "description": "Warm chocolate cake with a gooey molten center.",
      "price": 220,
      "image_url": "https://picsum.photos/seed/cake/400/300",
      "cat_name": "Desserts",
      "category_id": "cat3",
      "is_popular": true,
      "serving_time": "10-15 min",
      "pax": "1 Person"
    }
  ]
};
