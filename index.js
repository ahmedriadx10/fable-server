const express = require("express");
const cors = require("cors");

const app = express();

require("dotenv").config();
const {
  SignJWT,
  jwtVerify,
  generateKeyPair,
  createRemoteJWKSet,
} = require("jose-cjs");
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

const JWKS = createRemoteJWKSet(
  new URL(`${process.env.CLIENT_URL}/api/auth/jwks`),
);

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    // database and database collection

    const database = client.db("fable-ebook-sharing");
    const users = database.collection("user");
    const books = database.collection("books");
    const purchases = database.collection("purchases");
    const bookmarks = database.collection("bookmarks");
    app.get("/users", async (req, res) => {
      const result = await users.find().toArray();
      res.json(result);
    });

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
    app.get("/writer/books/:writerId", async (req, res) => {
      const { writerId } = req.params;

      const cursor = books.find({ authorId: writerId });

      const result = await cursor.toArray();

      res.json(result);
    });

    // writer book  update api

    app.patch("/books/:bookId", async (req, res) => {
      const { bookId } = req.params;

      const updateData = req.body;

      // console.log("updateData from client", updateData);
      const query = { _id: new ObjectId(bookId) };

      const result = await books.updateOne(query, {
        $set: {
          ...updateData,
        },
      });

      console.log("Update result:", result);

      res.json(result);
    });

    //writer ebook delete api
    app.delete("/books/:bookId", async (req, res) => {
      const { bookId } = req.params;

      const query = { _id: new ObjectId(bookId) };

      const result = await books.deleteOne(query);

      res.json(result);
    });

    // public book data get api

    app.get("/books", async (req, res) => {
      const query = { status: "published" };
      const sortQuery = {};
      const searchParams = req.query;

      if (searchParams?.search) {
        query.$or = [
          {
            title: { $regex: searchParams.search, $options: "i" },
          },
          {
            authorName: { $regex: searchParams.search, $options: "i" },
          },
        ];
      }

      if (searchParams?.minPrice) {
        query.price = {};
        query.price.$gte = parseFloat(searchParams?.minPrice);
      }

      if (searchParams?.maxPrice) {
        if (!query.price) {
          query.price = {};
        }

        query.price.$lte = parseFloat(searchParams?.maxPrice);
      }

      if (searchParams?.genre) {
        query.genre = { $regex: searchParams.genre, $options: "i" };
      }

      if (searchParams?.sortBy) {
        if (searchParams.sortBy === "Nf") {
          sortQuery.createdAt = -1;
        }

        if (searchParams.sortBy === "Lth") {
          sortQuery.price = 1;
        }
        if (searchParams.sortBy === "Htl") {
          sortQuery.price = -1;
        }
      }

      // const cursor = books.find(query).sort(sortQuery);
      // const result = await cursor.toArray();
      // res.json(result);


      const page=Math.max(parseInt(searchParams?.page) ||1,1) // preventing negative page number from client side
      const perPage=8
      const skip=(page-1)*perPage


const [totalBooksCount,booksData]=await Promise.all([


  books.countDocuments(query),
  books.find(query).sort(sortQuery).skip(skip).limit(perPage).toArray()

])



const result={
  totalBooks:totalBooksCount,
  books:booksData,
}


res.json(result)


    });



    // featured ebooks 

    // only 6 ebook have to send as a response and those 6 ebook will be selected depending on the lateast published
