// inside db/index.js
const pg = require('pg'); // imports the pg module

// supply the db name and location of the database
const client = new pg.Client({
  
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

    const posts = await getPostsByUser(userId);
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
    try {
      const result= await client.query(`
        INSERT INTO posts("authorId", title, content)
        VALUES ($1, $2, $3)
        RETURNING *;
      `, [authorId, title, content]);
        return result.rows;
    } catch (error) {
      throw error;
    }
  }

async function updatePost(id, fields = {}) {
  // build the set string
  const setString = Object.keys(fields).map(
    (key, index) =>`"${ key }"=$${ index + 1 }`
  ).join(', ');
  if (setString.length === 0) {
    return;
  }
  console.log(setString, id)
  try {
    const {rows :[post]} = await client.query(`
        UPDATE posts
        SET ${ setString }
        WHERE id=${ id }
        RETURNING *;
      `, Object.values(fields));
      return post;
  } catch (error) {
    throw error;
  }
}

async function getAllPosts() {
  try {
    const {rows} = await client.query(
      `SELECT "authorId", title, content, active, id
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

async function getPostById(postId) {
  try {
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

    return post;
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

  console.log(insertValues, selectValues);

  try {
    // insert the tags, doing nothing on conflict
    // returning nothing, we'll query after
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
      IN ${selectValues};
    `, tagList);

    return result.rows;

  } catch (error) {
    throw error;
  }
}

async function createPostTag(postId, tagId) {
  try {
    await client.query(`
      INSERT INTO post_tags("postId", "tagId")
      VALUES ($1, $2)
      ON CONFLICT ("postId", "tagId") DO NOTHING;
    `, [postId, tagId]);
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

module.exports = {
  client,
  getAllUsers,
  createUser,
  updateUser,
  createPost,
  updatePost,
  getAllPosts,
  getPostsByUser,
  getUserById,
  createTags,
  createPostTag,
  addTagsToPost
}