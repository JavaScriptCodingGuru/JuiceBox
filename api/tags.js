const express = require('express');
const {getAllTags, getPostsByTagName} = require('../db')

const tagsRouter = express.Router();


tagsRouter.use((req, res, next)=>
{
    console.log("A request is being made to /tags");

    next();
});

tagsRouter.get("/", async(req, res)=>
{
    const tags = await getAllTags();

    res.send({
        tags
    });
});

tagsRouter.get('/:tagName/posts', async (req, res, next) => {
    const { tagName } = req.params;

    try {
        const allPosts = await getPostsByTagName(tagName);

        const posts = allPosts.filter(post=>
      {
        return post.active || (req.user && post.author.id === req.user.id);
      })
        if (posts) {
            res.send({ posts: posts });
        } 
        next({
            name: 'Get tags error',
            message: 'Failed to get tags'
        })

    } catch ({ name, message }) {
        next({ name, message });
    }
  });

module.exports = tagsRouter;