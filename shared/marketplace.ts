/**
 * Lahore marketplace: restaurants with menus, hotels, flights from Lahore and trip deals.
 *
 * The server prices every order and booking from this data (the browser only sends ids
 * and quantities), and serves it to the app at GET /api/marketplace. All prices are PKR.
 * Menus, rates, fares, fees and times are sample data to confirm with each partner.
 * Cover photos are in shared/covers.ts, keyed by the same ids.
 */

export type MenuItem = { id: string; name: string; description?: string; price: number };
export type MenuSection = { name: string; items: MenuItem[] };

export type Restaurant = {
  id: string;
  name: string;
  cuisine: string;
  area: string;
  deliveryMinutes: [number, number];
  deliveryFee: number;
  minOrder: number;
  menu: MenuSection[];
};

export type Hotel = {
  id: string;
  name: string;
  area: string;
  room: string;
  pricePerNight: number;
};

export type Flight = {
  id: string;
  airline: string;
  from: { code: string; city: string };
  to: { code: string; city: string };
  /** Local times at each airport, ISO date and 24-hour time */
  date: string;
  departs: string;
  arrives: string;
  durationMinutes: number;
  stops: number;
  cabin: string;
  baggage: string;
  farePerPassenger: number;
};

export type TripDeal = { id: string; name: string; description: string; price: number };

export type Marketplace = { city: string; restaurants: Restaurant[]; hotels: Hotel[]; flights: Flight[]; packages: TripDeal[] };

const LHE = { code: "LHE", city: "Lahore" };

