process.setMaxListeners(0)
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
var cors = require('cors')
const https = require('https')
const fs = require("fs");
const cluster = require('cluster')
const number_cpu = require('os').cpus().length

if (cluster.isMaster) {
  console.log('master ', process.pid)
  for (var i = 0; i < number_cpu; i++) {
    var worker = cluster.fork();
  }
}
else {
  const dev = process.env.NODE_ENV !== 'production';
  const next = require('next');
  const app = next({ dev });
  const handle = app.getRequestHandler();

  const apiRoutes = require('./routes.js');
  var http = require('http');
  http.globalAgent.maxSockets = 100;

  app.prepare().then(() => {
    const server = express();
    //server.use(cors())
    //server.options('*', cors());


    server.use(bodyParser.json());
    server.use(session({
      secret: 'super-secret-key',
      resave: false,
      saveUninitialized: false,
      cookie: { maxAge: 60000 }
    }));

    server.use('/api', apiRoutes);

    // Server-side
    //const route = pathMatch();

    server.get('/login', (req, res) => {
      console.log("goto login page")
      return app.render(req, res, '/login', req.query);
    });



    server.get('*', (req, res) => {
      return handle(req, res);
    });


    server.listen(3000, "192.168.1.206", (err) => {
      if (err) throw err;
      console.log('Server ready on http://192.168.1.206:3000');
    });
  })

}

