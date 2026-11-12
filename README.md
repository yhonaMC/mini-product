# MiniTienda

Prueba técnica Senior React Native: app iOS y Android con productos de DummyJSON y favoritos locales. React Native CLI **0.81.6**, New Architecture y TypeScript estricto, sin Expo.

**Estado actual: Fase 1.** La base ya se validó en Android e iOS. Se integran HTTP, favoritos, navegación y formateo nativo; las pantallas funcionales se desarrollan en Fase 2. [Plan](PLAN.md), [revisión de requisitos](docs/REQUIREMENTS_REVIEW.md), [contratos](docs/CONTRACTS.md) y [evidencias](docs/VALIDATION.md).

## Entorno

| Herramienta                  | Versión                                                                    |
| ---------------------------- | -------------------------------------------------------------------------- |
| Node                         | 22 LTS recomendado (`.nvmrc`); mínimo 20.19.4                              |
| React Native / Community CLI | 0.81.6 / 20.0.0 local al proyecto                                          |
| React / react-test-renderer  | 19.1.4 / 19.1.4                                                            |
| Java                         | JDK 17                                                                     |
| Android                      | SDK / Build Tools 36; NDK 27.1.12297006                                    |
| iOS en Codemagic             | Xcode 16.4, Node 22; Ruby/CocoaPods de la imagen, restricciones en Gemfile |

En esta PC Windows se usa Node 26.13.0 y JDK 17.0.21. En el build iOS aprobado se verificaron **Node 22.23.5, Ruby 3.3.6, Bundler 2.6.9, CocoaPods 1.15.2 y Xcode 16.4 (16F6)**. Se publican en `ios-tool-versions.txt` como artefacto de cada build. Las versiones exactas de npm se conservan en `package-lock.json`; Bundler resuelve las restricciones de `Gemfile`.

## Android desde Windows

Instalar Android Studio, SDK 36 y JDK 17. Configurar `ANDROID_HOME` y `JAVA_HOME`; añadir `platform-tools` al PATH. Para emulador, habilitar virtualización y Windows Hypervisor Platform. En esta PC WHPX y rutas largas ya están habilitados.

```powershell
npm ci
npm start
```

En otra terminal, con emulador arrancado o teléfono conectado por USB:

```powershell
npm run android
```

Compilación sin dispositivo:

```powershell
cd android
.\gradlew.bat assembleDebug --max-workers=2
```

Para compilar solo el ABI del emulador local: añadir `-PreactNativeArchitectures=x86_64`. El build de GitHub Actions compila todos los ABI configurados. El APK debug requiere Metro para cargar JavaScript.

## iOS sin Mac: Codemagic