app.get('/home',async(req,res)=>{


const [featuredBooks,topWriters,availableGenres]=await Promise.all([

  books.find({status:'published'}).sort({createdAt:-1}).limit(6).toArray(),
   purchases.aggregate([
  {
    $group: {
      _id: "$authorId",
      authorName: { $first: "$authorName" }, 
      // Assuming authorName is consistent for each authorId so i applied $first operator to get the first occurrence of authorName for each authorId
      totalSales: { $sum: 1 },
      totalRevenue: { $sum: "$price" }
    }
  },

  {
    $sort: {
      totalSales: -1
    }
  },

  {
    $limit: 3
  },

  {
    $addFields: {
      authorObjectId: {
        $toObjectId: "$_id"
      }
    }
  },

  {
    $lookup: {
      from: "user",
      localField: "authorObjectId",
      foreignField: "_id",
      as: "writer"
    }
  },

  {
    $unwind: "$writer"
  },

  {
    $lookup: {
      from: "books",
      localField: "_id",
      foreignField: "authorId",
      as: "books"
    }
  },

  {
    $project: {
      _id: 0,
      writerName: "$authorName",
      writerImage:'$writer.image',
      totalBooks: { $size: "$books" },
      totalSales: 1,
      totalRevenue: 1
    }
  }
]).toArray(),
books.aggregate([
{
  $group:{
    _id:'$genre'
  }
},
{$project:{
  _id:0,
  genre:'$_id'
}},
{$limit:5}

]).toArray()

])


const result={
  featuredBooks,
  topWriters,
  availableGenres
}


res.json(result)

})


    // books genres get api

    app.get('/books/genres',async(req,res)=>{


const cursor=books.aggregate([
{$group:{
  _id:'$genre'
}},
{
  $project:{
    _id:0,
    genre:'$_id'
  }
}
])


const result=await cursor.toArray()

res.json(result)


    })

    const checkUserMiddleWare = async (req, res, next) => {
      const authorization = req?.headers?.authorization;

      if (!authorization || !authorization.startsWith("Bearer ")) {
        req.user = null;
        return next();
      }

      const token = authorization.split(" ")[1];

      try {
        const { payload } = await jwtVerify(token, JWKS);

        req.user = payload;

        return next();
      } catch (error) {
        req.user = null;
        return next();
      }
    };

    // book details get api

    app.get("/books/:bookId", checkUserMiddleWare, async (req, res) => {
      const { bookId } = req.params;

      const query = { _id: new ObjectId(bookId) };

      const result = await books.findOne(query);

      if (!result) {
        return res
          .status(404)
          .json({ success: false, message: "Ebook not found" });
      }
      const user = req?.user;


      const { content, ...mainEbookData } = result;

      let purchased = false;
      let bookmarked = false;
      let hasAccess = false;
      let isWriter = false;

      if (user) {
        if (user?.id === result?.authorId) {
          isWriter = true;
          hasAccess = true;
        } else {
          const isAvailablePurchase = await purchases.findOne({
            userId: user?.id,
            bookId: bookId,
          });

          if (isAvailablePurchase) {
            purchased = true;
            hasAccess = true;
          }

          const isAvailableBookmark = await bookmarks.findOne({
            userId: user?.id,
            bookId: bookId,
          });

          if (isAvailableBookmark) {
            bookmarked = true;
          }
        }
      }

      const finalResponseData = {
        ...mainEbookData,
        ...(hasAccess && { content }),
        purchased,
        bookmarked,
        hasAccess,
        isWriter,
      };

      res.json({ success: true, data: finalResponseData });
    });

    // book bookmark post api

    app.post("/book/bookmarks", async (req, res) => {
      const bookmarkData = req.body;

      const result = await bookmarks.insertOne(bookmarkData);

      res.json(result);
    });

    //user bookmark get api
    app.get("/bookmarks/:id", async (req, res) => {
      const { id } = req.params;

      const query = { userId: id };

      const result = await bookmarks.find(query).toArray();

      // console.log('user bookmarks data:',result)
      res.json(result);
    });

    //user bookmark delete api

    app.delete("/bookmarks/:bookId", async (req, res) => {
      const { bookId } = req.params;

      const query = { _id: new ObjectId(bookId) };
      const result = await bookmarks.deleteOne(query);

      res.json(result);
    });


//user payment data add api 

