# IVANNA (PWA con Firebase)

Sitio estático sin paso de compilación: se despliega tal cual en Vercel.

## 1. Crear el proyecto en Firebase
1. En console.firebase.google.com crea un proyecto.
2. Authentication > Método de acceso > activa **Correo y contraseña**.
3. Firestore Database > Crear base de datos (modo producción, región cercana).
4. Configuración del proyecto > Tus apps > agrega una **app web** y copia su configuración en `firebase-config.js`.
5. Firestore > Reglas: pega el contenido de `firestore.rules` y publica.
6. (Para fotos de recetas y comprobantes, siguiente versión) Storage > Comenzar, y pega `storage.rules` en sus reglas.

## 2. Subir a GitHub y desplegar en Vercel
1. Crea un repositorio y sube todos estos archivos en la raíz.
2. En vercel.com > Add New > Project, importa el repositorio. Framework: **Other**; sin comando de build; directorio de salida vacío.
3. Copia la URL que te da Vercel (por ejemplo `tu-app.vercel.app`).
4. Firebase > Authentication > Configuración > **Dominios autorizados** > agrega esa URL.

## 3. Primer uso
- Abre la URL, crea tu cuenta y toca «Crear espacio familiar».
- Para el otro padre o cuidador: Ajustes > «Invitar a otro cuidador» genera un código válido 7 días. Esa persona crea su cuenta y elige «Unirme con código».
- En el teléfono: menú del navegador > «Agregar a pantalla de inicio».
- Para pasar datos de la versión de prueba: en la versión anterior copia la copia de seguridad (Ajustes > Copiar) y pégala en Ajustes > Restaurar aquí.

## Cómo se guardan los datos
- `families/{id}/events/*`: un documento por registro (alimentación, sueño, pañales, salud).
- `families/{id}/data/state`: bebés, medicamentos, vacunas y mediciones.
- `families/{id}/members/*`: quién pertenece a la familia y su rol (administrador o cuidador).
- Solo los miembros leen o escriben datos de su familia. Funciona sin conexión y sincroniza al volver.

## Qué incluye
Perfil y varios bebés, dashboard, alimentación, sueño, pañales, salud y medicamentos, vacunación (México), crecimiento con percentiles OMS, hitos, rutinas y actividades, dentición con odontograma, álbum de fotos, línea del tiempo, tarjeta de cumplemés y libro de recuerdos imprimible, reporte para el pediatra (PDF y Excel), avisos, asistente de resumen y familia con roles.

## Pendiente
Videos en el álbum, permisos por módulo y notificaciones con la app cerrada (requieren un servidor de envío).
