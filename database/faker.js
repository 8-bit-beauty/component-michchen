/* (1) set numToGenerate */
const numToGenerate = 100;

/* (2) run "node database/faker.js" in the terminal
node database/faker.js
*/

/*
--- NOTES ---
delete "link" columns

Add "fit" (maybe), "Prime"
Add star distribution and fit distribution

Breadcrumb trail?
"Style" in addition to Size and Color?
Replace "In stock" with "available"?
Convert prices back to normal, eg $5.99 = '5.99' and not '599'
More images per product
*/

// INSERT INTO products (id, productName, productUrl, sellerName, sellerUrl, ratingsAverage, ratingsCount, questionsCount, categoryName, categoryUrl, price, priceList, freeReturns, freeShipping, soldByName, soldByUrl, available, description, usedCount, usedPrice) VALUES (101, "LG G6+ - 128 GB - Unlocked (AT&T/T-Mobile/Verizon) - Black - Prime Exclusive", "#", "LG", "#", 4, 80, 86, "Cell Phones & Accessories", "#", 40999, 79999, 1, 1, "Some sketchy guy", "#", 1, "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut ornare augue non eleifend accumsan. \nMaecenas sit amet maximus lacus. Nullam eu placerat metus, et aliquet ex. Vivamus justo magna, tincidunt a convallis eu, semper vitae nunc. \nSed tincidunt quis purus vitae dictum. \nDonec eu ante pharetra, maximus erat sit amet, imperdiet odio. \nIn tincidunt feugiat ligula, quis tempus leo eleifend in. Pellentesque vitae lectus est.", 20, 30749);

// INSERT INTO images (productId,varKey,varValue,imageUrl) VALUES (101, "","","https://images-na.ssl-images-amazon.com/images/I/61Rh3tVbr-L._SL1200_.jpg");


const cats = require('./cats');
const faker = require('faker');
const db = require('./db');

// possible product variations to choose from
const variations = [
  {
    category: 'color',
    data: ['Medium Spring Green', 'Coral', 'Lawn Green', 'Yellow', 'Orange', 'Light Steel Blue', 'Fire Brick', 'Light Grey', 'Dark Goldenrod', 'Burly Wood', 'Dark Slate Blue', 'Cornflower Blue', 'Powder Blue', 'Dark Blue', 'Dark Slate Gray', 'Maroon', 'Silver', 'Light Salmon', 'Seashell', 'Medium Sea Green'],
  }, {
    category: 'size',
    data: [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10],
  },
];

// function randImArr: gets a randomly-sized part of the image array (sourced from from cats.js)
function randImArr() {
  // num = a random number between 1 and 4, representing number of images to get
  const howManyImages = Math.round(Math.random() * 3) + 1;
  return `[${// randomize cats
    cats.data.sort(() => 0.5 - Math.random())
      // get a random slice of the array
      .slice(0, howManyImages)
      // put each entry between single quotes
      .map(x => `'${x}'`)
      // join by comma
      .join(',')}
    ]`;
}

function truncateToDecimalPlace(num, places) {
  let placesCopy = places || 0;
  placesCopy = 10 ** placesCopy;
  return Math.round(num * placesCopy) / placesCopy;
}

function randomNumFromRange(lowerBound, upperBound, growthRate, decimalPlaces) {
  let growthRateCopy;
  if (growthRate === undefined || growthRate === 'exp') {
    // more low numbers
    growthRateCopy = 2;
  } else if (growthRate === 'log') {
    // more high numbers. a higher denominator means on average higher nums are generated
    growthRateCopy = 1 / 1.5;
  }
  return truncateToDecimalPlace((Math.random() ** growthRateCopy)
        * (upperBound - lowerBound) + lowerBound, decimalPlaces);
}

function createProductQuery(howMany) {
  let queryConcat = 'INSERT INTO products (productName, sellerName, ratingsAverage, ratingsCount, questionsCount, amazonsChoice, categoryName, priceList, price, freeReturns, freeShipping, soldByName, available, hasCountdown, description, usedCount, usedPrice) VALUES ';

  for (let i = 0; i < howMany; i += 1) {
    if (i > 0) {
      queryConcat += ',';
    }

    // the 9 is to put the price within an affordable range haha
    const listPrice = parseInt(faker.commerce.price() / 9);

    // price is between 80% to 95% of the list price
    const price = listPrice * (randomNumFromRange(80, 95) / 100);

    // used price is between 50% to 95% of the price
    const usedPrice = price * (randomNumFromRange(50, 95) / 100);

    // generate a random sequence of departments for breadcrumb
    let department = `${faker.commerce.department()}`;
    const times = Math.round(Math.random() * 4) + 1;
    Array(times).fill('').forEach(() => {
      department += `\n${faker.commerce.department()}`;
    });

    queryConcat += `(
"${/* productName */faker.commerce.productName()}",\
"${/* sellerName */faker.company.companyName()}",\
"${/* ratingsAverage */randomNumFromRange(0.5, 5, 'log', 1)}",\
"${/* ratingsCount */randomNumFromRange(5, 1000)}",\
"${/* questionsCount */randomNumFromRange(2, 30, 'log')}",\
"${/* amazonsChoice */randomNumFromRange(0, 1)}",\
"${/* categoryName */department}",\
"${/* priceList */listPrice}",\
"${/* price */price}",\
"${/* freeReturns */randomNumFromRange(0, 1)}",\
"${/* free_shipping */randomNumFromRange(0, 1)}",\
"${/* sold_byName */faker.company.companyName()}",\
"${/* available */randomNumFromRange(0, 1, 'log')}",\
"${/* hasCountdown */randomNumFromRange(0, 1)}",\
"${/* description */faker.lorem.lines().replace(/\n/g, '\\n')}",\
"${/* usedCount */randomNumFromRange(1, 20)}",\
"${/* usedPrice */usedPrice}"\
)`;
  }
  // end for loop

  return `${queryConcat};`;
}

function createImageQuery(howMany) {
  let queryConcat = 'INSERT INTO images (productId,varKey,varValue,imageUrl) VALUES ';
  let imindex = 0;

  // for each productId, adKa new quVy to the queryConcat string
  for (let productID = 1; productID <= howMany; productID += 1) {
    const categoryObj = variations[Math.round(Math.random())];

    // loop through a few items at a random section of the array
    const randStart = Math.round(Math.random() * (categoryObj.data.length / 2));
    const maxItems = 5;
    const randEnd = randStart + Math.ceil(Math.random() * maxItems);

    for (let j = randStart; j < randEnd; j += 1) {
      if (imindex > 0) {
        queryConcat += ',';
      }
      queryConcat += `(\
"${/* productId */productID}",\
"${/* var_key */categoryObj ? categoryObj.category : ''}",\
"${/* var_value */categoryObj ? categoryObj.data[j] : ''}",\
"${/* imageUrl */cats.data[imindex % cats.data.length]}"\
)`;
      imindex += 1;
    }
  }

  return `${queryConcat};`;
}

// reset products table and insert rows
db.resetTable('products', () => {
  db.insertRow(createProductQuery(numToGenerate), () => {
    console.log(`  INSERTED ${numToGenerate} ROWS into products`);

    // reset images table and insert rows
    db.resetTable('images', () => {
      db.insertRow(createImageQuery(numToGenerate), () => {
        // log success
        console.log(`  INSERTED ${numToGenerate} ROWS into images`);
        console.log('Data generation finished. Press ctrl-C to exit.');
      });
    });
  });
});
