require('dotenv').config();

const PORT = 3000;
const express = require('express');
const morgan = require('morgan')
const apiRouter = require('./api');
const cors = require("cors");

const { client, connectClient } = require('./db')

const server = express();

server.use(morgan('dev'));

server.use(cors());

server.use(express.json());

server.use((req, res, next) =>
{
    console.log("<____Body Logger START____>");
  console.log(req.body);
  console.log("<_____Body Logger END_____>");

  next();
});

server.use('/api', apiRouter);


connectClient();

server.listen(PORT, () => {
  console.log('The server is up on port', PORT)
});

