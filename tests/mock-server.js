import fs from "fs";
import express from "express";
import cors from "cors";
import { formidable } from "formidable";

const app = express();
app.use(cors());

app.get("/ping", (req, res) => {
    res.send("pong");
});

app.get("/api/user", (req, res) => {
    const { id } = req.query;
    res.status(200).json({
        id: id || 1,
        name: "张三🎉",
        age: 25
    });
});

app.post("/api/upload", (req, res, next) => {
    formidable({}).parse(req, (err, fields, files) => {
        if (err) {
            return next(err);
        }
        const file = files?.file?.[0];
        res.status(201).json({
            code: 0,
            message: "success",
            data: {
                name: fields?.name?.[0] || null,
                age: fields?.age?.[0] || null,
                file: file ? {
                    filename: file.originalFilename,
                    size: file.size,
                    content: fs.readFileSync(file.filepath, "utf-8"),
                } : null,
            }
        });
    });
});

app.get("/api/timeout", async (req, res) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    res.status(200).json({ code: 0, message: "success" });
});

app.get("/api/not-found", (req, res) => {
    res.status(404).json({ code: 404, message: "Not Found" });
});

app.get("/api/header-test", (req, res) => {
    res.json({
        token: req.headers["x-token"],
        contentType: req.headers["content-type"]
    });
});

app.get("/api/stream", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Transfer-Encoding", "chunked");
    const chunks = [
        '{"chunk":1,"data":"hello"}',
        '{"chunk":2,"data":"world"}',
        '{"chunk":3,"data":"!"}',
    ];
    let i = 0;
    const interval = setInterval(() => {
        if (i < chunks.length) {
            res.write(chunks[i]);
            i++;
        } else {
            res.end();
            clearInterval(interval);
        }
    }, 10);
});

app.get("/api/stream-text", (req, res) => {
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Transfer-Encoding", "chunked");
    const chunks = ["Hello, ", "streaming ", "world!"];
    let i = 0;
    const interval = setInterval(() => {
        if (i < chunks.length) {
            res.write(chunks[i]);
            i++;
        } else {
            res.end();
            clearInterval(interval);
        }
    }, 10);
});

app.get("/api/stream-binary", (req, res) => {
    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader("Transfer-Encoding", "chunked");
    const buf1 = Buffer.from([0x00, 0x01, 0x02, 0x03]);
    const buf2 = Buffer.from([0x04, 0x05, 0x06, 0x07]);
    const buf3 = Buffer.from([0x08, 0x09, 0x0a, 0x0b]);
    const chunks = [buf1, buf2, buf3];
    let i = 0;
    const interval = setInterval(() => {
        if (i < chunks.length) {
            res.write(chunks[i]);
            i++;
        } else {
            res.end();
            clearInterval(interval);
        }
    }, 10);
});

app.get("/api/stream-empty", (req, res) => {
    res.setHeader("Content-Type", "text/plain");
    res.end();
});

const PORT = 3000;
const server = app.listen(PORT, () => {
    console.log(`Mock server started: http://localhost:${PORT}`);
});

export default server;
