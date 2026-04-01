┌─ app.js (ENTRADA)
│   └─ Inicializa la aplicación
│   └─ Conecta eventos click (botones HTML → funciones JavaScript)
│
├─ router.js (NAVEGACIÓN)
│   └─ Controla qué vista mostrar según la URL (#/login, #/store, #/cart, etc)
│   └─ Protege rutas (si no estás autenticado no puedes entrar)
│
├─ state.js (MEMORIA DE LA APP)
│   └─ Guarda: usuario actual, token autenticación, carrito
│   └─ Funciones: login, logout, agregar a carrito, actualizar cantidades
│   └─ Notifica a las vistas cuando algo cambia
│
├─ api.js (COMUNICACIÓN CON BACKEND)
│   └─ Hace las peticiones HTTP (GET, POST) a tu servidor Python
│   └─ Ahora usa URLs simuladas (MOCK) pero se cambia a real
│   └─ Maneja errores automáticamente
│
└─ views/ (LAS PANTALLAS)
    ├─ loginview.js → Pantalla de login
    ├─ registerview.js → Pantalla de registro
    ├─ storeview.js → Lista de categorías
    ├─ productsview.js → Productos de una categoría
    ├─ cartview.js → Tu carrito
    ├─ checkoutview.js → Compra final
    └─ adminview.js → Panel admin