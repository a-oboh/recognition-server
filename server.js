const express = require("express");
const bodyparser = require("body-parser");
const bcrypt = require("bcrypt-nodejs");
const cors = require("cors");
const knex = require("knex");

const db = knex({
  client: "pg",
  connection: {
    host: "127.0.0.1",
    user: "postgres",
    password: "",
    database: "smartbrain2"
  }
});

const app = express();

app.use(bodyparser.json());
app.use(cors());

var database = {
  users: [
    {
      id: "123",
      name: "berry",
      email: "alb@yahoo.com",
      password: "cookies",
      entries: 0,
      joined: new Date()
    },
    {
      id: "1244",
      name: "sally",
      email: "sal@yahoo.com",
      password: "tooook",
      entries: 0,
      joined: new Date()
    }
  ]
};

app.get("/profle/:id", (req, res) => {
  const { id } = req.params;
  const found = false;

  db.select("*")
    .from("users")
    .where({ id: id })
    .then(user => {
      res.json(user[0]);
    });
  if (!found) {
    res.status(400).json("not found");
  }
});

app.get("/", (req, res) => {
  res.send(database.users);
});

app.post("/signin", (req, res) => {
  db.select("email", "hash")
    .from("login")
    .where("email", "=", req.body.email)
    .then(data => {
      const isValid = bcrypt.compareSync(req.body.password, data[0].hash);

      if (isValid) {
        return db
          .select("*")
          .from("users")
          .where("email", "=", req.body.email)
          .then(user => {
            res.json(user[0]);
          })
          .catch(err => res.json(400).json("unable to get"));
      }
    })
    .catch(err => res.status(400).json("Wrong credentials"));
});

app.post("/register", (req, res) => {
  let { email, name, password } = req.body;
  const hash = bcrypt.hashSync(password);
  db.transaction(trx => {
    trx
      .insert({
        hash: hash,
        email: email
      })
      .into("login")
      .returning("email")
      .then(loginemail => {
        return trx("users")
          .returning("*")
          .insert({
            email: loginemail[0],
            name: name,
            joined: new Date()
          })
          .then(user => {
            res.json(user[0]);
          });
      })
      .then(trx.commit)
      .catch(trx.rollback);
  }).catch(err => res.status(400).json("Error in creating user"));

  // database.users.push({
  //   id: "125",
  //   name: name,
  //   email: email,
  //   password: password,
  //   entries: 0,
  //   joined: new Date()
  // });
  // res.json(database.users[database.users.length - 1]);
});

app.put("/image", (req, res) => {
  let { id } = req.body;
  db("users")
    .where("id", "=", id)
    .increment("entries", 1)
    .returning("entries")
    .then(entries => {
      res.json(entries);
    });
});

app.listen(3000, () => {
  console.log("app running on port 3000");
});

app.get("/aaa", (req, res) => {
  res.json(database.users);
});

/* 

/ --> res = working
/signin --> POST = sucess/fail
/register --> POST
/profile/:userId --> GET = user
/image --> PUT --> user

*/
