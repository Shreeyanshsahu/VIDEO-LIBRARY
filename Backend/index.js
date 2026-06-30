// require('dotenv').config({path:'./env'})
import dotenv from "dotenv"
import logger from "./logger.js";
import morgan from "morgan";
import { app }from "./app.js";
import connectDB from './db/index.js';

const morganFormat = ":method :url :status :response-time ms";

dotenv.config({
  path:'./.env'
})

app.use(
  morgan(morganFormat, {
    stream: {
      write: (message) => {
        const logObject = {
          method: message.split(" ")[0],
          url: message.split(" ")[1],
          status: message.split(" ")[2],
          responseTime: message.split(" ")[3],
        };
        logger.info(JSON.stringify(logObject));
      },
    },
  })
);

connectDB()
.then(() => {
    app.listen(process.env.PORT || 8000, () => {
        console.log(`Server is running on http://localhost:${process.env.PORT}`);
    });
})
.catch((err) => {
    console.log("MongoDB connection failed:", err);
});


app.get("/newroute",(req, res) => {
  res.send('This is the new route tadada')
}
)
app.listen(process.env.PORT, () => {
  console.log('Server is running on http://localhost:8000')
})
