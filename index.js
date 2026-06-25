const express = require("express");
const cors = require("cors");
const app = express();

require("dotenv").config();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.get("/", (req, res) => {
  res.send("Hello World!");
});

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = process.env.MONGODB_URI;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    // database and database collection

    const database = client.db("fable-ebook-sharing");
    const users = database.collection("user");
    const books = database.collection("books");


    // app.get('/users',async(req,res)=>{

    //   const result =await users.find().toArray()
    //   res.json(result)

    // })

// writer related api
//writer book post api
    app.post("/books", async (req, res) => {
      const bookData = req.body;

      const result = await books.insertOne({
        ...bookData,
        createdAt: new Date(),
      });

      res.json(result);
    });


    //writer all books get api
app.get('/writer/books/:writerId',async (req,res)=>{


  const {writerId}=req.params


  const cursor=books.find({ authorId:writerId})

  const result =await cursor.toArray()

  res.json(result)


})



app.patch('/books/:bookId',async(req,res)=>{

  const {bookId}=req.params

  const updateData=req.body
const query={_id:new ObjectId(bookId)}






const result=await books.updateOne(query,{
  $set:{
    ...updateData
  }
})

console.log('update result:', result)

res.json(result)

})

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!",
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
