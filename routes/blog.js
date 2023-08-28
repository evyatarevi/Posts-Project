const express = require("express");
const mongodb = require("mongodb");

const db = require("../data/database");
const { render } = require("ejs");

const ObjectId = mongodb.ObjectId;

const router = express.Router();

router.get("/", function (req, res) {
  res.redirect("/posts");
});

router.get("/posts", async function (req, res) {
  /*In function asynchronous,when error occur inside the function,
  the the default error middleware function will not become active.
  because that we need handle the error manually with try & catch.*/
  const posts = await db //notice to declare in 'await'!
    .getDb()
    .collection("posts")
    .find({})
    .project({ title: 1, summary: 1, "author.name": 1 }) //which values you need, 1 says i want(id include automatically)
    // we wrote 'author.name' with double Quotation marks because that is nested.
    .toArray(); //convert to array for convinces using.
  res.render("posts-list", { posts: posts });
});

router.get("/new-post", async function (req, res) {
  const authors = await db.getDb().collection("authors").find().toArray(); //return promise. another option: document curser.
  res.render("create-post", { authors: authors });
});

router.post("/posts", async (req, res) => {
  const authorId = new ObjectId(req.body.author); //convert the id from string to object(we sent the id on the name 'author' from the form). mongodb uses in it internally for storing IDs.
  const author = await db
    .getDb()
    .collection("authors")
    .findOne({ _id: authorId }); //find exactly on author. the obj is filtering. return obj.
  const newPost = {
    title: req.body.title,
    summary: req.body.summary,
    body: req.body.content,
    date: new Date(),
    author: {
      id: authorId,
      name: author.name,
      email: author.email,
    },
  };
  const result = await db.getDb().collection("posts").insertOne(newPost);
  res.redirect("/posts");
});

router.get("/posts/:id", async (req, res, next) => {
  /*In function asynchronous,when error occur inside the function,
  the the default error middleware function will not become active.
  because that we need handle the error manually with try & catch.*/
  let postId = req.params.id;
  try {
    postId = new ObjectId(postId);
  } catch (error) {
    //option 1: default error middleware handle function become active
    return next(error); 
    /*return - for don't execute next line. 
    next() - move the request on to next middleware. 
    next(error) - move to default error function*/

    //option 2: return res.status(404).render('404');
  }
  const post = await db
    .getDb()
    .collection("posts")
    .findOne({ _id: postId }, { summary: 0 });
  if (!post) {
    return res.status(404).render("404"); //I return here so that no other code executes
  }
  res.render("post-detail", { post: post });
});

router.get("/edit-post/:id", async (req, res) => {
  const postId = req.params.id;
  const post = await db
    .getDb()
    .collection("posts")
    .findOne({ _id: new ObjectId(postId) }, { title: 1, summary: 1, body: 1 });
  if (!post)
    //falsy value: undefined, null, '', 0, false.
    return res.status(404).render("404");
  res.render("update-post", { post: post });
});

router.post("/edit-post", (req, res) => {
  const postId = req.body.id;
  const updatedPost = {
    title: req.body.title,
    summary: req.body.summary,
    body: req.body.content,
    date: new Date(),
  };
  const result = db
    .getDb()
    .collection("posts")
    .updateOne({ _id: new ObjectId(postId) }, { $set: updatedPost });
  res.redirect("/posts");
});

// option 1(with POST request, because POST say that the database change):
router.post("/delete-post/:id", async (req, res) => {
  const postId = new ObjectId(req.params.id);
  const result = await db
    .getDb()
    .collection("posts")
    .deleteOne({ _id: postId });
  console.log(result);
  res.redirect("/posts");
});

// option 2 (with GET request):
// router.get("/delete-post/:id", async (req, res) => {
//   const postId = req.params.id;
//   const response = await db
//     .getDb()
//     .collection("posts")
//     .deleteOne({ _id:  new ObjectId(postId) });
//   console.log(response);
//   res.redirect('/posts');
// });

module.exports = router;
