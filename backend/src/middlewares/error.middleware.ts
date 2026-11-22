import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors.js';
import { ZodError } from 'zod';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Manejo de errores de Zod
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: 'Validación de datos fallida',
      errors: err.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  // Manejo de AppError personalizado
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      details: err.details,
    });
    return;
  }

  // Error de Prisma (registro duplicado, llave foránea)
  if (err.code === 'P2002') {
    res.status(409).json({
      success: false,
      message: 'Ya existe un registro con estos datos únicos',
      fields: err.meta?.target,
    });
    return;
  }

  if (err.code === 'P2025') {
    res.status(404).json({
      success: false,
      message: 'El registro solicitado no fue encontrado en la base de datos',
    });
    return;
  }

  console.error('[UNHANDLED_ERROR]', err);

  res.status(500).json({
    success: false,
    message:
      process.env.NODE_ENV === 'production'
        ? 'Error interno del servidor'
        : err.message || 'Error interno',
  });
};
