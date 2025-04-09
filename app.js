// # 1
//Import the MySQL2 library to interact with the MySQL dattabase
let mysql2 = require("mysql2");

// Import the Express framework to create a web server.
let express = require("express");

// Import CORS to allow cross-origin requests
let cors = require("cors");

// Initialize an Express application
let app = express();

let port = 5000;

// Middleware setup - MUST come before route handlers
app.use(express.urlencoded({ extended: true })); // For parsing form data
app.use(cors());

//make it listen at port 5000.
app.listen(port, () => {
  console.log("The server is up and running.");
});

// Creating the connection object with the provided configuration
let connection = mysql2.createConnection({
  //Key and value pairs of configuration
  user: "myDBuser",
  host: "localhost",
  password: "123456",
  database: "mydb",
});

//  establishing the connection to the database
connection.connect((err) => {
  if (err) console.log("Couldn't connect to the database: " + err.message);
  else console.log("Connected to the database!");
});

// #2
//* Syntax
/* CREATE TABLE table_name (
    Column_name datatype,
    Column_name datatype,
    Column_name datatype,
   ....
); */

//#2
// using get request to handle the /install route.
app.get("/install", (req, res) => {
  // Products table query
  let createProducts = `CREATE TABLE IF NOT EXISTS Products(
Product_id INT PRIMARY KEY AUTO_INCREMENT,
Product_url VARCHAR(255),
Product_name VARCHAR(100)
)`;
  // Product_Description table query
  let createDescription = `CREATE TABLE IF NOT EXISTS Product_Description(
Description_id INT PRIMARY KEY AUTO_INCREMENT,
Product_id INT,
Product_brief_description VARCHAR(300),
Product_description TEXT,
Product_img VARCHAR(255),
Product_link VARCHAR(255),
FOREIGN KEY (Product_id) REFERENCES Products(Product_id) 
)`;
  // Product_Price table query
  let createPrice = `CREATE TABLE IF NOT EXISTS Product_Price(
Price_id INT PRIMARY KEY AUTO_INCREMENT,
Product_id INT,
Starting_price VARCHAR(100),
Price_range VARCHAR(100),
FOREIGN KEY (Product_id) REFERENCES Products(Product_id)
)`;
  // User table query
  let createUser = `CREATE TABLE IF NOT EXISTS User(
User_id INT PRIMARY KEY AUTO_INCREMENT,
User_name VARCHAR(50) NOT NULL,
User_password VARCHAR(50) NOT NULL
)`;

  // Orders table query
  let createOrders = `CREATE TABLE IF NOT EXISTS Orders (
Order_id INT PRIMARY KEY AUTO_INCREMENT ,
Product_id INT,
User_id INT ,
FOREIGN KEY (Product_id) REFERENCES Products (Product_id),
FOREIGN KEY (user_id) REFERENCES User(User_id)
)`;
  // Excuting Products table query
  connection.query(createProducts, (err, result) => {
    if (err) {
      console.log(err);
      return res.send("Error while creating Products table.");
    }
    console.log("Products table created");
    // Excuting Product_Description table query
    connection.query(createDescription, (err, result) => {
      if (err) {
        console.log(err);
        return res.send("Error while creating Product_Description table.");
      }
      console.log("Product_Description table created.");
      // Excutong Product_Price table query
      connection.query(createPrice, (err, result) => {
        if (err) {
          console.log(err);
          return res.send("Error while creating Product_Price table");
        }
        console.log("Product_Price table created.");
        // Excuting user table query
        connection.query(createUser, (err, result) => {
          if (err) {
            console.log(err);
            return res.send("Error while creating user table.");
          }
          console.log("User table created.");
          // Excuting Orders table query
          connection.query(createOrders, (err, result) => {
            if (err) {
              console.log(err);
              return res.send("Error while creating Orders table.");
            }
            console.log("Orders table created.");
            res.send("All tables created successfully!");
          });
        });
      });
    });
  });
});

// #3 - New code for handling form submission
// Single endpoint to handle all table insertions
app.post("/add-product", (req, res) => {
  // Extract all form data from request body
  const {
      product_url,
      product_name,
      product_brief_description,
      product_description,
      product_img,
      product_link,
      starting_price,
      price_range,
      user_name,
      user_password,
      user_id // Optional: if provided, use existing user; otherwise create new
  } = req.body;

  // Start with Products table insertion
  const productQuery = `INSERT INTO Products (Product_url, Product_name) VALUES (?, ?)`;
  connection.query(productQuery, [product_url, product_name], (err, productResult) => {
      if (err) {
          console.log("Error inserting product: " + err.message);
          return res.status(500).send("Error adding product");
      }

      const productId = productResult.insertId;

      // Insert Product Description
      const descQuery = `INSERT INTO Product_Description 
                        (Product_id, Product_brief_description, Product_description, Product_img, Product_link) 
                        VALUES (?, ?, ?, ?, ?)`;
      connection.query(descQuery, 
          [productId, product_brief_description, product_description, product_img, product_link], 
          (err, descResult) => {
              if (err) {
                  console.log("Error inserting description: " + err.message);
                  return res.status(500).send("Error adding product description");
              }

              // Insert Product Price
              const priceQuery = `INSERT INTO Product_Price 
                                (Product_id, Starting_price, Price_range) 
                                VALUES (?, ?, ?)`;
              connection.query(priceQuery, 
                  [productId, starting_price, price_range], 
                  (err, priceResult) => {
                      if (err) {
                          console.log("Error inserting price: " + err.message);
                          return res.status(500).send("Error adding product price");
                      }

                      // Handle User (create new or use existing)
                      let finalUserId;
                      if (user_id) {
                          // Use existing user if user_id is provided
                          finalUserId = user_id;
                          insertOrder(finalUserId);
                      } else {
                          // Create new user if no user_id is provided
                          const userQuery = `INSERT INTO User (User_name, User_password) VALUES (?, ?)`;
                          connection.query(userQuery, 
                              [user_name, user_password], 
                              (err, userResult) => {
                                  if (err) {
                                      console.log("Error inserting user: " + err.message);
                                      return res.status(500).send("Error adding user");
                                  }
                                  finalUserId = userResult.insertId;
                                  insertOrder(finalUserId);
                              });
                      }

                      // Function to insert Order (called after user handling)
                      function insertOrder(userId) {
                          const orderQuery = `INSERT INTO Orders (Product_id, User_id) VALUES (?, ?)`;
                          connection.query(orderQuery, 
                              [productId, userId], 
                              (err, orderResult) => {
                                  if (err) {
                                      console.log("Error inserting order: " + err.message);
                                      return res.status(500).send("Error adding order");
                                  }
                                  console.log("Complete product entry added successfully!");
                                  res.send("Product and all related data added successfully!");
                              });
                      }
                  });
              });
          });
  });

