const { MongoClient, ServerApiVersion } = require('mongodb');
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const port = 3000;


const app = express();
app.use(cors());


const uri = "mongodb+srv://User:JpjWmyjdHwnP29m6@cluster0.k2one53.mongodb.net/?appName=Cluster0";

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
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

//  Not required
app.get('/',(req,res)=>{
  res.send('Hello, Developers')
})
// 

app.listen(port, ()=>{
  console.log(`server is running on ${port}`);
  
})
