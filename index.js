import express from "express";
import cors from "cors";
import "dotenv/config";
import { MongoClient, ObjectId } from "mongodb";

const app = express();
const port = 5000;

// middleware
app.use(cors());
app.use(express.json());

// mongodb connection

const client = new MongoClient(process.env.MONGODB_URI);

export async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("You successfully connected to MongoDB!");
    return client;
  } catch (err) {
    console.dir(err);
  }
}

const connectMongodb = await connectToMongoDB();
const allBooks = connectMongodb.db("booknook-server");
const books = allBooks.collection("all-books");
const borrowedBooks = allBooks.collection("borrowed-books");


app.get("/", (req, res) => {
  res.send("Hello World!");
});

// get all books
app.get("/books", async (req, res) => {
  const cursor = books.find({});
  const allUsers = await cursor.toArray();
  res.send(allUsers);
});

// create
app.post("/books", async (req, res) => {
  const newBooks = req.body;
  console.log("adding new book", newBooks);

  const result = await books.insertOne(newBooks);
  res.send(result);
});
// read
app.get("/books/:id", async (req, res) => {
  console.log(req);
  const id = req.params.id;

  const query = { _id: new ObjectId(id) };
  const result = await books.findOne(query);
  res.send(result);
});

// new-arrivals
app.get("/new-arrivals", async (req, res) => {
  const latestbooks = await books.find({}).sort({ _id: -1 }).limit(6).toArray();
  res.send(latestbooks);
});

// my-books
app.get("/my-books/:email", async (req, res) => {
  const email = req.params.email;

  const result = await books.find({ "addedBy.email": email }).toArray();
  res.send(result);
});

// my-books update
app.patch("/books/:id", async (req, res) => {
  const id = req.params.id;
  const data = req.body;
  console.log(data);
  const result = await books.updateOne(
    { _id: new ObjectId(id) },
    { $set: data },
  );
  res.send(result)
});

//my-book delete
app.delete('/books/:id', async (req, res) => {
   const id = req.params.id;
   const query = {_id:new ObjectId(id)}
   const result = await books.deleteOne(query)
   res.send(result)
});


// profile edit
app.patch("/profile/:id", async (req, res) => {

  const data = req.body;
  console.log(data);
  const result = await books.updateOne(
    { $set: data },
  );
  res.send(result)
});

// borrow
app.post("/borrow", async (req, res) => {
   const data = req.body;

   const result = await books.updateOne(
    {_id: new ObjectId(data.bookId),totalCopies: {$gt:0}},
    {$inc:{totalCopies: -1}}
   )

   if (result.modifiedCount === 0) {
    return res.status(400).send({ message: "Book is not available" });
  }

  const borrowResult = await borrowedBooks.insertOne(data);
  res.send(borrowResult);

});

app.get("/my-borrows/:email", async (req, res) => {
  const email = req.params.email;
  
  const result = await borrowedBooks.find({ userEmail: email }).toArray();
  res.send(result);
});

// return 
app.delete('/borrow/:id', async (req, res) => {

   const id = req.params.id;
    const borrowedbook = await borrowedBooks.findOne({
         _id: new ObjectId(id),
    });

    if (!borrowedbook) {
    return res.status(404).send({
      message: "Borrowed book not found",
    });
  }
    await books.updateOne(
      {_id:new ObjectId(borrowedbook.bookId)},
      {$inc:{totalCopies: 1}}
    
    )

  // Delete borrowed record
  const result =  await borrowedBooks.deleteOne({
    _id: new ObjectId(id),
  });

  res.send({
    message: "Book returned successfully",
    result,
  });
  }

);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