1. Subir este proyecto a un repositorio de GitHub.
2. En [Codemagic](https://codemagic.io/apps), conectar ese repositorio y usar `codemagic.yaml` de la raíz.
3. Ejecutar el workflow `ios-simulator` en la rama `main`.
4. Revisar instalación de pods, build, smoke test y artefactos: `MiniTienda.app`, ZIP del simulador, logs, `ios-tool-versions.txt` e `ios-home.png`.

Este repositorio ya tiene un webhook activo: los pushes a `main` también disparan iOS automáticamente. Confirmar los minutos disponibles antes de usarlo de forma intensiva.

El workflow usa una máquina macOS M2 y Xcode 16.4. Compila **Release para simulador sin firma**, comprueba el bundle JavaScript, selecciona un iPhone disponible, espera su arranque, instala, abre y verifica que el proceso sigue vivo después de 20 segundos. No depende de Metro ni requiere cuenta de Apple Developer. Este artefacto no se instala en un iPhone físico.

La captura y el arranque no acreditan por sí solos todos los flujos de la app. [App Preview](https://docs.codemagic.io/yaml-distributing/app-preview/) permite interacción desde navegador, es opcional y requiere equipo con las condiciones de facturación del servicio; no se activa automáticamente. Confirmar los minutos de compilación disponibles en la propia cuenta.

## iOS si se dispone de macOS

Instalar Node, Xcode 16.4 y sus Command Line Tools, Ruby y Bundler. Desde la raíz:

```sh
npm ci
bundle install
bundle exec pod install --project-directory=ios
npm start
```

En otra terminal: `npm run ios`. También se puede abrir `ios/MiniTienda.xcworkspace` en Xcode. Para el mismo build independiente de Metro de CI: `bash scripts/ci/ios-build.sh` y `bash scripts/ci/ios-smoke.sh`.

## Calidad y pruebas

```sh
npm run lint
npm run lint:format
npm run typecheck
npm test -- --ci --runInBand
```

`lint` revisa `src/` y trata warnings como fallos. Están activas las tres reglas del PDF: `no-explicit-any`, `rules-of-hooks` y `exhaustive-deps`. `lint:format` comprueba los archivos de código y documentación mantenidos en este proyecto; los proyectos generados de Xcode/Gradle y el plan original conservan sus formatos. `npm run format` aplica el formato.

La prueba inicial de integración pulsa el control accesible para cambiar la apariencia y volver al modo inicial. Es una comprobación de la base; los tests de productos, HTTP, persistencia y favoritos se incorporan en sus respectivas fases, sin considerarlos aprobados de antemano.

## Decisiones

- **Zustand + TanStack Query:** favoritos globales con selectores y caché/paginación de servidor independientes. Es una combinación admitida explícitamente por la prueba.
- **fetch centralizado:** evita otro cliente HTTP; la fábrica recibirá URL base, timeout y señales de cancelación. La configuración inicial está en `src/api/config.ts`.
- **MMKV 3.3.3:** persistencia local síncrona, sin backend; se fija v3 porque usa New Architecture sin añadir Nitro Modules de v4. Los favoritos conservarán el objeto completo.
- **Reanimated 3.19.5:** respeta la versión mayor exigida. El plugin Babel está al final. No se instala v4.
- **Navegación v7:** tres pestañas y Stack anidado; params tipados. `screens` se limita a una versión compatible con RN 0.81.
- **Arquitectura:** `api`, `domain`, `hooks`, `screens`, `components`, `store` y `storage`; `navigation`, `theme`, `utils` y `native` separan responsabilidades transversales y permiten tests aislados.
- **CI:** GitHub Actions valida calidad y Android en cada push; Codemagic resuelve la compilación y el arranque iOS desde Windows.

FastImage 8.13.0 usa caché nativa de Glide/SDWebImage. Los assets de DummyJSON tienen URL estable: se usa política `immutable` para aprovechar memoria/disco; la caché puede ser desalojada por el sistema y no garantiza imágenes offline indefinidamente. Los datos completos de favoritos se conservan por separado en MMKV.

`CurrencyFormatter` tiene spec Codegen, implementación Kotlin/Swift y adaptador ObjC++. `formatPrice` delega al módulo cuando está registrado; `Intl` permite fallback cuando no existe (por ejemplo, en tests). Un error de un módulo registrado se propaga para no esconder defectos nativos. El formato monetario puede variar ligeramente entre sistemas. DummyJSON se presenta en USD; no se aplica conversión de divisas.

## Evidencia de la base (Fase 0)

Capturas reales del mismo código de base, antes de desarrollar catálogo y favoritos. [iOS aprobado](https://codemagic.io/app/6af632ef1de9516df029eb63/build/6af638c910a05158d81229d1) y [Android/CI aprobado](https://github.com/yhonaMC/mini-product/actions/runs/43316912477).

<img src="docs/screenshots/android-base-light.png" alt="Base Android en modo claro" width="220" /> <img src="docs/screenshots/android-base-dark.png" alt="Base Android en modo oscuro" width="220" /> <img src="docs/screenshots/ios-base.png" alt="Base iOS compilada en Codemagic" width="220" />
