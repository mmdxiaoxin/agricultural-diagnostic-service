export const MIME_TYPE = {
    // 视频文件类型
    Video: {
        MP4: "video/mp4",
        AVI: "video/avi",
        MPEG: "video/mpeg",
        OGG: "video/ogg",
        WebM: "video/webm",
        "3GPP": "video/3gpp",
        QuickTime: "video/quicktime",
        XMSVideo: "video/x-msvideo",
    },

    // 音频文件类型
    Audio: {
        MP3: "audio/mpeg",
        WAV: "audio/wav",
        OGG: "audio/ogg",
        AAC: "audio/aac",
        FLAC: "audio/flac",
        WebM: "audio/webm",
        Opus: "audio/opus",
    },

    // 图像文件类型
    Image: {
        JPEG: "image/jpeg",
        PNG: "image/png",
        GIF: "image/gif",
        WebP: "image/webp",
        BMP: "image/bmp",
        SVG: "image/svg+xml",
        TIFF: "image/tiff",
    },

    // 文档文件类型
    Application: {
        PDF: "application/pdf",
        Word: "application/msword",
        Excel: "application/vnd.ms-excel",
        PowerPoint: "application/vnd.ms-powerpoint",
        WordOpenXML:
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ExcelOpenXML:
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        PPTXOpenXML:
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        JSON: "application/json",
        XML: "application/xml",

        // 深度学习模型文件类型
        PyTorch: "application/pytorch-model",
        TensorFlow: "application/tensorflow-model",
        ONNX: "application/onnx-model",
        Caffe: "application/caffe-model",
        Darknet: "application/darknet-weights",
        MXNet: "application/mxnet-model",
        HuggingFace: "application/huggingface-model",
    },

    // 应用程序文件类型
    App: {
        Zip: "application/zip",
        XZip: "application/x-zip-compressed",
        RAR: "application/x-rar-compressed",
        TAR: "application/x-tar",
        "7z": "application/x-7z-compressed",
        SH: "application/x-sh",
        JAR: "application/java-archive",
    },

    // 字体文件类型
    Font: {
        WOFF: "font/woff",
        WOFF2: "font/woff2",
        FontWOFF: "application/font-woff",
        FontTTF: "application/font-ttf",
        FontOTF: "application/font-otf",
    },

    // 其他类型
    Other: {
        CSV: "text/csv",
        PHP: "application/x-httpd-php",
        OctetStream: "application/octet-stream",
    },
} as const;

export type VideoTypeValue =
    (typeof MIME_TYPE.Video)[keyof typeof MIME_TYPE.Video];
export type AudioTypeValue =
    (typeof MIME_TYPE.Audio)[keyof typeof MIME_TYPE.Audio];
export type ImageTypeValue =
    (typeof MIME_TYPE.Image)[keyof typeof MIME_TYPE.Image];
export type ApplicationTypeValue =
    (typeof MIME_TYPE.Application)[keyof typeof MIME_TYPE.Application];
export type FontTypeValue =
    (typeof MIME_TYPE.Font)[keyof typeof MIME_TYPE.Font];
export type OtherTypeValue =
    (typeof MIME_TYPE.Other)[keyof typeof MIME_TYPE.Other];
export type AppTypeValue = (typeof MIME_TYPE.App)[keyof typeof MIME_TYPE.App];

export type MIMETypeValue =
    | VideoTypeValue
    | AudioTypeValue
    | ImageTypeValue
    | ApplicationTypeValue
    | FontTypeValue
    | OtherTypeValue
    | AppTypeValue;

export default MIME_TYPE;
