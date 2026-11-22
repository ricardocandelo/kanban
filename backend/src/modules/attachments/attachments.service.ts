import { cloudinary } from '../../config/cloudinary.js';
import { config } from '../../config/env.js';
import { prisma } from '../../config/db.js';
import { SaveAttachmentInput } from './attachments.schemas.js';

export class AttachmentsService {
  static getUploadSignature(folder = 'flowboard') {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const signature = cloudinary.utils.api_sign_request(
      { timestamp, folder },
      config.cloudinary.apiSecret
    );

    return {
      timestamp,
      signature,
      apiKey: config.cloudinary.apiKey,
      cloudName: config.cloudinary.cloudName,
      folder,
    };
  }

  static async create(taskId: string, userId: string, input: SaveAttachmentInput) {
    return prisma.attachment.create({
      data: {
        taskId,
        uploadedById: userId,
        fileName: input.fileName,
        fileUrl: input.fileUrl,
        publicId: input.publicId,
        fileSize: input.fileSize,
        mimeType: input.mimeType,
        format: input.format,
      },
      include: {
        uploadedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });
  }

  static async delete(attachmentId: string) {
    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
    });
    if (!attachment) return;

    try {
      await cloudinary.uploader.destroy(attachment.publicId);
    } catch (err) {
      console.error('Error destruyendo archivo en Cloudinary:', err);
    }

    return prisma.attachment.delete({
      where: { id: attachmentId },
    });
  }
}
