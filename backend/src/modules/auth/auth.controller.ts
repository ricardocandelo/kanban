import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service.js';
import {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  updateProfileSchema,
} from './auth.schemas.js';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware.js';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: (process.env.NODE_ENV === 'production' ? 'none' : 'lax') as 'none' | 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
};

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const data = registerSchema.parse(req.body);
      const result = await AuthService.register(data);

      res.cookie('refreshToken', result.refreshToken, COOKIE_OPTIONS);
      res.status(201).json({
        success: true,
        message: 'Usuario registrado exitosamente',
        data: {
          user: result.user,
          workspace: result.workspace,
          accessToken: result.accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const data = loginSchema.parse(req.body);
      const result = await AuthService.login(data);

      res.cookie('refreshToken', result.refreshToken, COOKIE_OPTIONS);
      res.json({
        success: true,
        message: 'Inicio de sesión exitoso',
        data: {
          user: result.user,
          workspaces: result.workspaces,
          accessToken: result.accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.cookies?.refreshToken || req.body?.refreshToken;
      if (!token) {
        res.status(401).json({ success: false, message: 'No refresh token provided' });
        return;
      }
      const result = await AuthService.refresh(token);
      res.cookie('refreshToken', result.refreshToken, COOKIE_OPTIONS);
      res.json({
        success: true,
        data: {
          accessToken: result.accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.cookies?.refreshToken;
      await AuthService.logout(token);
      res.clearCookie('refreshToken', COOKIE_OPTIONS);
      res.json({ success: true, message: 'Sesión cerrada exitosamente' });
    } catch (error) {
      next(error);
    }
  }

  static async getMe(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const user = await AuthService.getMe(req.user!.userId);
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  static async updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = updateProfileSchema.parse(req.body);
      const user = await AuthService.updateProfile(req.user!.userId, data);
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  static async changePassword(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = changePasswordSchema.parse(req.body);
      const result = await AuthService.changePassword(req.user!.userId, data);
      res.clearCookie('refreshToken', COOKIE_OPTIONS);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      if (!email) {
        res.status(400).json({ success: false, message: 'Correo electrónico requerido' });
        return;
      }
      const result = await AuthService.forgotPassword(email);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, newPassword } = req.body;
      if (!token || !newPassword) {
        res.status(400).json({ success: false, message: 'Token y nueva contraseña requeridos' });
        return;
      }
      const result = await AuthService.resetPassword(token, newPassword);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}
