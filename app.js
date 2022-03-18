const express = require("express");

const { open } = require("sqlite");

const sqlite3 = require("sqlite3");

const path = require("path");

const dbPath = path.join(__dirname, "todoApplication.db");

const app = express();

app.use(express.json());

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(6000, () => {
      console.log("Server is Running at http://localhost:6000");
    });
  } catch (error) {
    console.log(`Db Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const priorityAndStatus = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const priorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const statusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

//get api

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodoQuery = "";
  const { search_q = "", priority = "", status = "" } = request.query;

  switch (true) {
    case priorityAndStatus(request.query):
      getTodoQuery = `
                SELECT
                * 
                FROM 
                todo
                WHERE 
                todo LIKE '%${search_q}%'
                AND status = '${status}'
                AND priority = '${priority}'`;
      break;
    case priorityProperty(request.query):
      getTodoQuery = `SELECT
                * 
                FROM 
                todo
                WHERE 
                todo LIKE '%${search_q}%'
                AND priority = '${priority}'`;
      break;
    case statusProperty(request.query):
      getTodoQuery = `
            SELECT
                * 
                FROM 
                todo
                WHERE 
                todo LIKE '%${search_q}%'
                AND status = '${status}'`;
      break;
    default:
      getTodoQuery = `SELECT
                * 
                FROM 
                todo
                WHERE 
                todo LIKE '%${search_q}%';`;
  }

  data = await db.all(getTodoQuery);
  response.send(data);
  //console.log(search_q);
});

//get api selected id

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
  SELECT * 
  FROM 
  todo
  WHERE id = ${todoId}`;
  const todo = await db.get(getTodoQuery);
  response.send(todo);
});

//post api details

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;
  const postQuery = `
  INSERT INTO 
  todo (id,todo,priority,status)
  VALUES (${id},'${todo}','${priority}','${status}');`;
  await db.run(postQuery);
  response.send("Todo Successfully Added");
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
  }
  const beforeTodoQuery = `
  SELECT *
  FROM 
  todo
  WHERE 
  id = ${todoId}`;
  const beforeTodo = await db.get(beforeTodoQuery);

  const {
    todo = beforeTodo.todo,
    priority = beforeTodo.priority,
    status = beforeTodo.status,
  } = request.body;
  const updateTodoQuery = `
  UPDATE todo 
  SET 
  todo ='${todo}',
  priority = '${priority}',
  status = '${status}'
  WHERE id =${todoId}`;
  await db.run(updateTodoQuery);
  response.send(`${updateColumn} Updated`);
});

///app DELETE api

app.delete("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
  DELETE 
  FROM 
  todo 
  WHERE 
  id = ${todoId}`;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
