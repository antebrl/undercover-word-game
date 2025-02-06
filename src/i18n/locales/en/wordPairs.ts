const wordPairs = [
    ['Dog', 'Cat'],
    ['Pizza', 'Burger'],
    ['Beach', 'Mountain'],
    ['Coffee', 'Tea'],
    ['Car', 'Bus'],
    ['Sun', 'Moon'],
    ['Banana', 'Apple'],
    ['Perfume', 'Deodorant'],
    ['Adidas', 'Nike'],
    ['backpack', 'suitcase'],
    ['jacuzzi', 'sauna'],
    ['sneakers', 'sandals'],
    ['sunglasses', 'eyeglasses'],
    ['piano', 'guitar'],
    ['cruise', 'safari'],
    ['sushi', 'pizza'],
    ['hamburger', 'hotdog'],
    ['chocolate', 'vanilla'],
    ['beer', 'wine'],
    ['whiskey', 'vodka'],
    ['milk', 'juice'],
    ['bread', 'butter'],
    ['rice', 'pasta'],
    ['chicken', 'beef'],
    ['apple', 'orange'],
    ['banana', 'strawberry'],
    ['carrot', 'broccoli'],
    ['potato', 'tomato'],
    ['onion', 'garlic'],
    ['salt', 'pepper'],
    ['sugar', 'honey'],
    ['water', 'soda'],
    ['Apple', 'Microsoft'],
    ['Google', 'Facebook'],
    ['Amazon', 'Netflix'],
    ['Pancake', 'Doughnut'],
    ['Ice cream', 'Cake'],
    ['McDonalds', 'KFC'],
    ['Car', 'Bike'],
    ['virus', 'bacteria'],
    ['Lord of the rings', 'Hobbit'],
    ['Harry Potter', 'Lord Voldemort'],
    ['Superman', 'Batman'],
    ['Spiderman', 'Ironman'],
    ['Captain America', 'Thor'],
    ['Pizza', 'Pasta'],
    ['Football', 'Basketball'],
    ['Music', 'Dancing'],
    ['Dog', 'Wolf'],
    ['Apple', 'Pear'],
    ['Car', 'Truck'],
    ['Pencil', 'Pen'],
    ['Pizza', 'Lasagna'],
    ['Facebook', 'Instagram'],
    ['Sunglasses', 'Goggles'],
    ['Laptop', 'Tablet'],
    ['Doctor', 'Surgeon'],
    ['Bitcoin', 'Ethereum'],
    ['Watch', 'Ring'],
    ['Bomb', 'Gun'],
    ['Einstein', 'Newton'],
    ['Shirt', 'Sweater'],
    ['Soccer', 'Rugby'],
    ['Plane', 'Helicopter'],
    ['River', 'Lake'],
    ['Ocean', 'River'],
    ['Teacher', 'Professor'],
    ['Bicycle', 'Motorcycle'],
    ['Salt', 'Sugar'],
    ['Knife', 'Scissors'],
    ['Chair', 'Bench'],
    ['Castle', 'House'],
    ['Train', 'Bus'],
    ['Mirror', 'window pane'],
    ['Mouse', 'Rat'],
    ['Cucumber', 'Zucchini'],
    ['Strawberry', 'Raspberry'],
    ['Banana', 'Plantain'],
    ['Coconut', 'Pineapple'],
    ['Dragon', 'Dinosaur'],
    ['Ghost', 'Zombie'],
    ['Chef', 'Kitchen counter'],
    ['Shovel', 'Axe'],
    ['Pyramid', 'Temple'],
    ['Volcano', 'Mountain'],
    ['Desert', 'Sand'],
    ['Cloud', 'Fog'],
    ['Snow', 'Hail'],
    ['Detective', 'Criminal'],
    ['Jungle', 'Forest'],
    ['Clock', 'Watch'],
    ['Bread', 'Toast'],
    ['Painting', 'Sketch'],
    ['Umbrella', 'Parasol'],
    ['Suit', 'necktie'],
    ['Socks', 'Stockings'],
    ['Belt', 'Jeans'],
    ['Crown', 'Hat'],
    ['Ballet', 'Hip Hop'],
    ['Parrot', 'Crow'],
    ['Bat', 'Owl'],
    ['Candle', 'Lantern'],
    ['Library', 'University'],
    ['Museum', 'Gallery'],
    ['Radio', 'Podcast'],
    ['online news', 'Newspaper'],
    ['Pen', 'Paper'],
    ['Moon', 'Sun'],
    ['Tennis', 'Badminton'],
    ['Skiing', 'Snow'],
    ['Swimming', 'Diving'],
    ['Running', 'Jogging'],
    ['Elevator', 'Escalator'],
    ['Ferry', 'Cruise'],
    ['Map', 'GPS'],
    ['Sailboat', 'Yacht'],
    ['Meteor', 'Satellite'],
    ['Planet', 'Star'],
    ['Earthquake', 'Tsunami'],
    ['Jellyfish', 'Octopus'],
    ['Wolf', 'Fox'],
    ['Hawk', 'Vulture'],
    ['Lizard', 'Gecko'],
    ['Elvis', 'The Beatles'],
    ['Leonardo da Vinci', 'Michelangelo'],
    ['Napoleon', 'Caesar'],
    ['Gandhi', 'Mandela'],
    ['Lincoln', 'Washington'],
    ['Mario', 'Luigi'],
    ['Sonic', 'Tails'],
    ['Pac-Man', 'Tetris'],
    ['Fortnite', 'Minecraft'],
    ['Call of Duty', 'Battlefield'],
    ['Street Fighter', 'Mortal Kombat'],
    ['Game of Thrones', 'Lord of the Rings'],
    ['Star Wars', 'Star Trek'],
    ['Harry Potter', 'Percy Jackson'],
    ['Sherlock Holmes', 'Hercule Poirot'],
    ['Dracula', 'Frankenstein'],
    ['James Bond', 'Ethan Hunt'],
    ['Homer Simpson', 'Peter Griffin'],
    ['Mickey Mouse', 'Bugs Bunny'],
    ['SpongeBob', 'Patrick'],
    ['Godzilla', 'King Kong'],
    ['Lego', 'Playmobil'],
    ['UNO', 'Monopoly'],
    ['Catan', 'Risk'],
    ['Blackjack', 'Poker'],
    ['Bingo', 'Roulette'],
    ['New York', 'Los Angeles'],
    ['Paris', 'London'],
    ['Rome', 'Athens'],
    ['Sydney', 'Melbourne'],
    ['Rio de Janeiro', 'Buenos Aires'],
    ['Mount Everest', 'Nepal'],
    ['Amazon', 'Nile'],
    ['Grand Canyon', 'Niagara Falls'],
    ['Taj Mahal', 'Great Wall of China'],
    ['Eiffel Tower', 'Statue of Liberty'],
    ['Big Ben', 'Leaning Tower of Pisa'],
    ['Olympics', 'World Cup'],
    ['NBA', 'NFL'],
    ['Golf', 'Cricket'],
    ['UFC', 'WWE'],
    ['Twitch', 'Netflix'],
    ['Twitter', 'Facebook'],
    ['SpaceX', 'Tesla'],
    ['Burger King', 'McDonald’s'],
    ['Sony', 'Samsung'],
    ['Mercedes', 'BMW'],
    ['Harvard', 'MIT'],
    ['Oxford', 'Highschool'],
    ['CIA', 'FBI'],
    ['Winston Churchill', 'Franklin Roosevelt'],
    ['Hitler', 'Stalin'],
    ['Mahatma Gandhi', 'Martin Luther King Jr.'],
    ['Tesla Model S', 'Porsche Taycan'],
    ['iPhone', 'Samsung Galaxy'],
    ['PlayStation', 'Xbox'],
    ['Windows', 'MacOS'],
    ['YouTube', 'TikTok'],
    ['Twitch', 'Kick'],
    ['Spotify', 'Apple Music'],
    ['Reddit', 'Discord'],
    ['Instagram', 'Snapchat'],
    ['ChatGPT', 'Google Bard'],
    ['Clock', 'Sundial'],
    ['Laptop', 'Desktop'],
    ['Shark', 'Dolphin'],
    ['Penguin', 'Seagull'],
    ['Moon', 'Planet'],
    ['Comet', 'Asteroid'],
    ['Bridge', 'Tunnel'],
    ['Bus', 'Tram'],
    ['Train', 'Monorail'],
    ['Boat', 'Submarine'],
    ['Notebook', 'Diary'],
    ['Spoon', 'Fork'],
    ['Plate', 'Bowl'],
    ['Fountain', 'Waterfall'],
    ['Lake', 'Pond'],
    ['Giraffe', 'Zebra'],
    ['Elephant', 'Rhino'],
    ['Alligator', 'Crocodile'],
    ['Oyster', 'Clam'],
    ['Gold', 'Silver'],
    ['Platinum', 'Gold'],
    ['Denim', 'Corduroy'],
    ['Jacket', 'Coat'],
    ['Scarf', 'Tie'],
    ['Boots', 'Sneakers'],
    ['Helmet', 'Hat'],
    ['Necklace', 'Bracelet'],
    ['Ring', 'Earring'],
    ['Microphone', 'Speaker'],
    ['Headphones', 'Earbuds'],
    ['Television', 'Radio'],
    ['Projector', 'Screen'],
    ['Calculator', 'Typewriter'],
    ['Flashlight', 'Lantern'],
    ['Tent', 'Cabin'],
    ['Compass', 'Map'],
    ['Boarding pass', 'ID card'],
    ['Ticket', 'Invoice'],
    ['Passport', 'Ticket'],
    ['Subway', 'Taxi'],
    ['Sky', 'Jet'],
    ['Motorcycle', 'Scooter'],
    ['Surfboard', 'Skateboard'],
    ['Baseball', 'Football'],
    ['Volleyball', 'Basketball'],
    ['Table tennis', 'Badminton'],
    ['Bakery', 'Butcher'],
    ['Puzzle', 'Crossword'],
    ['Cards', 'Dice'],
    ['Bowling', 'Golf'],
    ['Marathon', 'Sprint'],
    ['Fencing', 'Archery'],
    ['Boxing', 'Karate'],
    ['Hockey', 'Soccer'],
    ['Concert', 'Festival'],
    ['Novel', 'Poem'],
    ['Dictionary', 'Encyclopedia'],
    ['Pharmacist', 'Doctor'],
    ['Engineer', 'Architect'],
    ['Firefighter', 'Policeman'],
    ['Germany', 'France'],
    ['Pilot', 'Astronaut'],
    ['Judge', 'Punishment'],
    ['Baker', 'Chef'],
    ['Farmer', 'Fisherman'],
    ['Blacksmith', 'Carpenter'],
    ['Heaven', 'Hell'],
    ['Sky', 'Clouds'],
    ['Japan', 'China'],
    ['Germany', 'Beer'],
    ['Movie', 'Actor'],
    ['Screen', 'TV'],
    ['France', 'Eiffel Tower'],
    ['Thor', 'Lightning'],
    ['Obi Wan', 'Force'],
    ['UFO', 'Drones'],
    ['God', 'Heaven'],
    ['Tortilla', 'Taco'],
    ['Baguette', 'Ciabatta'],
    ['Hot Dog', 'Bratwurst'],
    ['Energy Drink', 'Soda'],
    ['Coconut milk', 'soy milk'],
    ['Picasso', 'Van Gogh'],
    ['Mozart', 'Beethoven'],
    ['Messi', 'Ronaldo'],
    ['Bayern Munich', 'Real Madrid'],
    ['Ferrari', 'Lamborghini'],
    ['Coca-Cola', 'Pepsi'],
    ['London', 'Paris'],
    ['Los Angeles', 'New York'],
    ['Big Ben', 'Leaning Tower of Pisa'],
    ['Statue of Liberty', 'Eiffel Tower'],
    ['Mouse', 'Keyboard'],
    ['TV', 'Laptop'],
    ['Wardrobe', 'Showcase'],
    ['Birch', 'Shrub'],
    ['Radiator', 'Hairdryer'],
    ['Lamp', 'Candle'],
    ['Pillow', 'Blanket'],
    ['Microphone', 'Camera'],
    ['Oven', 'Microwave'],
    ['Pan', 'Pot'],
    ['Tablet', 'Smartphone'],
    ['Stairs', 'Elevator'],
    ['Techno', 'Rap'],
    ['Rock', 'Pop'],
    ['Table Tennis', 'Badminton'],
    ['Window', 'Door'],
    ['Oven', 'Heating'],
    ['Wristwatch', 'Alarm Clock'],
    ['Bed', 'Sofa'],
    ['Book', 'Newspaper'],
    ['Forest', 'Park'],
    ['Cinema', 'Bowling'],
    ['Netflix', 'Cinema'],
    ['Swimming Pool', 'Beach'],
    ['Glass', 'Cup'],
    ['Job', 'Hobby'],
    ['Jesus', 'Santa Claus'],
    ['bra', 'bikini'],
];

export default wordPairs;