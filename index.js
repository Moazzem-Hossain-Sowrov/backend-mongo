import dotenv from 'dotenv';
dotenv.config();
// mongodb connection 
import {
  MongoClient,
  ServerApiVersion,
  ObjectId
} from 'mongodb';
import cors from 'cors';
import express from 'express';
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

const uri = process.env.MONGO_URI;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    await client.connect();

    const database = client.db('petService');
    const petServices = database.collection('services');
    const orderCollections = database.collection('orders');


    // Services saved to database 

    app.post('/services', async (req, res) => {
      const data = req.body;
      const date = new Date();
      data.createdAt = date;

      console.log("Received:", data);
      const result = await petServices.insertOne(data);
      res.send(result)

    });

    //  Services got from database
    app.get('/services', async (req, res) => {
      const {
        category
      } = req.query;
      const query = {}
      if (category) {
        query.category = category
      }
      const result = await petServices.find(query).toArray();
      res.send(result)
    })

    app.get('/services/:id', async (req, res) => {
      const id = req.params

      const query = {
        _id: new ObjectId(id)
      }
      const result = await petServices.findOne(query)
      res.send(result)

    })

    app.get('/my-services', async (req, res) => {
      const {
        email
      } = req.query
      const query = {
        email: email,
      }
      const result = await petServices.find(query).toArray()
      res.send(result)
    })


    // Edit button
    app.put('/update/:id', async (req, res) => {
      const data = req.body;
      const id = req.params;
      const query = {
        _id: new ObjectId(id)
      }

      const updateServices = {
        $set: data
      }

      const result = await petServices.updateOne(query, updateServices)
      res.send(result)

    })


    // delete button
    app.delete("/delete/:id", async (req, res) => {
      const id = req.params;
      const query = {
        _id: new ObjectId(id)
      }
      const result = await petServices.deleteOne(query)
      res.send(result)
    })


    app.post('/orders', async(req, res)=>{
      const data = req.body
      console.log(data);
      const result = await orderCollections.insertOne(data)
      res.status(201).send(result)
      
    })

    app.get ('/order', async(req,res) =>{
      const result = await orderCollections.find().toArray()
      res.status(200).send(result)
    })




    // mongodb
    await client.db("admin").command({
      ping: 1
    });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

//  Not required
app.get('/', (req, res) => {
  res.send('Hello, Developers')
})
// 

app.listen(port, () => {
  console.log(`server is running on ${port}`);

})