require("dotenv").config();
const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 5000;
const cors = require("cors");
const app = express();
const Stripe = require("stripe");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.khimxsm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const userCollection = client.db("shohojmart").collection("users");
    const productCollection = client.db("shohojmart").collection("products");
    const reviewCollection = client.db("shohojmart").collection("reviews");
    const cartCollection = client.db("shohojmart").collection("cart");
    const wishListCollection = client.db("shohojmart").collection("wishList");
    const paymentCollection = client.db("shohojmart").collection("payment");

    // stripe setup--------------------------------------->
    app.post("/create-payment-intent", async (req, res) => {
      const { price } = req.body;
      const amount = parseFloat(price * 100) || 51;

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ["card"],
        // confirm: true,
      });
      res.send({ clientSecret: paymentIntent.client_secret });
    });

    //  post Payment data on server and reduce stock
    app.post('/payment', async (req, res) => {
      const body = req.body;
      const itemsList = body.itemsList;
  
      for (const item of itemsList) {
        const productId = item;
        const objectId = new ObjectId(productId);
  
        await productCollection.updateOne(
          { _id: objectId },
          { $inc: { stock: -1 } }
        );
      }
      const result = await paymentCollection.insertOne(body);
      res.send(result);
    });

    // get all order data
    app.get('/allOrder', async(req, res)=>{
      const result = await paymentCollection.find().sort({_id: -1}).toArray();
      res.send(result);
    })

    // post user data---------------
    app.post("/users", async (req, res) => {
      const user = req.body;
      const isExist = await userCollection.findOne({ email: user.email });
      if (isExist) {
        return res.send({ status: false });
      }
      const result = await userCollection.insertOne({
        ...user,
        role: "user",
        status: "",
      });
      res.send({ status: true, result });
    });

    // get All User
    app.get("/allUser", async (req, res) => {
      const role = req.query.role;
      let query = {};
      if (role) {
        query = { role: role };
      }
      const result = await userCollection.find(query).toArray();
      res.send(result);
    });

    // update user Data role
    app.patch("/updateUser/:id", async (req, res) => {
      const id = req.params.id;
      const body = req.body;
      const query = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: body.role,
        },
      };

      const result = await userCollection.updateOne(query, updateDoc);
      res.send(result);
    });

    // delete user Data
    app.delete("/deleteUser/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await userCollection.deleteOne(query);
      res.send(result);
    });

    // get user Data by email---------
    app.get("/user/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await userCollection.findOne(query);
      res.send(result);
    });

    // post product data -----------
    app.post("/addProduct", async (req, res) => {
      const data = req.body;
      data.price = parseInt(data.price);
      data.stock = parseInt(data.stock);
      const result = await productCollection.insertOne(data);
      res.send(result);
    });

    // update product data by id
    app.patch("/product/:id", async (req, res) => {
      const id = req.params.id;
      const product = req.body;
      const query = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          title: product.title,
          brandName: product.brandName,
          modelName: product.modelName,
          description: product.description,
          category: product.category,
          price: parseInt(product.price),
          feature: product.feature,
          stock: parseInt(product.stock),
          productCode: product.productCode,
          image: product.image,
          updateOn: product.updateOn,
        },
      };
      const result = await productCollection.updateOne(query, updateDoc);
      res.send(result);
    });

    // get all product by category, all, limit & sort --------------
    app.get("/allProducts", async (req, res) => {
      try {
        const category = req.query.category;
        const limit = parseInt(req.query.limit);
        const sort = req.query.sort;

        let query = {};
        let limitNumber = 0;
        let sortQuery = {};

        if (category) {
          query = { category: category };
        }

        if (limit) {
          limitNumber = limit;
        }

        if (sort === "recent") {
          sortQuery = { postDate: -1 };
        }

        const result = await productCollection
          .find(query)
          .sort(sortQuery)
          .limit(limitNumber)
          .toArray();

        res.send(result);
      } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).send({ message: "Server Error", error });
      }
    });

    // get all product for all collection with pagination
    app.get("/allCollection", async (req, res) => {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 12;
      const category = req.query.category;
      const search = req.query.search;
      const sort = parseInt(req.query.sort);

      let query = {};

      if (category) {
        query.category = category;
      }

      if (search) {
        query.title = { $regex: search, $options: "i" };
      }

      const skip = (page - 1) * limit;

      // Build sort object
      let sortQuery = { _id: -1 };
      if (sort === 1 || sort === -1) {
        sortQuery = { price: sort };
      }

      const items = await productCollection
        .find(query)
        .skip(skip)
        .limit(limit)
        .sort(sortQuery)
        .toArray();

      const totalItems = await productCollection.countDocuments(query);

      res.send({
        items,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
      });
    });

    // get single product data by Id
    app.get("/product/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await productCollection.findOne(query);
      res.send(result);
    });

    // delete product data----------------
    app.delete("/deleteProduct/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await productCollection.deleteOne(query);
      res.send(result);
    });

    // review Api ------------------------------------------------------------->

    // post review data
    app.post("/review", async (req, res) => {
      const review = req.body;
      const result = await reviewCollection.insertOne(review);
      res.send(result);
    });

    // get review data
    app.get("/reviews/:id", async (req, res) => {
      const id = req.params.id;
      const query = { productId: id };
      const result = await reviewCollection
        .find(query)
        .sort({ date: -1 })
        .limit(10)
        .toArray();
      res.send(result);
    });

    // cart Api------------------------------------------------------------------------->

    // post cart data single
    app.post("/cart", async (req, res) => {
      const cart = req.body;
      const isExist = await cartCollection.findOne({
        porductId: cart.porductId,
        userEmail: cart.userEmail,
      });
      if (isExist) {
        return res.status(400).send({ message: "Already Added" });
      }
      const result = await cartCollection.insertOne(cart);
      res.send(result);
    });

    // post cart data many
    app.post("/carts", async (req, res) => {
      const data = req.body;
      const options = { ordered: true };
      const result = await cartCollection.insertMany(data, options);
      res.send(result);
    });

    // get cart Data
    app.get("/cart/:email", async (req, res) => {
      const email = req.params.email;
      const query = { userEmail: email };
      const result = await cartCollection.find(query).toArray();
      res.send(result);
    });

    // delete cart data by id--
    app.delete("/cart/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await cartCollection.deleteOne(query);
      res.send(result);
    });

    // delete all data by email
    app.delete("/userCart/:email", async (req, res) => {
      const email = req.params.email;
      const query = { userEmail: email };
      const result = await cartCollection.deleteMany(query);
      res.send(result);
    });

    // wish List API --------------------------------------------------------->

    // post wish list
    app.post("/wishlist", async (req, res) => {
      const wishList = req.body;
      const isExist = await wishListCollection.findOne({
        porductId: wishList.porductId,
        userEmail: wishList.userEmail,
      });
      if (isExist) {
        return res.status(400).send({ message: "Already Added" });
      }
      const result = await wishListCollection.insertOne(wishList);
      res.send(result);
    });

    // get wish data
    app.get("/wishlist/:email", async (req, res) => {
      const email = req.params.email;
      const query = { userEmail: email };
      const result = await wishListCollection.find(query).toArray();
      res.send(result);
    });

    // delete wish data
    app.delete("/wish/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await wishListCollection.deleteOne(query);
      res.send(result);
    });

    // delete all wish data by email
    app.delete("/userWish/:email", async (req, res) => {
      const email = req.params.email;
      const query = { userEmail: email };
      const result = await wishListCollection.deleteMany(query);
      res.send(result);
    });

    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("ShohojMart Server Running");
});

app.listen(port, () => {
  console.log(`server Running At port ${port}`);
});
