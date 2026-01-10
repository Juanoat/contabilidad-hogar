# Iconos de la PWA

## Iconos necesarios

Para que la PWA funcione correctamente, necesitás generar los siguientes iconos:

### Iconos estándar (any purpose)
- `icon-72x72.png`
- `icon-96x96.png`
- `icon-128x128.png`
- `icon-144x144.png`
- `icon-152x152.png`
- `icon-192x192.png`
- `icon-384x384.png`
- `icon-512x512.png`

### Iconos maskable (para Android adaptive icons)
- `icon-192x192-maskable.png`
- `icon-512x512-maskable.png`

### Iconos de shortcuts (opcional)
- `shortcut-dashboard.png` (96x96)
- `shortcut-import.png` (96x96)

## Cómo generar los iconos

### Opción 1: Usando una herramienta online (RECOMENDADO)

1. Ve a **https://www.pwabuilder.com/imageGenerator**
2. Sube tu logo/icono en alta resolución (mínimo 512x512)
3. Descargá todos los tamaños generados
4. Colocá los archivos en esta carpeta

### Opción 2: Usando Figma/Photoshop

1. Creá un canvas de 512x512 px
2. Diseñá tu icono (usá el emoji 💰 o un diseño personalizado)
3. Para iconos maskable: dejá un **safe zone** de 40px de margen en todos los lados
4. Exportá en todos los tamaños necesarios

### Opción 3: Usando ImageMagick (línea de comandos)

Si tenés un icono base de 512x512 llamado `icon-base.png`:

```bash
# Instalar ImageMagick
brew install imagemagick  # macOS
# sudo apt-get install imagemagick  # Linux

# Generar todos los tamaños
convert icon-base.png -resize 72x72 icon-72x72.png
convert icon-base.png -resize 96x96 icon-96x96.png
convert icon-base.png -resize 128x128 icon-128x128.png
convert icon-base.png -resize 144x144 icon-144x144.png
convert icon-base.png -resize 152x152 icon-152x152.png
convert icon-base.png -resize 192x192 icon-192x192.png
convert icon-base.png -resize 384x384 icon-384x384.png
convert icon-base.png -resize 512x512 icon-512x512.png

# Para maskable (con padding)
convert icon-base.png -resize 512x512 -background transparent -gravity center -extent 640x640 icon-512x512-maskable-temp.png
convert icon-512x512-maskable-temp.png -resize 512x512 icon-512x512-maskable.png
convert icon-512x512-maskable-temp.png -resize 192x192 icon-192x192-maskable.png
rm icon-512x512-maskable-temp.png
```

## Diseño sugerido

**Colores de la marca:**
- Primario: `#007AFF` (iOS Blue)
- Secundario: `#F2F2F7` (Light Gray)
- Acento: `#34C759` (iOS Green)

**Concepto:**
- Emoji 💰 sobre fondo degradado azul
- O un icono minimalista de billetera/monedas
- Bordes redondeados para look iOS

## Iconos iOS (para iPhone/iPad)

Además de los iconos PWA, necesitás iconos específicos para iOS que se agregan en el HTML:

- `apple-touch-icon-120x120.png` (iPhone)
- `apple-touch-icon-152x152.png` (iPad)
- `apple-touch-icon-167x167.png` (iPad Pro)
- `apple-touch-icon-180x180.png` (iPhone Plus/X)

Estos se pueden generar igual que los otros, pero SIN el safe zone maskable.

## Testing

Una vez generados los iconos, probá:

1. **Chrome DevTools:**
   - Abrí DevTools → Application → Manifest
   - Verificá que todos los iconos carguen correctamente

2. **Android:**
   - Instalá la PWA
   - El icono debe verse bien en el home screen y app drawer

3. **iOS:**
   - Add to Home Screen
   - El icono debe verse nítido sin bordes blancos

## Placeholders temporales

Si querés probar la PWA sin diseñar iconos, podés usar placeholders:
- https://via.placeholder.com/512x512/007AFF/FFFFFF?text=💰

Pero recordá reemplazarlos antes de lanzar en producción!
