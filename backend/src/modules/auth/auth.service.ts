import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../../config/db.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/tokens.js';
import { BadRequestError, UnauthorizedError } from '../../utils/errors.js';
import { RegisterInput, LoginInput, ChangePasswordInput, UpdateProfileInput } from './auth.schemas.js';

export class AuthService {
  static async register(input: RegisterInput) {
    const existing = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });
    if (existing) {
      throw new BadRequestError('El correo electrónico ya está registrado');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(input.password, salt);

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: input.email.toLowerCase(),
          passwordHash,
          firstName: input.firstName,
          lastName: input.lastName,
        },
      });

      const wsName = input.workspaceName || `${input.firstName}'s Space`;
      const baseSlug = wsName.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const uniqueSlug = `${baseSlug}-${Math.random().toString(36).substring(2, 7)}`;

      const workspace = await tx.workspace.create({
        data: {
          name: wsName,
          slug: uniqueSlug,
          ownerId: newUser.id,
          members: {
            create: {
              userId: newUser.id,
              role: 'OWNER',
            },
          },
        },
      });

      return { user: newUser, workspace };
    });

    const accessToken = signAccessToken({ userId: user.user.id, email: user.user.email });
    const refreshToken = signRefreshToken({ userId: user.user.id, email: user.user.email });

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return {
      user: {
        id: user.user.id,
        email: user.user.email,
        firstName: user.user.firstName,
        lastName: user.user.lastName,
        avatarUrl: user.user.avatarUrl,
        isSuperAdmin: user.user.isSuperAdmin,
      },
      workspace: user.workspace,
      accessToken,
      refreshToken,
    };
  }

  static async login(input: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
      include: {
        workspaces: {
          include: {
            workspace: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedError('Credenciales incorrectas');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Tu cuenta se encuentra desactivada. Contacta al administrador.');
    }

    const isMatch = await bcrypt.compare(input.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedError('Credenciales incorrectas');
    }

    const accessToken = signAccessToken({ userId: user.id, email: user.email });
    const refreshToken = signRefreshToken({ userId: user.id, email: user.email });

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl,
        isSuperAdmin: user.isSuperAdmin,
      },
      workspaces: user.workspaces.map((w) => ({
        ...w.workspace,
        role: w.role,
      })),
      accessToken,
      refreshToken,
    };
  }

  static async refresh(token: string) {
    try {
      const payload = verifyRefreshToken(token);
      const stored = await prisma.refreshToken.findUnique({
        where: { token },
      });

      if (!stored || stored.expiresAt < new Date()) {
        if (stored) {
          await prisma.refreshToken.delete({ where: { id: stored.id } });
        }
        throw new UnauthorizedError('Refresh token expirado o inválido');
      }

      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
      });
      if (!user) throw new UnauthorizedError('Usuario no encontrado');

      // Rotar refresh token
      await prisma.refreshToken.delete({ where: { id: stored.id } });

      const newAccessToken = signAccessToken({ userId: user.id, email: user.email });
      const newRefreshToken = signRefreshToken({ userId: user.id, email: user.email });

      await prisma.refreshToken.create({
        data: {
          token: newRefreshToken,
          userId: user.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch {
      throw new UnauthorizedError('Sesión expirada');
    }
  }

  static async logout(refreshToken?: string) {
    if (refreshToken) {
      await prisma.refreshToken.deleteMany({
        where: { token: refreshToken },
      });
    }
    return { success: true };
  }

  static async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        isSuperAdmin: true,
        workspaces: {
          include: {
            workspace: true,
          },
        },
      },
    });
    if (!user) throw new UnauthorizedError('Usuario no encontrado');
    return user;
  }

  static async updateProfile(userId: string, input: UpdateProfileInput) {
    return prisma.user.update({
      where: { id: userId },
      data: input,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        isSuperAdmin: true,
      },
    });
  }

  static async changePassword(userId: string, input: ChangePasswordInput) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedError();

    const isMatch = await bcrypt.compare(input.currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new BadRequestError('La contraseña actual es incorrecta');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(input.newPassword, salt);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    // Revocar sesiones previas
    await prisma.refreshToken.deleteMany({ where: { userId } });

    return { success: true, message: 'Contraseña actualizada con éxito' };
  }

  static async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (!user) {
      return { success: true, message: 'Si el correo está registrado, se generó el enlace de recuperación.' };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordExpires,
      },
    });

    return {
      success: true,
      message: 'Token de recuperación generado exitosamente',
      resetToken,
    };
  }

  static async resetPassword(token: string, newPass: string) {
    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: { gt: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestError('El enlace de recuperación es inválido o ha expirado');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPass, salt);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    await prisma.refreshToken.deleteMany({ where: { userId: user.id } });

    return { success: true, message: 'Contraseña restablecida exitosamente' };
  }
}