app.post('/book/purchases',async(req,res)=>{


  const purchaseData=req.body
  // console.log('this is payment data',purchaseData)

  const isAvailablePaymentData=await purchases.findOne({userId:purchaseData?.userId,bookId:purchaseData?.bookId})

// console.log('is available data',isAvailablePaymentData)
  if(isAvailablePaymentData){
    // console.log('gone from available')
    return res.json({success:true,message:'Purchase history already added'})
  }



  const result=await purchases.insertOne({...purchaseData,createdAt:new Date()})
  // console.log('here is insurt result',result)

  res.json(result)


})



//user purchase data get api 

app.get('/purchase/:userId',async(req,res)=>{


  const {userId}=req.params

  const query={userId:userId}
// console.log('this is query',query)
  const cursor=purchases.find(query).sort({createdAt:-1})
  const result=await cursor.toArray()
// console.log('result is here',result)
  res.json(result)




})

//user dashboard stats data get api 
app.get('/dashboard-stats/:userId',async(req,res)=>{

const {userId}=req.params

const [totalBookmarks,totalPurchased,totalAmountPurchased]=await Promise.all([
bookmarks.countDocuments({userId:userId}),
purchases.countDocuments({userId:userId}),
purchases.aggregate([
  {$match:{userId:userId}},
  {$group:{
    _id:null,
    totalAmount:{$sum:'$price'}
  }}
]).toArray()

])


const totalAmount=totalAmountPurchased[0]?.totalAmount || 0
const result={
  totalBookmarks,
  totalPurchased,
  totalAmount
}

res.json(result)

})


//writer dashboard stats data get api

app.get('/dashboard-writer-stats/:writerId',async(req,res)=>{

const {writerId}=req.params


const [totalPublished,totalBookmarked,totalSaleAmmout]=await Promise.all([

  books.countDocuments({authorId:writerId}),
  bookmarks.countDocuments({userId:writerId}),
  purchases.aggregate([
    {$match:{authorId:writerId}},{
      $group:{_id:null,totalSale:{$sum:'$price'}}
    }
  ]).toArray()

])



const totalAmount=totalSaleAmmout[0]?.totalSale || 0

const result={
  totalPublished,totalBookmarked,
  totalAmount
}


res.json(result)
})


//writer sales history get api 
app.get('/sales-history/:writerId',async(req,res)=>{

  const {writerId}=req.params

  const query={authorId:writerId}

  const cursor=purchases.find(query).sort({createdAt:-1})
  const result=await cursor.toArray()

  res.json(result)


})


// admin all ebooks data get api

app.get('/ebooks',async(req,res)=>{

// in future have to add pagination

  const cursor=books.find()
  const result=await cursor.toArray()

  res.json(result)


})


//admin ebook delete api 

app.delete('/ebooks/:bookId',async(req,res)=>{

const {bookId}=req.params
  const query={_id:new ObjectId(bookId)}

  const result=await books.deleteOne(query)

  res.json(result)


})

//admin ebook status update api

app.patch('/ebooks/:bookId',async(req,res)=>{


  const {bookId}=req.params
const query={_id:new ObjectId(bookId)}

const updatedData=req.body
  const result=await books.updateOne(query,{
    $set:{
      ...updatedData
    }
  })

res.json(result)

})


//admin all transcation/purchase data get api

app.get('/purchases/all-transaction',async(req,res)=>{

const cursor=purchases.find().sort({createdAt:-1})
  const result=await cursor.toArray()

res.json(result)

})


//admin dashboard all analytics data get api 

