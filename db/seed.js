// inside db/seed.js

// grab our client with destructuring from the export in index.js
const { client, getAllUsers } = require('./index');
async function testDB() {
  try {
    // connect the client to the database, finally

    // queries are promises, so we can await them
    const result = await client.query(`SELECT * FROM users;`);
    const users = await getAllUsers();
    // for now, logging is a fine way to see what's up
    console.log(result);
    console.log(users);
  } catch (error) {
    console.error(error);
  } 
}

async function dropTables() {
  try {
    await client.query(`
    DROP TABLE IF EXISTS users
    `);
  } catch (error) {
    throw error; // we pass the error up to the function that calls dropTables
  }
}

// this function should call a query which creates all tables for our database 
async function createTables() {
  try {
    await client.query(`
    CREATE TABLE users(
      id SERIAL PRIMARY KEY,
      username varchar(255) UNIQUE NOT NULL,
      password varchar(255) NOT NULL
    );
    `);
    console.log("Finished building tables")
  } catch (error) {
    throw error; // we pass the error up to the function that calls createTables
  }
}

async function rebuildDB() {
  try {
    client.connect();

    await dropTables();
    await createTables();
  } catch (error) {
    console.error(error);
  }
}

rebuildDB()
.then(testDB)
  .catch(console.error)
  .finally(() => client.end());


//testDB();