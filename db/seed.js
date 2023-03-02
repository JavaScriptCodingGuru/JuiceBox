// inside db/seed.js

// grab our client with destructuring from the export in index.js
const { client, getAllUsers } = require('./index');

const {
  createUser
} = require('./index');

// new function, should attempt to create a few users
async function createInitialUsers() {
  try {
    console.log("Starting to create users...");

    await createUser({ username: 'albert', password: 'bertie99', name:"Albert", location: "New York" });
    await createUser({ username: 'sandra', password: '2sandy4me', name:"Sandra", location: "New Jersey" });
    await createUser({ username: 'glamgal', password: 'soglam', name: "Glamgal", location: "Jupitor" });

    console.log("Finished creating users!");
  } catch(error) {
    console.error("Error creating users!");
    throw error;
  }
}

async function testDB() {
  try {
    // connect the client to the database, finally
    console.log("Starting to test database...");

    // queries are promises, so we can await them
    const result = await client.query(`SELECT * FROM users;`);

    console.log("result:", result);
    const users = await getAllUsers();
    console.log("getAllUsers:", users);

    // for now, logging is a fine way to see what's up
    console.log("Finished database tests!")
  } catch (error) {
    console.error(error);
  } 
}

async function dropTables() {
  try {
    console.log("Starting to drop tables...");

    await client.query(`
    DROP TABLE IF EXISTS users
    `);

    console.log("Finished dropping tables!");
  } catch (error) {
    console.error("Error dropping tables!");
    throw error; // we pass the error up to the function that calls dropTables
  }
}

// this function should call a query which creates all tables for our database 
async function createTables() {
  try {
    console.log("Starting to build tables...");

    await client.query(`
    CREATE TABLE users(
      id SERIAL PRIMARY KEY,
      username varchar(255) UNIQUE NOT NULL,
      password varchar(255) NOT NULL,
      name VARCHAR (255) NOT NULL,
      location VARCHAR(255) NOT NULL,
      active BOOLEAN DEFAULT true
    );
    `);
    console.log("Finished building tables")
  } catch (error) {
    console.error("Error building tables!");
    throw error; // we pass the error up to the function that calls createTables
  }
}

async function rebuildDB() {
  try {
    client.connect();

    await dropTables();
    await createTables();
    await createInitialUsers();
  } catch (error) {
    console.error(error);
  }
}

rebuildDB()
.then(testDB)
  .catch(console.error)
  .finally(() => client.end());


//testDB();