app.get('/analytics/dashboard-admin', async (req, res) => {
  try {
    // ==========================================
    // ১. ডেট রেঞ্জ সেটআপ (গত ৬ মাসের জন্য)
    // ==========================================
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    // ==========================================
    // ২. PROMISE.ALL-এর ভেতর সব কুয়েরি একসাথে রান করা
    // ==========================================
    const [
      totalUsers,
      totalWriters,
      totalEbookSold,
      totalRevenue,
      salesAggregation, // গত ৬ মাসের সেলস ডাটা
      genreAggregation  // জেনরা ভিত্তিক পার্সেন্টেজ ডাটা
    ] = await Promise.all([
      users.countDocuments(),
      users.countDocuments({ role: 'writer' }),
      purchases.countDocuments({ costType: 'payment' }),
      purchases.aggregate([
        {
          $group: {
            _id: null,
            totalSale: { $sum: '$price' }
          }
        }
      ]).toArray(),
      
      // ক) Monthly Sales Aggregation (From purchases collection)
      purchases.aggregate([
        {
          $match: {
            createdAt: { $gte: sixMonthsAgo },
            costType: 'payment' // শুধু পেইড পারচেজ কাউন্ট করতে চাইলে
          }
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" }
            },
            totalSales: { $sum: "$price" } // আপনার স্কিমা অনুযায়ী এখানে price যোগ হচ্ছে
          }
        },
        {
          $sort: { "_id.year": 1, "_id.month": 1 }
        }
      ]).toArray(),

      // খ) Ebook Genres Aggregation (From books collection)
      books.aggregate([
        {
          $group: {
            _id: "$genre",
            count: { $sum: 1 }
          }
        },
        {
          $group: {
            _id: null,
            totalBooks: { $sum: "$count" },
            genres: { $push: { genre: "$_id", count: "$count" } }
          }
        },
        {
          $unwind: "$genres"
        },
        {
          $project: {
            _id: 0,
            genre: "$genres.genre",
            value: "$genres.count",
            percentage: {
              $round: [
                { $multiply: [ { $divide: ["$genres.count", "$totalBooks"] }, 100 ] },
                0
              ]
            }
          }
        },
        {
          $sort: { percentage: -1 }
        }
      ]).toArray()
    ]);

    // ==========================================
    // ৩. শূন্য (0) সেলস থাকা মাসগুলোর ফরম্যাটিং লজিক
    // ==========================================
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlySales = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      
      const currentYear = d.getFullYear();
      const currentMonthNum = d.getMonth() + 1;
      const currentMonthName = monthNames[d.getMonth()];

      // ডাটাবেজের বছর এবং মাসের সাথে লুপের বছর ও মাস মিলানো
      const foundMonth = salesAggregation.find(
        item => item._id.year === currentYear && item._id.month === currentMonthNum
      );

      monthlySales.push({
        month: currentMonthName,
        sales: foundMonth ? parseFloat(foundMonth.totalSales.toFixed()) : 0 // ডেটা না থাকলে ০ সেট হবে
      });
    }

    // সর্বমোট রেভিনিউ ভ্যালু অ্যাসাইন করা
    const totalSaleAmount = totalRevenue[0]?.totalSale || 0;

    // ==========================================
    // ৪. ফাইনাল রেসপন্স অবজেক্ট
    // ==========================================
    res.json({
      success: true,
      totalUsers,
      totalWriters,
      totalEbookSold,
      totalSaleAmount,
      monthlySales,   // লাইন চার্টের জন্য গত ৬ মাসের রেডি ডেটা
      popularGenres: genreAggregation // ডোনাট চার্টের জন্য জেনরা পার্সেন্টেজ ডেটা
    });

  } catch (error) {
    console.error("Dashboard Analytics Error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});


//user role update api 

app.patch('/users/:userId',async(req,res)=>{

try {
    const { userId } = req.params;
    const { role } = req.body; // সম্পূর্ণ বডি না নিয়ে শুধু role নিন

    // সিকিউরিটি গার্ড: কেউ যদি 'admin' বা অন্য কিছু পাঠায়, এখানেই ব্লক
    if (role === 'admin' || !['user', 'writer'].includes(role)) {
      return res.status(403).json({ message: "Invalid or unauthorized role selection" });
    }

    const query = { _id: new ObjectId(userId) };
    const result = await users.updateOne(query, {
      $set: { role: role } // শুধু অনুমোদিত রোলটিই আপডেট হবে
    });

    if (!result?.acknowledged) {
      return res.status(400).json({ message: "Failed to update role" });
    }

    res.send({ success: true, result });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }

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
