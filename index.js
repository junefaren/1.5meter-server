const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const port = process.env.PORT || 4001;
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
const authRouter = require("./auth/router");
const userRouter = require("./user/router");
const warningRouter = require("./warning/router");
const db = require("./db");
const User = require("./user/model");

app.use(cors());

const server = http.createServer(app);
const io = socketIO(server);
const allCoordinates = {};

app.use(bodyParser.json());
app.use(authRouter);
app.use(userRouter);
app.use(warningRouter);

io.on("connection", socket => {
  console.log("New client connected", socket.id);

  socket.on("add coordinates", coordinate => {
    const now = Date.now();
    console.log("this is now", now);
    console.log("new coordinates are: ", coordinate);
    console.log("socket id", socket.id);
    allCoordinates[socket.id] = coordinate;
    allCoordinates[socket.id].time = now;
    io.sockets.emit("all coordinates", allCoordinates);
  });

  socket.on("user login", async user => {
    console.log("login", user, socket.id);
    const userUpdate = await User.findByPk(user.userId);
    await userUpdate.update({ socketId: socket.id });
  });

  socket.on("user logout", async (user) => {
    delete allCoordinates[socket.id];
    const userUpdate = await User.findByPk(user.userId);
    await userUpdate.update({ socketId: null });
  });
  
  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

server.listen(port, () => console.log(`Listening on port ${port}`));
