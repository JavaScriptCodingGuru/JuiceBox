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
        `SELECT id, username
        FROM users;`
    );
    
    return rows;
}

async function createUser({username, password})
{
    try{
        const result= await client.query(`
        INSERT INTO users(username, password)
        VALUES ($1, $2)
        ON CONFLICT (username) DO NOTHING 
        RETURNING *;
      `, [username, password]);
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