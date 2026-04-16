# Risultati dei test automatizzati – Frontend

## Strategia di testing adottata

Il frontend dell'applicazione DMlab è stato sottoposto a una suite di test automatizzati basata su **Vitest**, il test runner nativo dell'ecosistema Vite, in combinazione con **React Testing Library**, la libreria di riferimento per il testing di componenti React secondo l'approccio orientato all'utente. L'ambiente di esecuzione utilizza **jsdom** per simulare un DOM browser completo all'interno di Node.js, consentendo il rendering e l'interrogazione dei componenti senza la necessità di un browser reale.

Un file di setup (`setup.ts`) configura i matcher estesi di `@testing-library/jest-dom` (come `toBeInTheDocument`) e fornisce un polyfill per `window.matchMedia`, necessario per i componenti che utilizzano media query CSS. Tutti i test dei componenti si avvalgono di un helper condiviso (`renderWithProviders`) che incapsula ciascun componente all'interno dei provider necessari: `MemoryRouter` per la navigazione, `QueryClientProvider` per la gestione delle query asincrone e `AuthProvider` per il contesto di autenticazione. Il modulo API è interamente mockato tramite `vi.mock`, garantendo che nessuna chiamata HTTP reale venga effettuata durante l'esecuzione dei test.

## Organizzazione dei test

La suite comprende **27 casi di test** distribuiti in tre file:

### Test unitari delle utility (`utils.test.ts` – 8 test)

Questi test verificano le funzioni pure del progetto, prive di dipendenze dal DOM o da contesti React:

- **Utility `cn`** (3 test) – La funzione di merge delle classi Tailwind CSS viene testata per la concatenazione base, la risoluzione dei conflitti (l'ultima classe vince) e la gestione delle classi condizionali con valori falsy.
- **Funzione `getServiceBySlug`** (4 test) – Verifica il recupero corretto di un servizio dato il suo slug, la restituzione di `undefined` per slug inesistenti, la presenza di almeno un servizio nel dataset e l'integrità strutturale di ogni servizio (slug, nome e lista visite non vuota).
- **Classe `ApiError`** (1 test) – Conferma che l'errore personalizzato del client API memorizzi correttamente codice di stato, messaggio e corpo della risposta, e che sia un'istanza di `Error`.

### Test dei componenti (`components.test.tsx` – 18 test)

Questi test verificano il rendering corretto dei componenti principali dell'interfaccia utente:

- **Navbar** (5 test) – Presenza del brand "DMLAB", delle voci di navigazione (Chi siamo, Servizi, Sedi, Contatti), del pulsante "Prenota ora", del link "Area Riservata" per utenti non autenticati e delle informazioni di contatto (numero di telefono).
- **Footer** (4 test) – Rendering del brand con copyright, della sezione contatti (telefono, email), delle sedi cliniche e dei link utili (Prenota online, Privacy Policy).
- **Pagina 404** (1 test) – Visualizzazione del titolo "404", del messaggio di errore e del link per tornare alla home.
- **ProtectedRoute** (1 test) – Verifica che un utente non autenticato venga reindirizzato alla pagina di login e che il contenuto protetto non sia visibile.
- **LoginPage** (3 test) – Presenza dei campi email e password con le relative label, del link alla pagina di registrazione e del pulsante di invio.
- **RegisterPage** (3 test) – Presenza dei campi nome, email e password, del link alla pagina di login e del pulsante "Crea account".

### Test di sanità (`example.test.ts` – 1 test)

Un singolo test di verifica che conferma il corretto funzionamento della configurazione Vitest.

## Risultati

L'esecuzione della suite ha prodotto i seguenti risultati:

| File | Test | Esito | Durata |
|---|---|---|---|
| `example.test.ts` | 1 | 1 passato | 2 ms |
| `utils.test.ts` | 8 | 8 passati | 18 ms |
| `components.test.tsx` | 18 | 18 passati | 1.243 ms |
| **Totale** | **27** | **27 passati** | **2,87 s** |

Tutti i 27 test sono stati superati con successo. I test unitari delle utility si completano in pochi millisecondi, confermando la natura leggera e deterministica di queste verifiche. I test dei componenti richiedono tempi leggermente superiori (da 19 ms a 112 ms per singolo test) a causa del rendering del DOM virtuale e della risoluzione dei provider React, ma l'intera suite si completa in meno di 3 secondi, un tempo pienamente compatibile con l'integrazione in una pipeline di Continuous Integration.

## Considerazioni

La suite di test frontend adotta un approccio pragmatico che privilegia la verifica del comportamento visibile all'utente rispetto ai dettagli implementativi interni. Utilizzando React Testing Library, i test interrogano il DOM attraverso testi, label e ruoli ARIA, simulando il modo in cui un utente reale interagisce con l'interfaccia. Questo approccio rende i test più robusti rispetto ai cambiamenti di implementazione e più significativi dal punto di vista della qualità dell'esperienza utente.

Il mock completo del modulo API garantisce l'isolamento dei test dal backend, eliminando la variabilità introdotta dalle chiamate di rete e consentendo l'esecuzione della suite anche in assenza di un server attivo. La copertura dei componenti principali (navigazione, footer, pagine di autenticazione e protezione delle rotte) assicura che le funzionalità più critiche dell'interfaccia siano verificate automaticamente ad ogni modifica del codice.
