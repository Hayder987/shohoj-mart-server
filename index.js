require("dotenv").config();
const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 5000;
const cors = require("cors");
const app = express();

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

    // get user Data by email---------
    app.get('/user/:email', async(req, res)=>{
      const email = req.params.email;
      const query = {email:email}
      const result = await userCollection.findOne(query)
      res.send(result);
    })

    // post product data -----------
    app.post("/addProduct", async (req, res) => {
      const data = req.body;
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
          price: product.price,
          feature: product.feature,
          stock: product.stock,
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
    app.post("/review", async(req, res)=>{
      const review = req.body;
      const result = await reviewCollection.insertOne(review);
      res.send(result);
    })

    // get review data
    app.get('/reviews/:id', async(req, res)=>{
      const id = req.params.id;
      const query = {productId:id};
      const result = await reviewCollection.find(query).sort({date: -1}).limit(10).toArray();
      res.send(result);
    })

    // cart Api------------------------------------------------------------------------->

    // post cart data
    app.post('/cart', async(req, res)=>{
      const cart = req.body;
      const isExist = await cartCollection.findOne({porductId:cart.porductId, userEmail:cart.userEmail})
      if(isExist){
        return res.status(400).send({ message: 'Already Added' });
      }
      const result = await cartCollection.insertOne(cart);
      res.send(result);
    })
    

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
