import express from 'express';
import cors from 'cors'
import 'dotenv/config'


const app = express()
const port = 5000

// middleware
app.use(cors())
app.use(express.json())

// mongodb connection
import { MongoClient } from 'mongodb';

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
const allBooks = connectMongodb.db('booknook-server')
const books = allBooks.collection('all-books')



app.get('/', (req, res) => {
  res.send('Hello World!')
})

// get all books
app.get('/books', async (req, res) => {
  const cursor = books.find({});
  const allUsers = await cursor.toArray();
  res.send(allUsers);
});

// create
app.post('/books', async(req, res) => {
    const newBooks = req.body
    console.log('adding new book', newBooks);

    const result = await books.insertOne(newBooks)
    res.send(result)
    
});

// new-arrivals
app.get('/new-arrivals', async (req, res) => {
  const latestbooks = await books.
  find({})
  .sort({_id: -1})
  .limit(6)
  .toArray();
  res.send(latestbooks);
});




app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})