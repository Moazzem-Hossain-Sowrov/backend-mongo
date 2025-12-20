import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


dotenv.config({ path: join(__dirname, '.env') });

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

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.k2one53.mongodb.net/?appName=Cluster0`;


const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

let isConnected = false;
let database, petServices, orderCollections;
let connectionPromise = null;

async function connectDB() {

  if (isConnected && client.topology && client.topology.isConnected()) {
    return { database, petServices, orderCollections };
  }
  
  
  if (connectionPromise) {
    return connectionPromise;
  }
  
  
  connectionPromise = (async () => {
    try {
      // await client.connect();
      // await client.db("admin").command({ ping: 1 });
      console.log("Successfully connected to MongoDB!");
      
      isConnected = true;
      database = client.db('petService');
      petServices = database.collection('services');
      orderCollections = database.collection('orders');
      
      connectionPromise = null;
      return { database, petServices, orderCollections };
    } catch (error) {
      console.error("MongoDB connection error:", error);
      isConnected = false;
      connectionPromise = null;
      throw error;
    }
  })();
  
  return connectionPromise;
}


connectDB().catch(console.dir);


async function getCollections() {
  try {
    if (!uri) {
      throw new Error("MONGO_URI is not configured");
    }
    return await connectDB();
  } catch (error) {
    console.error("Failed to get collections:", error);
    throw error;
  }
}


app.post('/services', async (req, res) => {
  try {
    const { petServices } = await getCollections();
    const data = req.body;
    const date = new Date();
    data.createdAt = date;
    const result = await petServices.insertOne(data);
    res.status(201).send(result)
  } catch (error) {
    console.error('Error creating service:', error);
    res.status(500).send({ error: 'Failed to create service' });
  }

});


app.get('/services', async (req, res) => {
  try {
    const { petServices } = await getCollections();
    const {
      category
    } = req.query;
    const query = {}
    if (category) {
      query.category = category
    }
    const result = await petServices.find(query).toArray();
    console.log(`Fetched ${result.length} services from MongoDB`);
    res.send(result)
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).send({ error: 'Failed to fetch services', details: error.message });
  }
})

app.get('/services/:id', async (req, res) => {
  try {
    const { petServices } = await getCollections();
    const id = req.params.id;

    const query = {
      _id: new ObjectId(id)
    }
    const result = await petServices.findOne(query)
    if (!result) {
      return res.status(404).send({ error: 'Service not found' });
    }
    res.send(result)
  } catch (error) {
    console.error('Error fetching service:', error);
    res.status(400).send({ error: 'Invalid ID format' });
  }
})

app.get('/my-services', async (req, res) => {
  try {
    const { petServices } = await getCollections();
    const {
      email
    } = req.query
    if (!email) {
      return res.status(400).send({ error: 'Email parameter is required' });
    }
    const query = {
      email: email,
    }
    const result = await petServices.find(query).toArray()
    res.send(result)
  } catch (error) {
    console.error('Error fetching my services:', error);
    res.status(500).send({ error: 'Failed to fetch services' });
  }
})

// Edit button
app.put('/update/:id', async (req, res) => {
  try {
    const { petServices } = await getCollections();
    const data = req.body;
    const id = req.params.id;
    const query = {
      _id: new ObjectId(id)
    }

    const updateServices = {
      $set: data
    }

    const result = await petServices.updateOne(query, updateServices)
    res.send(result)
  } catch (error) {
    console.error('Error updating service:', error);
    res.status(400).send({ error: 'Invalid ID format or update failed' });
  }

})

// delete button
app.delete("/delete/:id", async (req, res) => {
  try {
    const { petServices } = await getCollections();
    const id = req.params.id;
    const query = {
      _id: new ObjectId(id)
    }
    const result = await petServices.deleteOne(query)
    res.send(result)
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(400).send({ error: 'Invalid ID format or delete failed' });
  }
})


app.post('/orders', async(req, res)=>{
  try {
    const { orderCollections } = await getCollections();
    const data = req.body
    console.log(data);
    const result = await orderCollections.insertOne(data)
    res.status(201).send(result)
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).send({ error: 'Failed to create order' });
  }
  
})

app.get ('/orders', async(req,res) =>{
  try {
    const { orderCollections } = await getCollections();
    const result = await orderCollections.find().toArray()
    res.status(200).send(result)
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).send({ error: 'Failed to fetch orders' });
  }
})


app.get('/', (req, res) => {
  res.send({
    message: 'Hello, Developers',
    mongoUri: uri ? 'Configured' : 'NOT CONFIGURED',
    connected: isConnected
  })
})
// 


if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`server is running on ${port}`);
  })
}


export default app;

