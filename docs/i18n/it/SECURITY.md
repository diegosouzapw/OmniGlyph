# Politica di sicurezza

## Segnalazione di vulnerabilità

Apri un avviso di sicurezza privato su GitHub
(<https://github.com/diegosouzapw/OmniGlyph/security/advisories/new>) oppure
contatta direttamente il maintainer (diegosouza.pw@outlook.com). Non aprire
una issue pubblica per una vulnerabilità sfruttabile.

## Modello di minaccia (cos'è OmniGlyph)

OmniGlyph è un **proxy locale** tra il tuo client (es. Claude Code) e le API
LLM. Per design vede tutto il contenuto della tua sessione e le tue
credenziali in transito. Le relative decisioni di sicurezza:

- **Si lega al loopback per default** (`127.0.0.1`): il dashboard non ha
  autenticazione e serve il contesto della sessione catturata (testo
  sorgente delle immagini, telemetria). `HOST=0.0.0.0` è un opt-in esplicito
  ed espone tutto ciò alla rete — usalo solo su una rete fidata.
- **Credenziali**: il proxy inoltra gli header di autenticazione del client
  all'upstream e non li persiste. Le chiavi fornite via variabili
  d'ambiente (`ANTHROPIC_API_KEY` ecc.) restano in memoria.
- **Telemetria locale**: `~/.omniglyph/events.jsonl` contiene metadati per
  richiesta (conteggi di token, hash del corpo) e, su errori 4xx, campioni
  compressi del corpo — considera il file come sensibile.
- **Il contenuto trasformato in immagine è lossy**: i valori byte-esatti
  (segreti, hash) non devono mai dipendere da letture di immagini; la
  pipeline li mantiene come testo, ma la regola aurea è: non mettere segreti
  nel contesto LLM.
- **Supply chain**: `pnpm-workspace.yaml` impone un `minimumReleaseAge` di
  3 giorni per ogni nuovo pacchetto; il core ha una singola dipendenza
  runtime.

## Versioni supportate

Solo l'ultima linea di release (`main` / `v1.x` più recente) riceve fix.
