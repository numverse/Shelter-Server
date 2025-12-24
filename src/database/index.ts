import mongoose from "mongoose";
import { MONGODB_URI } from "../config";

const options = {
  autoIndex: true,
  minPoolSize: 5,
  maxPoolSize: 20,
  connectTimeoutMS: 60000,
  socketTimeoutMS: 45000,
};

function setRunValidators(this: mongoose.Query<unknown, mongoose.Document>) {
  this.setOptions({ runValidators: true });
}

mongoose.set("strictQuery", true);

// Create the database connection
mongoose
  .plugin((schema: mongoose.Schema<unknown>) => {
    schema.pre("findOneAndUpdate", setRunValidators);
    schema.pre("updateMany", setRunValidators);
    schema.pre("updateOne", setRunValidators);
    // schema.pre("update", setRunValidators);
  })
  .connect(MONGODB_URI, options)
  .then(() => {
    console.log("Mongoose connection done");
  })
  .catch((e) => {
    console.log("Mongoose connection error");
    console.error(e);
  });

// CONNECTION EVENTS
// When successfully connected
mongoose.connection.on("connected", () => {
  console.debug("Mongoose default connection open to " + MONGODB_URI);
});

// If the connection throws an error
mongoose.connection.on("error", (err) => {
  console.error("Mongoose default connection error: " + err);
});

// When the connection is disconnected
mongoose.connection.on("disconnected", () => {
  console.log("Mongoose default connection disconnected");
});

// If the Node process ends, close the Mongoose connection
process.on("SIGINT", () => {
  mongoose.connection.close().finally(() => {
    console.log("Mongoose default connection disconnected through app termination");
    process.exit(0);
  });
});

export const connection = mongoose.connection;
