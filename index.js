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

// Connect to MongoDB
let isConnected = false;
let database, petServices, orderCollections;

async function connectDB() {
  if (isConnected) {
    return { database, petServices, orderCollections };
  }
  
  try {
    await client.connect();
    isConnected = true;
    database = client.db('petService');
    petServices = database.collection('services');
    orderCollections = database.collection('orders');
    
    await client.db("admin").command({ping: 1});
    console.log("Successfully connected to MongoDB!");
    
    return { database, petServices, orderCollections };
  } catch (error) {
    console.error("MongoDB connection error:", error);
    isConnected = false;
    throw error;
  }
}

// Initialize connection
connectDB().catch(console.dir);

// Define routes
async function getCollections() {
  if (!isConnected) {
    await connectDB();
  }
  return { petServices, orderCollections };
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

//  Services got from database
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
    res.send(result)
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).send({ error: 'Failed to fetch services' });
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

//  Not required
app.get('/', (req, res) => {
  res.send('Hello, Developers')
})
// 

// Only start server if not in serverless environment (Vercel)
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`server is running on ${port}`);
  })
}

// Export app for Vercel
export default app;

