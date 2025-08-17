import app from "./app.js";

//env variable
const PORT = process.env.PORT || 9000;

app.listen(PORT, async () => {
  console.log(`server is listening at ${PORT} port`);
});
