import express, { urlencoded } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express();

app,use(cors({
    origin: "process.env.CORS_ORIGIN",
    credentials: true,
}))
//a request comes with JSON data, convert it into a JavaScript object and store it in req.body
app.use(express.json({
    limit:"10kb"
}));


app.use(urlencoded({
    extended: true,
    limit:"10kb"
}))
//Serve static files (like images, CSS, JS) from the public folder”
app.use(express.static("public"))

app.use(cookieParser());
export  {app};