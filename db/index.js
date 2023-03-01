// inside db/index.js
const pg = require('pg'); // imports the pg module

// supply the db name and location of the database
const client = new pg.Client({
  user: 'postgres',
  password: 'password',
  host: 'localhost',
  port: 55556,
  database: 'juicebox'
}
);

module.exports = {
  client,
}