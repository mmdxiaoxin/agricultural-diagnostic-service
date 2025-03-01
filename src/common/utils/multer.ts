import fs from "fs";
import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";

export const uploadStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        // 根据文件 MIME 类型选择不同的文件夹
        let folder = "uploads/other"; // 默认存储在 "other" 文件夹
        const mimeType = file.mimetype;

        // 按 MIME 类型分文件夹存储
        if (mimeType.startsWith("image")) {
            folder = "uploads/images"; // 存储图片文件
        } else if (mimeType.startsWith("video")) {
            folder = "uploads/videos"; // 存储视频文件
        } else if (mimeType.startsWith("application")) {
            folder = "uploads/documents"; // 存储文档文件
        } else if (mimeType.startsWith("audio")) {
            folder = "uploads/audio"; // 存储音频文件
        }

        // 确保文件夹存在，如果没有则创建
        const fs = require("fs");
        if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder, { recursive: true });
        }
        cb(null, folder);
    },
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + "-" + uuidv4();
        // 修复中文乱码问题
        file.originalname = Buffer.from(file.originalname, "latin1").toString(
            "utf-8"
        );
        cb(null, uniqueName);
    },
});

export const chunkStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const fs = require("fs");
        if (!fs.existsSync("uploads/chunks")) {
            fs.mkdirSync("uploads/chunks", { recursive: true });
        }
        cb(null, "uploads/chunks");
    },
    filename: (req, file, cb) => {
        const { task_id, chunkIndex } = req.body;
        if (!task_id || !chunkIndex) {
            return cb(
                new Error("Missing task_id or chunkIndex"),
                file.filename
            );
        }
        cb(null, `${task_id}-${chunkIndex}`);
    },
});

export const avatarStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (!fs.existsSync("uploads/avatar")) {
            fs.mkdirSync("uploads/avatar", { recursive: true });
        }
        cb(null, "uploads/avatar");
    },
    filename: (req, file, cb) => {
        const uniquePrefix = uuidv4();
        const fileExtension = path.extname(file.originalname);
        cb(null, `${uniquePrefix}${fileExtension}`);
    },
});

export const imageFilter = (req: any, file: any, cb: any) => {
    // 只允许 image/* 类型的文件
    if (!file.mimetype.startsWith("image")) {
        const error = new Error("只允许上传图片文件") as any;
        error.statusCode = 400;
        return cb(error, false);
    }
    cb(null, true);
};
