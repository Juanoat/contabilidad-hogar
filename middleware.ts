import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isAuthPage = req.nextUrl.pathname.startsWith('/login') || req.nextUrl.pathname.startsWith('/register');
  const isApiAuthRoute = req.nextUrl.pathname.startsWith('/api/auth');
  const isDbInitRoute = req.nextUrl.pathname.startsWith('/api/db/init');

  // Permitir rutas de auth API y db init
  if (isApiAuthRoute || isDbInitRoute) {
    return NextResponse.next();
  }

  // Si está logueado y trata de ir a login/register, redirigir a home
  if (isLoggedIn && isAuthPage) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  // Si no está logueado y no es página de auth, redirigir a login
  if (!isLoggedIn && !isAuthPage) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.ico$|manifest.json|sw.js).*)'],
};
