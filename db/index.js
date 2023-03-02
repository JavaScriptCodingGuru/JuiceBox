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

async function updateUser(id, fields = {}) {
    // build the set string
    const setString = Object.keys(fields).map(
      (key, index) => `"${ key }"=$${ index + 1 }`
    ).join(', ');
  
    // return early if this is called without fields
    if (setString.length === 0) {
      return;
    }
    console.log(setString)
    try {
      const {rows :[user]} = await client.query(`
        UPDATE users
        SET ${ setString }
        WHERE id=${ id }
        RETURNING *;
      `, Object.values(fields));
      
      return user;
    } catch (error) {
      throw error;
    }
  }

async function getUserById(userId) {
  // first get the user (NOTE: Remember the query returns 
    // (1) an object that contains 
    // (2) a `rows` array that (in this case) will contain 
    // (3) one object, which is our user.
  // if it doesn't exist (if there are no `rows` or `rows.length`), return null

  // if it does:
  // delete the 'password' key from the returned object
  // get their posts (use getPostsByUser)
  // then add the posts to the user object with key 'posts'
  // return the user object

  try {
    const { rows } = await client.query(`
      SELECT * FROM users
      WHERE "id"=${ userId };
    `);

    if (!rows.length) {
      return null;
    }

    delete rows.password;

    const posts = getPostsByUser(userId);
    rows.posts = posts;

    return rows
  } catch (error) {
    throw error;
  }
}

  async function createPost({
    authorId,
    title,
    content
  }) {
    console.log("here")
    try {
      const result= await client.query(`
        INSERT INTO posts("authorId", title, content)
        VALUES ($1, $2, $3)
        RETURNING *;
      `, [authorId, title, content]);
      console.log("here too")
        return result.rows;
    } catch (error) {
      throw error;
    }
  }

async function updatePost(id, {
  title,
  content,
  active
}) {
  // build the set string
  console.log("1")
  const setString = `"${title}"=$1, "${content}" = $2, "${active}"=$3`;
  console.log("2")
  // return early if this is called without fields
  if (setString.length === 0) {
    return;
  }
  console.log(setString)
  try {
    const {rows :[post]} = await client.query(`
        UPDATE posts
        SET ${ setString }
        WHERE id=${ id }
        RETURNING *;
      `, Object.values(title, content, active));
  } catch (error) {
    throw error;
  }
}

async function getAllPosts() {
  try {
    const {rows} = await client.query(
      `SELECT "authorId", title, content, active
      FROM posts;`
    );
  
  return rows;
  } catch (error) {
    throw error;
  }
}

async function getPostsByUser(userId) {
  try {
    const { rows } = await client.query(`
      SELECT * FROM posts
      WHERE "authorId"=${ userId };
    `);

    return rows;
  } catch (error) {
    throw error;
  }
}

module.exports = {
  client,
  getAllUsers,
  createUser,
  updateUser,
  createPost,
  updatePost,
  getAllPosts,
  getPostsByUser,
  getUserById
}