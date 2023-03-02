// inside db/index.js
const pg = require('pg'); // imports the pg module

// supply the db name and location of the database
const client = new pg.Client({
    user: 'postgres',
    password: 'password',
    host: 'localhost',
    port: 5555,
    database: 'juicebox'
}
);

async function getAllUsers()
{
    const {rows} = await client.query(
        `SELECT id, username, name, location, active
        FROM users;`
    );
    
    return rows;
}

async function createUser({username, password, name, location})
{
    try{
        const result= await client.query(`
        INSERT INTO users(username, password, name, location)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (username) DO NOTHING 
        RETURNING *;
      `, [username, password, name, location]);
        return result.rows;
    }
    catch(e)
    {
        throw e;
    }
}

module.exports = {
  client,
  getAllUsers,
  createUser
}