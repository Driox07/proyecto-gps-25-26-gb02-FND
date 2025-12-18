import os
"""
ES IMPORTANTE CONFIGURAR CORRECTAMENTE ESTAS DIRECCIONES, PARA ASEGURAR 
EL CORRECTO FUNCIONAMIENTO DE LA PLATAFORMA.

TAMBIÉN ES IMPORTANTE ACCEDER A CADA SERVICIO DESDE LA MISMA IP QUE AQUÍ FIGURA
PARA ASEGURAR EL CORRECTO FUNCIONAMIENTO DE LAS COOKIES DEL SITIO.
"""

FND = os.getenv('HOST_FND', 'http://localhost:8000') # Frontend
SYU = os.getenv('HOST_SYU', 'http://localhost:8080') # Servicio de Usuarios y Sesiones
TYA = os.getenv('HOST_TYA', 'http://localhost:8081') # Servicio de Temas y Autores
TPP = os.getenv('HOST_TPP', 'http://localhost:8082') # Tienda y pasarela de pago
PT  = os.getenv('HOST_PT',  'http://localhost:8083') # Proveedor de tracks
RYE = os.getenv('HOST_RYE', 'http://localhost:8084') # Recomendaciones y Estadísticas