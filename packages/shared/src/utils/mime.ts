import MIME_TYPE, { MIMETypeValue } from '../constants/mime';

/**
 * @description 获取二级文件类型
 * @param {String} type 一级文件类型
 * @return array
 */
export const getFileType = (type: string): MIMETypeValue[] => {
  switch (type) {
    case 'image':
      return Object.values(MIME_TYPE.Image);
    case 'video':
      return [...Object.values(MIME_TYPE.Video)];
    case 'application':
      return [...Object.values(MIME_TYPE.Application)];
    case 'audio':
      return [...Object.values(MIME_TYPE.Audio)];
    case 'archive':
      return [...Object.values(MIME_TYPE.Archive)];
    case 'other':
      return [
        ...Object.values(MIME_TYPE.Other),
        ...Object.values(MIME_TYPE.Font),
      ];
    default:
      return [];
  }
};

/**
 * @description 获取模型文件 MIME 类型
 * @param {String} extension 文件扩展名
 * @return string
 */
export const getModelMimeType = (extension: string): string => {
  const modelMimeTypes: { [key: string]: string } = {
    pth: 'application/pytorch-model',
    pt: 'application/pytorch-model',
    h5: 'application/tensorflow-model',
    pb: 'application/tensorflow-model',
    onnx: 'application/onnx-model',
    caffemodel: 'application/caffe-model',
    weights: 'application/darknet-weights',
    params: 'application/mxnet-model',
    bin: 'application/huggingface-model',
  };

  return modelMimeTypes[extension.toLowerCase()] || 'application/octet-stream';
};
