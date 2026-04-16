# Risultati dei test automatizzati – Backend API

## Strategia di testing adottata

Per garantire la qualità e l'affidabilità del backend dell'applicazione DMlab è stata predisposta una suite di test automatizzati basata sul framework **pytest**, lo standard de facto per il testing in ambito Python. L'intera suite opera su un database SQLite in memoria, il che consente di eseguire i test in completo isolamento rispetto all'ambiente di produzione, senza necessità di avviare servizi esterni come PostgreSQL o Docker. Questa scelta progettuale assicura che ogni esecuzione parta da uno stato pulito e deterministico, rendendo i risultati pienamente riproducibili.

I test sono stati concepiti come **test di integrazione a livello di API**: ogni caso di test invia richieste HTTP reali al server Flask attraverso il test client fornito dal framework, verificando non soltanto i codici di stato delle risposte ma anche la struttura e la correttezza dei dati restituiti in formato JSON. In questo modo si valida l'intero flusso applicativo, dalla deserializzazione della richiesta fino alla serializzazione della risposta, passando per la logica di business, l'interazione con il database e i meccanismi di autenticazione e autorizzazione basati su JWT.

## Organizzazione dei test

La suite comprende **54 casi di test** organizzati in sette gruppi funzionali che rispecchiano i moduli dell'applicazione:

- **Autenticazione (8 test)** – Coprono la registrazione di nuovi utenti (inclusi i casi di errore per email duplicata, campi mancanti, password troppo corta e formato email non valido), il login con credenziali corrette e errate, e il recupero del profilo utente autenticato tramite token JWT.

- **Catalogo servizi (3 test)** – Verificano la corretta restituzione dell'elenco dei servizi sanitari offerti, il recupero di un singolo servizio per identificativo e la gestione del caso di servizio inesistente (HTTP 404).

- **Sedi, medici e disponibilità (7 test)** – Testano gli endpoint pubblici per la consultazione delle sedi cliniche, il filtraggio dei medici per sede e per servizio offerto, e la restituzione degli slot di disponibilità per un dato medico.

- **Prenotazioni lato utente (10 test)** – Validano l'intero ciclo di vita di una prenotazione dal punto di vista del paziente: creazione, visualizzazione delle proprie prenotazioni, modifica, cancellazione. Sono inclusi scenari negativi quali il tentativo di prenotazione senza autenticazione, con payload non valido, con un medico non abilitato al servizio scelto, la modifica da parte di un utente diverso dal proprietario (HTTP 403), la cancellazione di una prenotazione già completata (HTTP 400) e la modifica di una prenotazione già annullata.

- **Prenotazioni lato amministratore (8 test)** – Verificano le funzionalità riservate al personale della clinica: visualizzazione di tutte le prenotazioni con filtri per stato, intervallo di date, email dell'utente e nome del servizio; aggiornamento dello stato (con verifica che il passaggio a COMPLETED generi automaticamente un pagamento e un referto, e che il passaggio a CANCELLED rimuova il pagamento associato); gestione di stati non validi; e il corretto blocco dell'accesso per utenti non amministratori.

- **Referti (9 test)** – Coprono la lista dei referti dell'utente autenticato, il download (verificando che sia consentito al proprietario e all'amministratore ma negato a terzi), l'upload da parte dell'amministratore (inclusi i casi di file mancante e formato non PDF) e l'aggiornamento di un referto esistente.

- **Dashboard finanziaria (7 test)** – Testano l'aggregazione dei ricavi con granularità giornaliera, settimanale e mensile, il filtraggio per intervallo di date, la gestione di un periodo non valido e la protezione dell'endpoint da accessi non autorizzati o non amministrativi.

A completamento della suite, due test aggiuntivi verificano il corretto funzionamento dell'endpoint di health check e la restituzione di un errore 404 per rotte inesistenti.

## Metriche di copertura del codice

L'analisi della copertura è stata effettuata tramite il plugin **pytest-cov**, che si basa sulla libreria coverage.py. I risultati mostrano una copertura complessiva del **79 %** sull'intero pacchetto applicativo, calcolata su 770 istruzioni Python di cui 610 risultano eseguite durante i test.

Nel dettaglio, la copertura per modulo è la seguente:

| Modulo | Istruzioni | Non coperte | Copertura |
|---|---|---|---|
| Application factory (`__init__.py`) | 31 | 0 | 100 % |
| Configurazione (`config.py`) | 19 | 0 | 100 % |
| Estensioni (`extensions.py`) | 8 | 0 | 100 % |
| Modelli ORM (`models.py`) | 94 | 8 | 91 % |
| Schemi di validazione (`schemas.py`) | 75 | 0 | 100 % |
| Route autenticazione (`auth.py`) | 57 | 7 | 88 % |
| Route servizi (`services.py`) | 14 | 0 | 100 % |
| Route sedi e medici (`locations.py`) | 32 | 0 | 100 % |
| Route prenotazioni (`bookings.py`) | 197 | 46 | 77 % |
| Route referti (`reports.py`) | 115 | 20 | 83 % |
| Route finanza (`finance.py`) | 54 | 5 | 91 % |
| Script di seed (`seed_data.py`) | 74 | 74 | 0 % |
| **Totale** | **770** | **160** | **79 %** |

È opportuno osservare che il modulo `seed_data.py` è uno script di utilità utilizzato esclusivamente per popolare il database con dati dimostrativi e non contiene logica applicativa. Escludendo tale modulo dal computo, la copertura effettiva del codice applicativo sale a circa **88 %**, un valore che si colloca al di sopra della soglia dell'80 % comunemente considerata adeguata per progetti di media complessità.

Le istruzioni non coperte nei restanti moduli corrispondono prevalentemente a:
- metodi `__repr__` dei modelli ORM, utilizzati esclusivamente per il debug interattivo;
- rami di gestione di errori di parsing del token JWT (`TypeError`/`ValueError`), che richiederebbero la costruzione manuale di token malformati;
- alcune combinazioni di filtri e aggiornamenti simultanei negli endpoint di prenotazione che rappresentano percorsi di esecuzione meno frequenti.

## Considerazioni conclusive

I risultati ottenuti dimostrano che la suite di test copre in modo esaustivo i principali flussi funzionali dell'applicazione, includendo sia gli scenari di successo (*happy path*) sia i casi di errore e le verifiche di sicurezza relative al controllo degli accessi basato sui ruoli. L'adozione di un database in memoria garantisce tempi di esecuzione contenuti (circa 70–80 secondi per l'intera suite) e la completa indipendenza dall'infrastruttura, rendendo i test idonei all'integrazione in una pipeline di Continuous Integration. Il tasso di copertura raggiunto, pari all'88 % del codice applicativo, fornisce un livello di confidenza elevato sulla correttezza del sistema e costituisce una solida base per eventuali evoluzioni future del progetto.
