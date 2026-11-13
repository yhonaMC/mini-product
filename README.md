# MiniTienda

App iOS y Android de productos de [DummyJSON](https://dummyjson.com), con favoritos locales. React Native CLI **0.81.6**, New Architecture y TypeScript estricto, sin Expo.

El catálogo, detalle y favoritos están implementados. La validación de integración aprobó lint, formato, tipos, **114 tests en 17 suites** y el recorrido manual Android. El build iOS final de las pantallas funcionales y la comprobación desde un clon limpio siguen pendientes. Los dos revisores independientes contrastaron requisitos y código; su hallazgo sobre rotación se corrigió con regresiones. El [registro de validación](docs/VALIDATION.md) distingue cada ejecución y su alcance.

## Funcionalidad

- **Productos:** `FlatList` con imagen, título, precio original y descuento; páginas de 20 productos mediante `limit`/`skip`, scroll infinito y botón accesible para cargar más. Búsqueda con debounce de **300 ms** y categorías cargadas desde la API. Escribir una búsqueda limpia la categoría; elegir una categoría limpia la búsqueda. Carga inicial, lista vacía y errores de carga/paginación tienen mensajes y reintento.
- **Detalle:** GET independiente por producto, carrusel con controles anterior/siguiente, descripción, precio con descuento, rating y etiquetas. Un favorito local sirve como información inicial y respaldo si falla la actualización; el fallo sigue visible y permite reintentar. Sin selección, la pestaña invita a elegir un producto.
- **Favoritos:** lista exclusivamente local, sin consultar la API. MMKV conserva el objeto `Product` completo, incluidas descripción, imágenes, reviews y metadatos; no guarda solo IDs. Los cambios se reflejan inmediatamente entre pantallas. Se elimina deslizando a la izquierda o con el botón accesible de favorito; el estado vacío permite volver al catálogo.
- **Navegación:** tres Bottom Tabs —Productos, Detalle y Favoritos— y un Stack tipado dentro de Productos. Abrir un producto desde catálogo o favoritos actualiza la selección de Detalle y abre el detalle del Stack, conservando la navegación hacia atrás.
- **Experiencia:** skeletons, tema claro/oscuro con modo inicial del sistema, controles con roles, labels y estados accesibles, y animación del favorito con Reanimated 3 que respeta movimiento reducido. Un Error Boundary global permite recuperar errores de renderizado.

## Capturas Android

Capturas reales del emulador durante la validación manual. La imagen sin conexión muestra favoritos persistidos; la del catálogo muestra un error de red recuperable.

<img src="docs/screenshots/android-products.png" alt="Catálogo Android con búsqueda, categorías y precios" width="220" /> <img src="docs/screenshots/android-detail-final.png" alt="Detalle Android con carrusel y botón de favorito" width="220" /> <img src="docs/screenshots/android-favorites.png" alt="Lista de favoritos locales en Android" width="220" />

<img src="docs/screenshots/android-favorites-offline-dark.png" alt="Favoritos locales sin conexión en modo oscuro" width="220" /> <img src="docs/screenshots/android-network-error.png" alt="Error de red del catálogo con opción de reintento" width="220" />

<img src="docs/screenshots/android-demo.gif" alt="Demo Android: cambiar de imagen en el carrusel, guardar el producto y verlo en Favoritos" width="220" />

El GIF muestra un producto con tres imágenes: se avanza de la primera a la segunda, se guarda como favorito y se abre la lista con dos productos guardados. La captura iOS de la versión funcional está pendiente. Las evidencias anteriores de iOS corresponden a los cimientos, sin acreditar interacción de las pantallas finales.

## Entorno y versiones

| Herramienta o dependencia                    | Versión                                                                    |
| -------------------------------------------- | -------------------------------------------------------------------------- |
| Node                                         | 22 LTS (`.nvmrc`); mínimo 20.19.4                                          |
| React Native / Community CLI local           | 0.81.6 / 20.0.0                                                            |
| React / react-test-renderer                  | 19.1.4 / 19.1.4                                                            |
| TypeScript                                   | 5.9.3, `strict: true`                                                      |
| Java                                         | JDK 17                                                                     |
| Android                                      | SDK 36, Build Tools 36.0.0, NDK 27.1.12297006, CMake 3.22.1; mínimo API 24 |
| React Navigation                             | native 7.5.1; bottom-tabs/native-stack 7.21.0                              |
| Native screens / Safe Area / Gesture Handler | 4.24.0 / 5.6.2 / 2.33.1                                                    |
| Estado y persistencia                        | TanStack Query 5.107.1, Zustand 5.1.0, MMKV 3.3.3                          |
| Animación e imágenes                         | Reanimated 3.19.5, FastImage 8.13.0                                        |
| Tests y formato                              | Jest 29.7.0, RNTL 13.3.3, ESLint 8.57.1, Prettier 2.8.8                    |

Las dependencias exactas están fijadas en `package-lock.json`; usar `npm ci`. En Windows se validó con Node 26.13.0 y JDK 17.0.21. CI usa Node 22. El build iOS aprobado registró **Node 22.23.5, Ruby 3.3.6, Bundler 2.6.9, CocoaPods 1.15.2 y Xcode 16.4 (16F6)**. Cada ejecución publica sus versiones en `ios-tool-versions.txt`; `Gemfile` conserva las restricciones de Ruby/CocoaPods.

## Android desde Windows

Instalar Node 22, JDK 17, Android Studio y los componentes Android de la tabla. Configurar `JAVA_HOME` y `ANDROID_HOME`, y añadir `platform-tools` al `PATH`. Arrancar un emulador o conectar un teléfono con depuración USB; comprobarlo con `adb devices`. El emulador requiere virtualización y aceleración habilitadas. En la máquina de validación se usó Windows Hypervisor Platform y el AVD `Pixel_API_36`, con rutas largas habilitadas.

Desde la raíz, instalar dependencias e iniciar Metro:

```powershell
npm ci
npm start
```

En otra terminal, también desde la raíz:

```powershell
npm run android
```

Para compilar sin instalar en un dispositivo:

```powershell
cd android
.\gradlew.bat assembleDebug --max-workers=2
```

El APK se genera en `android/app/build/outputs/apk/debug/app-debug.apk`. Para compilar solo el ABI del emulador local, añadir `-PreactNativeArchitectures=x86_64`. GitHub Actions compila todos los ABI configurados. **El APK debug necesita Metro**, también al arrancar para comprobar favoritos offline: debe conservar acceso al servidor JavaScript aunque la API no esté disponible.

Se verificó además un APK autónomo del emulador: `assembleRelease -PreactNativeArchitectures=x86_64 --max-workers=2`. Incluye JavaScript y usa la firma de desarrollo de la plantilla para esta prueba local. Con Metro cerrado y modo avión, la app arrancó y restauró los dos favoritos completos desde MMKV. [Captura del arranque sin red](docs/screenshots/android-release-offline.png).

## iOS desde macOS

Usar Node 22, Xcode 16.4 con Command Line Tools y un simulador iPhone instalado. El entorno validado usa Ruby 3.3.6 y Bundler 2.6.9; instalar las dependencias Ruby mediante `Gemfile` para respetar sus restricciones. Desde la raíz:

```sh
npm ci
bundle install
bundle exec pod install --project-directory=ios
npm start
```

En otra terminal, ejecutar `npm run ios`. También se puede abrir `ios/MiniTienda.xcworkspace` en Xcode y elegir un simulador. El desarrollo local usa Metro; un dispositivo físico requiere configurar su firma.

## iOS desde Windows con Codemagic

El repositorio ya tiene un webhook activo para pushes a `main`. El workflow `ios-simulator` de [codemagic.yaml](codemagic.yaml) también puede iniciarse desde [Codemagic](https://codemagic.io/apps). Para usar un fork, conectarlo a una cuenta propia y configurar el workflow y su webhook.

La máquina macOS M2 con Xcode 16.4 instala dependencias, ejecuta calidad/tests y compila **Release de simulador sin firma**, con bundle JavaScript incluido. Selecciona un iPhone disponible por UDID, espera su arranque, instala la app y comprueba que el proceso sigue vivo tras **20 segundos** antes de capturar. No necesita Metro ni cuenta de Apple Developer; el `.app` es para simulador.

El workflow publica `MiniTienda.app`, `ios-simulator.zip`, `ios-home.png`, logs de compilación/arranque/proceso e `ios-tool-versions.txt`. El [build #3 de los cimientos](https://codemagic.io/app/6af632ef1de9516df029eb63/build/6af64acceee0ba94dc935c1a) aprobó la compilación del módulo Swift y adaptador ObjC++ y el smoke test; su captura fue inspeccionada. **No se ha realizado interacción manual en iOS** ni se acredita todavía el G4 final.

Para ahorrar minutos macOS, `when.changeset` excluye cambios limitados a `**/*.md` y `docs/**`. Según la [documentación de Codemagic](https://docs.codemagic.io/yaml-running-builds/starting-builds-automatically/), la primera ejecución tras configurar este filtro corre completa; las siguientes pueden omitir el trabajo según los cambios desde el último build exitoso. Modificar `codemagic.yaml` también fuerza una ejecución. El filtro se evalúa tras obtener las fuentes, por lo que puede aparecer una ejecución marcada como omitida.

No se activó App Preview ni facturación. Los minutos disponibles se consultan en la propia cuenta antes de ejecutar builds; no se presupone una cuota gratuita. GitHub Actions mantiene calidad y compilación Android en cada push y pull request, incluidos los cambios de documentación.

## Tests y calidad

Desde la raíz:

```sh
npm run lint
npm run lint:format
npm run typecheck
npm test -- --ci --runInBand
```

Para ejecutar una integración concreta:

```sh
npm test -- --runInBand src/screens/Favorites/FavoritesScreen.test.tsx
```

La última puerta global aprobó **114 tests en 17 suites**. Se prueban HTTP y cancelación/timeout, endpoints, precios, debounce, filtros y paginación, detalle con respaldo local, persistencia y fallos de MMKV, reactividad entre consumidores, módulo nativo, errores/reintento de imágenes, medición/realineación del carrusel y render/interacción de pantallas. Se simulan fronteras como `fetch`, MMKV y componentes nativos; los hooks y stores se ejercitan con su lógica real. Esta cifra cuenta pruebas, no representa un porcentaje de cobertura de código.

`lint` revisa `src/` y trata warnings como fallos. Están activas `@typescript-eslint/no-explicit-any`, `react-hooks/rules-of-hooks` y `react-hooks/exhaustive-deps`. `lint:format` revisa código y documentación según `.prettierignore`; `npm run format` aplica formato. Los builds y el recorrido manual complementan Jest.

## Arquitectura y decisiones

| Capa                     | Responsabilidad                                              |
| ------------------------ | ------------------------------------------------------------ |
| `domain`                 | Producto completo, categorías, páginas y filtro discriminado |
| `api`                    | Cliente HTTP y endpoints, sin dependencias de UI             |
| `hooks`                  | Consultas, debounce, filtros y acceso a favoritos            |
| `store` / `storage`      | Favoritos globales y adaptador MMKV                          |
| `screens` / `components` | Pantallas y piezas visuales reutilizables                    |
| `navigation` / `theme`   | Rutas tipadas, selección del detalle y tokens de color       |
| `utils` / `native`       | Cálculo de precios y puente al formato monetario nativo      |

**fetch centralizado** evita otra dependencia HTTP y permite configurar URL base y timeout en `src/api/config.ts` o inyectarlos en `createHttpClient`. La configuración actual es DummyJSON y 12 segundos. El cliente distingue errores HTTP, de conectividad y timeout, y consume `AbortSignal` de React Query. Cancelar una consulta no se presenta como fallo de conexión. Las pantallas consumen la API a través de hooks.

**TanStack Query y Zustand** separan datos del servidor y estado local. Query gestiona caché de sesión, cancelación y páginas por filtro; el siguiente `skip` se calcula con la respuesta y la lista elimina duplicados. Zustand mantiene favoritos globales con selectores estables para React 19/Zustand 5. `ProductCard` está memoizado y comparte un callback de navegación estable para evitar trabajo en filas sin cambios.

**MMKV 3.3.3** aporta persistencia local síncrona compatible con New Architecture sin incorporar Nitro Modules de v4. Zustand `persist` guarda solo el mapa de productos completos en un esquema versionado. La lectura valida el contenido; fallos de inicialización, lectura, corrupción o escritura se muestran mediante `storageError` y un aviso global con reintento. Un fallo de lectura conserva los datos guardados; al recuperarse se fusionan adiciones y eliminaciones de la sesión. Si falla una escritura, los cambios siguen reactivos en memoria, pero pueden perderse al cerrar la app hasta que se guarden correctamente.

**FastImage 8.13.0** utiliza caché nativa Glide/SDWebImage con política `immutable` para las URLs estables de DummyJSON. `ProductImage` muestra un aviso y un botón accesible para reintentar si falla una imagen. La caché puede ser desalojada y no garantiza todas las imágenes sin conexión. Los objetos y URLs de favoritos permanecen en MMKV; la caché del catálogo es de sesión y no se persiste como un catálogo offline.

**React Navigation v7 y Reanimated 3.19.5** cumplen las versiones mayores requeridas. `react-native-screens` 4.24.0 y Safe Area 5.6.2 se mantienen en las versiones integradas con RN 0.81. El favorito de Detalle usa `useSharedValue`, `useAnimatedStyle`, `withTiming` y `withSpring`; el swipe usa `ReanimatedSwipeable`. El plugin Babel de Reanimated está al final.

**CurrencyFormatter** es un TurboModule con spec Codegen, Kotlin (`NumberFormat`), Swift (`NumberFormatter`) y adaptador ObjC++. `formatPrice` delega en el módulo registrado; `Intl.NumberFormat` es el respaldo cuando no existe, por ejemplo en tests. Un error del módulo registrado se propaga para hacer visible un defecto nativo. DummyJSON se presenta en USD, sin conversión de divisas; el formato puede variar ligeramente entre plataformas.

**CI** reparte responsabilidades: [GitHub Actions](.github/workflows/ci.yml) valida lint, formato, tipos, Jest y APK Android; Codemagic compila y comprueba el arranque iOS desde Windows. La compilación automatizada no sustituye la interacción manual ni la revisión independiente.

## Recorrido manual y comportamiento sin conexión

1. Abrir Productos, llegar al final para cargar otra página y buscar un término; la consulta espera 300 ms desde el último cambio.
2. Elegir una categoría y comprobar que la búsqueda se limpia. Volver a escribir y comprobar que se limpia la categoría.
3. Abrir un producto, recorrer imágenes y añadirlo a favoritos. Volver al catálogo: el indicador cambia inmediatamente. La pestaña Detalle conserva la selección.
4. Abrir Favoritos y eliminar un producto mediante botón o swipe; al quitar el último aparece el estado vacío con acceso al catálogo.
5. Guardar otro favorito, reiniciar y comprobar persistencia. Cambiar a modo oscuro y cortar la conexión de la API: Favoritos sigue mostrando los datos locales.
6. Sin conexión, realizar una búsqueda nueva: aparece un error con reintento. El detalle de un favorito intenta actualizarse y conserva la última información con un aviso. Un producto sin dato guardado ni caché puede mostrar solo el error. Restaurar la conexión y reintentar.

Este recorrido se completó manualmente en Android durante Fase 2. Es normal que una consulta cacheada aún muestre datos al perder la red, que una imagen no cacheada no esté disponible y que la API falle sin conexión. Los errores de almacenamiento se muestran por separado. El arranque autónomo offline con APK Release también se verificó en Fase 3.

El [plan](PLAN.md), los [contratos](docs/CONTRACTS.md), los [contratos de pantallas](docs/PHASE2_CONTRACTS.md) y la [revisión de requisitos](docs/REQUIREMENTS_REVIEW.md) documentan el alcance. Faltan el G4 final de iOS, la revisión independiente G5 y la comprobación G6 desde un clon limpio antes de declarar la entrega cerrada.
