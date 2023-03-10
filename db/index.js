// inside db/index.js
require('dotenv').config();
const pg = require('pg'); // imports the pg module
const {Pool} = require('pg');

const pool = new Pool({
  host:"db.bit.io",
  port: 5432,
  user: "JavaScriptCodingGuru",
  password:"v2_3zwxa_NLmHxzEjixj4ddsZvggDdMv",
  database:"JavaScriptCodingGuru/juicebox",
  connectionTimeoutMillis: 0,
  idleTimeoutMillis: 10,
  max: 20,
  ssl: true
});

console.log(process.env.DATABASE_URL==="postgresql://JavaScriptCodingGuru:v2_3zstf_qPvUsDW7wUrgY7LU7EwdhDb@db.bit.io:5432/JavaScriptCodingGuru.juicebox?ssl=true");
async function getAllUsers()
{
  try{
    const client = await pool.connect();
    const {rows} = await client.query(
        `SELECT id, username, name, location, active
        FROM users;`
        );
    client.release();
    return rows;
  }catch(e)
  {
    throw e;
  }
}

async function createUser({username, password, name, location})
{
    try{
        const client = await pool.connect();
        const result= await client.query(`
        INSERT INTO users(username, password, name, location)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (username) DO NOTHING 
        RETURNING *;
      `, [username, password, name, location]);
      client.release();
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
    try {
      const client = await pool.connect();
      const {rows :[user]} = await client.query(`
        UPDATE users
        SET ${ setString }
        WHERE id=${ id }
        RETURNING *;
      `, Object.values(fields));
      client.release();
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
    const client = await pool.connect();
    const { rows:[user] } = await client.query(`
      SELECT * FROM users
      WHERE "id"=${ userId };
    `);

    if (!user) {
      return null;
    }
    delete user.password;

    const posts = await getPostsByUser(userId);
    user.posts = posts;
    client.release();
    return user;
  } catch (error) {
    throw error;
  }
}

async function getUserByUsername(username) {
  try {
    const client = await pool.connect();
    const { rows: [user] } = await client.query(`
      SELECT *
      FROM users
      WHERE username=$1;
    `, [username]);
    client.release();
    return user;
  } catch (error) {
    throw error;
  }
}

  async function createPost({
    authorId,
    title,
    content,
    tags=[]
  }) {
    try {
      const client = await pool.connect();
      const {rows:[post]}= await client.query(`
        INSERT INTO posts("authorId", title, content)
        VALUES ($1, $2, $3)
        RETURNING *;
      `, [authorId, title, content]);

      const tagList = await createTags(tags);
      client.release();
      return await addTagsToPost(post.id, tagList);
    } catch (error) {
      throw error;
    }
  }

  async function updatePost(postId, fields = {}) {
    // read off the tags & remove that field 
    const { tags } = fields; // might be undefined
    delete fields.tags;
  
    // build the set string
    const setString = Object.keys(fields).map(
      (key, index) => `"${ key }"=$${ index + 1 }`
    ).join(', ');
  
    try {
      // update any fields that need to be updated
      const client = await pool.connect();
      if (setString.length > 0) {
        await client.query(`
          UPDATE posts
          SET ${ setString }
          WHERE id=${ postId }
          RETURNING *;
        `, Object.values(fields));
      }
  
      // return early if there's no tags to update
      if (tags === undefined) {
        return await getPostById(postId);
      }
  
      // make any new tags that need to be made
      const tagList = await createTags(tags);
      const tagListIdString = tagList.map(
        tag => `${ tag.id }`
      ).join(', ');
  
      // delete any post_tags from the database which aren't in that tagList
      await client.query(`
        DELETE FROM post_tags
        WHERE "tagId"
        NOT IN (${ tagListIdString })
        AND "postId"=$1;
      `, [postId]);
  
      // and create post_tags as necessary
      await addTagsToPost(postId, tagList);
      client.release();
      return await getPostById(postId);
    } catch (error) {
      throw error;
    }
  }

async function getAllPosts() {
  try {
    const client = await pool.connect();
    const {rows: postIds} = await client.query(
      `SELECT id
      FROM posts;`
    );

    const posts = await Promise.all(
      postIds.map(
        post=> getPostById(post.id)
      )
    )
    client.release();
  return posts;
  } catch (error) {
    throw error;
  }
}

async function getPostsByUser(userId) {
  try {
    const client = await pool.connect();
    const { rows:postIds } = await client.query(`
      SELECT * FROM posts
      WHERE "authorId"=${ userId };
    `);

    const posts = await Promise.all(
      postIds.map(
        post=>getPostById(post.id)
        )
      );
    client.release();
    return posts;
  } catch (error) {
    throw error;
  }
}

async function getPostById(postId) {
  try {
    const client = await pool.connect();
    const { rows: [ post ]  } = await client.query(`
      SELECT *
      FROM posts
      WHERE id=$1;
    `, [postId]);

    const { rows: tags } = await client.query(`
      SELECT tags.*
      FROM tags
      JOIN post_tags ON tags.id=post_tags."tagId"
      WHERE post_tags."postId"=$1;
    `, [postId])

    const { rows: [author] } = await client.query(`
      SELECT id, username, name, location
      FROM users
      WHERE id=$1;
    `, [post.authorId])

    post.tags = tags;
    post.author = author;

    delete post.authorId;
    client.release();
    return post;
  } catch (error) {
    throw error;
  }
}
async function getPostsByTagName(tagName) {
  try {
    const client = await pool.connect();
    const { rows: postIds } = await client.query(`
      SELECT posts.id
      FROM posts
      JOIN post_tags ON posts.id=post_tags."postId"
      JOIN tags ON tags.id=post_tags."tagId"
      WHERE tags.name=$1;
    `, [tagName]);
    client.release();
    return await Promise.all(postIds.map(
      post => getPostById(post.id)
    ));
  } catch (error) {
    throw error;
  }
} 

async function createTags(tagList) {
  if (tagList.length === 0) { 
    return; 
  }

  // need something like: $1), ($2), ($3 
  const insertValues = tagList.map(
    (_, index) => `$${index + 1}`).join('), (');
  // then we can use: (${ insertValues }) in our string template

  // need something like $1, $2, $3
  const selectValues = tagList.map(
    (_, index) => `$${index + 1}`).join(', ');
  // then we can use (${ selectValues }) in our string template

  try {
    // insert the tags, doing nothing on conflict
    // returning nothing, we'll query after
    const client = await pool.connect();
    await client.query(`
        INSERT INTO tags(name)
        VALUES (${insertValues})
        ON CONFLICT (name) DO NOTHING;
      `, tagList);

    // select all tags where the name is in our taglist
    // return the rows from the query
    const result= await client.query(`
      SELECT * FROM tags
      WHERE name
      IN (${selectValues});
    `, tagList);
    client.release();
    return result.rows;

  } catch (error) {
    throw error;
  }
}

async function createPostTag(postId, tagId) {
  try {
    const client = await pool.connect();
    await client.query(`
      INSERT INTO post_tags("postId", "tagId")
      VALUES ($1, $2)
      ON CONFLICT ("postId", "tagId") DO NOTHING;
    `, [postId, tagId]);
    client.release();
  } catch (error) {
    throw error;
  }
}

async function addTagsToPost(postId, tagList) {
  try {
    const createPostTagPromises = tagList.map(
      tag => createPostTag(postId, tag.id)
    );

    await Promise.all(createPostTagPromises);

    return await getPostById(postId);
  } catch (error) {
    throw error;
  }
}

async function getAllTags()
{
  try{
    const client = await pool.connect();
    const result = await client.query(`
      SELECT * FROM tags;
    `)
    client.release();
    return result;
  }
  catch(e)
  {
    throw e;
  }
}


module.exports = {
  pool,
  getAllUsers,
  createUser,
  updateUser,
  createPost,
  updatePost,
  getAllPosts,
  getPostsByUser,
  getUserById,
  getUserByUsername,
  createTags,
  createPostTag,
  addTagsToPost,
  getPostsByTagName,
  getAllTags, 
  getPostById
}