export const lahoreMarketplace: Marketplace = {
  city: "Lahore",
  restaurants: [
    {
      id: "butt-karahi",
      name: "Butt Karahi",
      cuisine: "Karahi · Desi",
      area: "Lakshmi Chowk",
      deliveryMinutes: [35, 45],
      deliveryFee: 149,
      minOrder: 1000,
      menu: [
        {
          name: "Karahi",
          items: [
            { id: "bk-chicken-half", name: "Chicken Karahi (half)", description: "Cooked in desi ghee with tomatoes, ginger and green chillies", price: 1850 },
            { id: "bk-chicken-full", name: "Chicken Karahi (full)", description: "Serves 3 to 4", price: 3400 },
            { id: "bk-mutton-half", name: "Mutton Karahi (half)", description: "Tender mutton, black pepper and fresh coriander", price: 2950 },
            { id: "bk-mutton-full", name: "Mutton Karahi (full)", description: "Serves 3 to 4", price: 5600 },
            { id: "bk-white-full", name: "Chicken White Karahi (full)", description: "Cream, yogurt and crushed black pepper", price: 3600 },
          ],
        },
        {
          name: "Sides",
          items: [
            { id: "bk-daal", name: "Daal Mash", description: "Finished with a butter tadka", price: 750 },
            { id: "bk-raita", name: "Raita", price: 150 },
            { id: "bk-salad", name: "Fresh Salad", price: 200 },
          ],
        },
        {
          name: "Breads",
          items: [
            { id: "bk-roghni", name: "Roghni Naan", price: 120 },
            { id: "bk-kulcha", name: "Kulcha", price: 100 },
            { id: "bk-roti", name: "Tandoori Roti", price: 40 },
          ],
        },
        {
          name: "Drinks and dessert",
          items: [
            { id: "bk-lassi-sweet", name: "Sweet Lassi", price: 280 },
            { id: "bk-lassi-salted", name: "Salted Lassi", price: 280 },
            { id: "bk-kheer", name: "Kheer", description: "Rice pudding with cardamom and pistachio", price: 350 },
          ],
        },
      ],
    },
    {
      id: "haveli",
      name: "Haveli Restaurant",
      cuisine: "Mughlai · Desi",
      area: "Fort Road Food Street",
      deliveryMinutes: [40, 50],
      deliveryFee: 199,
      minOrder: 1500,
      menu: [
        {
          name: "Mains",
          items: [
            { id: "hv-nihari", name: "Mutton Nihari", description: "Slow-cooked overnight, with ginger, lemon and fried onions", price: 1450 },
            { id: "hv-handi", name: "Chicken Handi (boneless)", description: "Creamy tomato gravy, served in a clay pot", price: 1950 },
            { id: "hv-paya", name: "Paya", description: "Trotters simmered with whole spices", price: 1350 },
            { id: "hv-palak", name: "Palak Paneer", price: 1150 },
          ],
        },
        {
          name: "BBQ",
          items: [
            { id: "hv-seekh", name: "Seekh Kabab (4 pieces)", price: 1350 },
            { id: "hv-tikka", name: "Chicken Tikka (leg and breast)", price: 950 },
            { id: "hv-platter", name: "Haveli Mixed Grill", description: "Seekh, tikka, boti and reshmi kabab for 2 to 3", price: 3900 },
          ],
        },
        {
          name: "Breads",
          items: [
            { id: "hv-garlic-naan", name: "Garlic Naan", price: 200 },
            { id: "hv-naan", name: "Plain Naan", price: 90 },
            { id: "hv-lachha", name: "Lachha Paratha", price: 180 },
          ],
        },
        {
          name: "Desserts and drinks",
          items: [
            { id: "hv-gulab", name: "Gulab Jamun (2 pieces)", price: 400 },
            { id: "hv-falooda", name: "Kulfi Falooda", price: 550 },
            { id: "hv-margarita", name: "Mint Margarita", price: 450 },
          ],
        },
      ],
    },
    {
      id: "bundu-khan",
      name: "Bundu Khan",
      cuisine: "BBQ",
      area: "Liberty Market, Gulberg",
      deliveryMinutes: [30, 40],
      deliveryFee: 129,
      minOrder: 800,
      menu: [
        {
          name: "BBQ",
          items: [
            { id: "bu-tikka", name: "Chicken Tikka (leg)", price: 690 },
            { id: "bu-boti", name: "Chicken Boti (10 pieces)", price: 1150 },
            { id: "bu-bihari", name: "Beef Bihari Kabab", description: "Marinated overnight in papaya and spices", price: 1450 },
            { id: "bu-reshmi", name: "Reshmi Kabab (4 pieces)", price: 1190 },
            { id: "bu-chops", name: "Mutton Chops (6 pieces)", price: 2850 },
          ],
        },
        {
          name: "Karahi",
          items: [{ id: "bu-karahi-half", name: "Chicken Karahi (half)", price: 1690 }],
        },
        {
          name: "Breads and sides",
          items: [
            { id: "bu-naan", name: "Naan", price: 90 },
            { id: "bu-roghni", name: "Roghni Naan", price: 140 },
            { id: "bu-raita", name: "Raita", price: 150 },
            { id: "bu-chutney", name: "Mint Chutney", price: 100 },
          ],
        },
        {
          name: "Dessert and drinks",
          items: [
            { id: "bu-kheer", name: "Kheer", price: 290 },
            { id: "bu-drink", name: "Soft Drink (1.5 litre)", price: 300 },
          ],
        },
      ],
    },
    {
      id: "cosa-nostra",
      name: "Cosa Nostra",
      cuisine: "Pizza · Italian",
      area: "M.M. Alam Road, Gulberg",
      deliveryMinutes: [30, 40],
      deliveryFee: 199,
      minOrder: 1500,
      menu: [
        {
          name: "Pizza",
          items: [
            { id: "cn-margherita", name: "Margherita (12 inch)", description: "Tomato, mozzarella and basil", price: 2350 },
            { id: "cn-pepperoni", name: "Beef Pepperoni (12 inch)", price: 2850 },
            { id: "cn-tikka", name: "Chicken Tikka Pizza (12 inch)", description: "Tikka chicken, onions and green chillies", price: 2650 },
            { id: "cn-four-cheese", name: "Four Cheese (12 inch)", price: 2950 },
          ],
        },
        {
          name: "Pasta",
          items: [
            { id: "cn-alfredo", name: "Fettuccine Alfredo", description: "Chicken, mushrooms and parmesan cream", price: 2250 },
            { id: "cn-arrabbiata", name: "Penne Arrabbiata", price: 1950 },
            { id: "cn-lasagna", name: "Beef Lasagna", price: 2450 },
          ],
        },
        {
          name: "Starters",
          items: [
            { id: "cn-garlic-bread", name: "Garlic Bread", price: 790 },
            { id: "cn-caesar", name: "Caesar Salad", price: 1450 },
          ],
        },
        {
          name: "Dessert and drinks",
          items: [
            { id: "cn-tiramisu", name: "Tiramisu", price: 1150 },
            { id: "cn-lemonade", name: "Fresh Lemonade", price: 550 },
          ],
        },
      ],
    },
    {
      id: "johnny-jugnu",
      name: "Johnny & Jugnu",
      cuisine: "Burgers · Wraps",
      area: "DHA",
      deliveryMinutes: [25, 35],
      deliveryFee: 99,
      minOrder: 600,
      menu: [
        {
          name: "Burgers",
          items: [
            { id: "jj-crispy", name: "Crispy Chicken Burger", price: 790 },
            { id: "jj-smash", name: "Double Beef Smash Burger", description: "Two smashed patties, cheese and house sauce", price: 1290 },
            { id: "jj-zinger", name: "Spicy Zinger Burger", price: 850 },
          ],
        },
        {
          name: "Wraps",
          items: [
            { id: "jj-grilled-wrap", name: "Grilled Chicken Wrap", price: 850 },
            { id: "jj-tikka-wrap", name: "Chicken Tikka Wrap", price: 890 },
          ],
        },
        {
          name: "Sides",
          items: [
            { id: "jj-fries", name: "Regular Fries", price: 390 },
            { id: "jj-loaded", name: "Loaded Fries", description: "Cheese sauce, jalapeños and chicken", price: 690 },
            { id: "jj-wings", name: "Chicken Wings (6 pieces)", price: 990 },
          ],
        },
        {
          name: "Drinks",
          items: [
            { id: "jj-mint", name: "Mint Lemonade", price: 390 },
            { id: "jj-drink", name: "Soft Drink (345 ml)", price: 200 },
          ],
        },
      ],
    },
  ],
  hotels: [
    { id: "pc-lahore", name: "Pearl Continental Lahore", area: "The Mall", room: "Deluxe King, breakfast for two", pricePerNight: 52000 },
    { id: "avari", name: "Avari Lahore", area: "The Mall", room: "Superior Room, breakfast included", pricePerNight: 45000 },
    { id: "nishat", name: "The Nishat Hotel", area: "Johar Town", room: "Executive King, breakfast included", pricePerNight: 48000 },
    { id: "falettis", name: "Faletti's Hotel", area: "Egerton Road", room: "Heritage Room, breakfast included", pricePerNight: 36000 },
    { id: "ramada-gulberg", name: "Ramada by Wyndham Lahore", area: "Gulberg II", room: "Deluxe Room, breakfast included", pricePerNight: 26000 },
  ],
  flights: [
    { id: "lhe-khi", airline: "AirSial", from: LHE, to: { code: "KHI", city: "Karachi" }, date: "2026-11-14", departs: "07:00", arrives: "08:50", durationMinutes: 110, stops: 0, cabin: "Economy", baggage: "20 kg", farePerPassenger: 22900 },
    { id: "lhe-uet", airline: "PIA", from: LHE, to: { code: "UET", city: "Quetta" }, date: "2026-11-16", departs: "10:30", arrives: "12:10", durationMinutes: 100, stops: 0, cabin: "Economy", baggage: "20 kg", farePerPassenger: 27500 },
    { id: "lhe-dxb", airline: "Emirates", from: LHE, to: { code: "DXB", city: "Dubai" }, date: "2026-11-19", departs: "04:15", arrives: "06:35", durationMinutes: 200, stops: 0, cabin: "Economy", baggage: "30 kg", farePerPassenger: 78500 },
    { id: "lhe-jed", airline: "Saudia", from: LHE, to: { code: "JED", city: "Jeddah" }, date: "2026-11-21", departs: "03:10", arrives: "06:45", durationMinutes: 335, stops: 0, cabin: "Economy", baggage: "2 × 23 kg", farePerPassenger: 135000 },
    { id: "lhe-ist", airline: "Turkish Airlines", from: LHE, to: { code: "IST", city: "Istanbul" }, date: "2026-11-24", departs: "06:40", arrives: "11:30", durationMinutes: 410, stops: 0, cabin: "Economy", baggage: "30 kg", farePerPassenger: 168000 },
  ],
  packages: [
    { id: "umrah-plus", name: "Umrah Luxury Plus", description: "15 days in Makkah and Madina, return flights from Lahore", price: 350000 },
    { id: "jeddah-business", name: "Jeddah Business Hub", description: "5 days in a five-star hotel, return flights from Lahore", price: 210000 },
  ],
};

/** Quantity limits the server enforces on orders and bookings. */
export const LIMITS = { dishQuantity: 20, nights: 14, passengers: 6 };

export const findMenuItem = (restaurant: Restaurant, itemId: string) =>
  restaurant.menu.flatMap(s => s.items).find(i => i.id === itemId);
