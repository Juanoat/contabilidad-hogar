import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email y contraseña son requeridos' },
        { status: 400 }
      );
    }

    // Verificar si el email ya existe
    const existing = await sql`SELECT id FROM users WHERE email = ${email}`;
    if (existing.rows.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Este email ya está registrado' },
        { status: 400 }
      );
    }

    // Hash de la contraseña
    const passwordHash = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    // Crear usuario
    await sql`
      INSERT INTO users (id, email, password_hash, name)
      VALUES (${userId}, ${email}, ${passwordHash}, ${name || null})
    `;

    // Crear configuración por defecto
    await sql`
      INSERT INTO user_settings (user_id, exchange_rate)
      VALUES (${userId}, 1200)
    `;

    return NextResponse.json({
      success: true,
      message: 'Usuario creado exitosamente'
    });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { success: false, error: 'Error al crear usuario' },
      { status: 500 }
    );
  }
}
