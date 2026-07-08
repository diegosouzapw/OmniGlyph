# Política de seguridad

## Reportar vulnerabilidades

Abre un aviso de seguridad privado en GitHub
(<https://github.com/diegosouzapw/OmniGlyph/security/advisories/new>) o
contacta al mantenedor directamente (diegosouza.pw@outlook.com). No abras un
issue público para una vulnerabilidad explotable.

## Modelo de amenaza (qué es OmniGlyph)

OmniGlyph es un **proxy local** entre tu cliente (p. ej. Claude Code) y las
APIs del LLM. Por diseño, ve todo el contenido de tu sesión y tus credenciales
en tránsito. Las decisiones de seguridad correspondientes:

- **Se enlaza a loopback por defecto** (`127.0.0.1`): el dashboard no tiene
  autenticación y sirve el contexto de sesión capturado (texto fuente de las
  imágenes, telemetría). `HOST=0.0.0.0` es un opt-in explícito y expone todo
  eso a la red — úsalo solo en una red de confianza.
- **Credenciales**: el proxy reenvía las cabeceras de auth del cliente al
  upstream y no las persiste. Las claves suministradas por env
  (`ANTHROPIC_API_KEY`, etc.) permanecen en memoria.
- **Telemetría local**: `~/.omniglyph/events.jsonl` contiene metadata por
  request (conteos de tokens, hashes de cuerpo) y, en errores 4xx, muestras
  comprimidas del cuerpo — trata el archivo como sensible.
- **El contenido convertido en imagen es lossy**: los valores byte-exactos
  (secretos, hashes) nunca deben depender de lecturas de imagen; el pipeline
  los mantiene como texto, pero la regla de oro es: no pongas secretos en el
  contexto del LLM.
- **Cadena de suministro**: `pnpm-workspace.yaml` impone un `minimumReleaseAge`
  de 3 días para cualquier paquete nuevo; el core tiene una sola dependencia
  de runtime.

## Versiones soportadas

Solo la línea de release más reciente (`main` / la `v1.x` más reciente) recibe
correcciones.
