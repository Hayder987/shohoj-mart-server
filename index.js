require("dotenv").config();
const express = require("express");
const { MongoClient, ServerApiVersion } = require("mongodb");
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

    // post product data -----------
    app.post("/addProduct", async (req, res) => {
      const data = req.body;
      const result = await productCollection.insertOne(data);
      res.send(result);
    });

    // get all product for admin
    app.get("/allProducts", async (req, res) => {
        try {
            const category = req.query.category;
            let query = {}; 
               
            if (category) {
                query = { category: category }; 
            }
            const result = await productCollection.find(query).toArray();
            res.send(result);
        } catch (error) {
            console.error("Error fetching products:", error);
            res.status(500).send({ message: "Server Error", error });
        }
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
