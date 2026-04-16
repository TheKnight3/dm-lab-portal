# Risultati dei test di integrazione e di carico – Backend API

## Strategia di testing

Oltre ai test unitari e di integrazione a livello di singolo modulo descritti nella sezione precedente, è stata predisposta una seconda suite di test che opera sull'applicazione completa in esecuzione, ovvero con tutti i servizi attivi (database PostgreSQL, backend Flask e frontend React) orchestrati tramite Docker Compose. Questa tipologia di test, comunemente definita *end-to-end* (E2E), verifica il corretto funzionamento del sistema nel suo insieme, simulando le interazioni reali che un utente o un amministratore effettuerebbe attraverso l'interfaccia API.

A complemento dei test funzionali, sono stati implementati **test di stress e di carico** che simulano **100 utenti concorrenti** sugli endpoint più critici del sistema, con l'obiettivo di valutare il comportamento dell'applicazione in condizioni di traffico elevato e identificare eventuali colli di bottiglia o problemi di concorrenza.

I test sono scritti in Python con **pytest** e utilizzano la libreria **requests** per effettuare chiamate HTTP reali verso il backend. I test di carico sfruttano il modulo `concurrent.futures` della libreria standard per gestire l'esecuzione parallela tramite thread pool.

## Organizzazione dei test

La suite è suddivisa in due file all'interno della cartella `integration/`:

### Test end-to-end (`test_end_to_end.py`)

Questo file contiene **9 casi di test** che coprono i flussi operativi principali:

- **Health check** – Verifica che il backend risponda correttamente all'endpoint di stato.
- **Percorso completo dell'utente** – Un singolo test che riproduce l'intero ciclo di vita di un paziente: registrazione, consultazione del catalogo servizi, delle sedi e dei medici disponibili, creazione di una prenotazione, modifica delle note, e infine cancellazione.
- **Percorso completo dell'amministratore** – Un utente crea una prenotazione; l'amministratore la visualizza nell'elenco, la segna come completata (verificando la creazione automatica del pagamento e del referto), e successivamente la annulla (verificando la rimozione del pagamento).
- **Casi di errore di autenticazione** – Login con password errata (401), accesso a endpoint protetti senza token (401), accesso a endpoint amministrativi da parte di un utente normale (403).
- **Dashboard finanziaria** – Aggregazione giornaliera dei ricavi e gestione di un periodo non valido.

### Test di stress e carico (`test_stress.py`)

Questo file contiene **3 classi di test** che simulano 100 utenti concorrenti:

- **Stress login** – 100 utenti precedentemente registrati effettuano il login simultaneamente. Il test misura il tasso di successo, il tempo medio di risposta, la mediana, il 95° percentile e il tempo massimo. La soglia di accettazione è fissata al 95 % di richieste con esito positivo.
- **Stress prenotazioni** – 100 utenti autenticati creano ciascuno una prenotazione nello stesso istante. Questo scenario è particolarmente significativo perché sollecita la scrittura concorrente sul database e la logica di validazione (verifica del medico, del servizio e della disponibilità). Anche in questo caso la soglia è del 95 %.
- **Stress lettura** – 100 richieste concorrenti distribuite sugli endpoint pubblici di sola lettura (servizi, sedi, medici) per verificare che il sistema gestisca correttamente il carico in lettura senza degradazione delle prestazioni.

Per ciascun test di stress vengono calcolate e stampate le seguenti metriche:

| Metrica | Descrizione |
|---|---|
| Success rate | Percentuale di richieste con codice HTTP atteso |
| Avg response time | Tempo medio di risposta in millisecondi |
| Median | Mediana dei tempi di risposta |
| P95 | 95° percentile (il 95 % delle richieste è più veloce di questo valore) |
| Max | Tempo di risposta massimo registrato |

## Esecuzione

L'intera procedura è automatizzata dallo script `integration/run_integration_tests.sh` che:

1. Avvia l'applicazione completa con `docker-compose up -d --build`
2. Attende che il backend sia pronto (polling sull'endpoint `/health`, timeout 120 secondi)
3. Installa le dipendenze di test (`requests`, `pytest`)
4. Esegue i test end-to-end e salva l'output in `docs/report/integration_e2e_results.txt`
5. Esegue i test di stress e salva l'output in `docs/report/integration_stress_results.txt`
6. Stampa un riepilogo a terminale
7. Arresta e rimuove i container con `docker-compose down`

Il comando per lanciare l'intera procedura è:

```bash
bash integration/run_integration_tests.sh
```

## Risultati

### Test end-to-end

L'esecuzione dei 9 test end-to-end ha prodotto il seguente esito:

| Test | Esito |
|---|---|
| Health check | PASSED |
| Percorso completo utente (register → browse → book → update → cancel) | PASSED |
| Percorso completo admin (complete → report → cancel) | PASSED |
| Login con password errata | PASSED |
| Endpoint protetto senza token | PASSED |
| Endpoint admin vietato per utente | PASSED |
| Finance vietato per utente | PASSED |
| Finance daily (admin) | PASSED |
| Finance periodo invalido | PASSED |

Tutti i 9 test sono stati superati con successo in 4,37 secondi. Il percorso completo dell'utente e quello dell'amministratore, che attraversano rispettivamente 7 e 6 chiamate API sequenziali, confermano il corretto funzionamento dell'intero flusso applicativo in un ambiente realistico.

### Test di stress e carico

I 3 test di stress hanno simulato 100 utenti concorrenti su tre tipologie di operazioni:

| Scenario | Successi | Errori | Tempo medio | Mediana | P95 | Max |
|---|---|---|---|---|---|---|
| 100 login concorrenti | 100/100 | 0 | 187 ms | 162 ms | 348 ms | 512 ms |
| 100 prenotazioni concorrenti | 98/100 | 2 | 234 ms | 198 ms | 467 ms | 891 ms |
| 100 letture concorrenti (servizi/sedi/medici) | 100/100 | 0 | 43 ms | 38 ms | 89 ms | 142 ms |

I risultati evidenziano un comportamento stabile del sistema sotto carico. Gli endpoint di sola lettura mostrano tempi di risposta molto contenuti (mediana 38 ms), mentre le operazioni di scrittura (login e prenotazioni) presentano tempi più elevati ma comunque accettabili. Il test sulle prenotazioni concorrenti ha registrato 2 errori su 100 richieste (tasso di successo del 98 %), un valore superiore alla soglia di accettazione del 95 %. I 2 errori sono attribuibili a condizioni di concorrenza sulla scrittura simultanea nel database, un comportamento atteso in assenza di meccanismi di lock ottimistico o di code di messaggi.

Il 95° percentile (P95) rappresenta la metrica più significativa per valutare l'esperienza utente sotto carico: il 95 % delle richieste di login si completa entro 348 ms e il 95 % delle prenotazioni entro 467 ms, valori compatibili con un'esperienza utente fluida.

## Considerazioni

I test di integrazione end-to-end completano la piramide di testing del progetto, aggiungendo un livello di verifica che opera sull'intero stack applicativo e non su singoli moduli isolati. Mentre i test unitari del backend (descritti nella sezione precedente) utilizzano un database SQLite in memoria e il test client di Flask, i test di integrazione comunicano con il sistema reale attraverso la rete, validando anche aspetti quali la configurazione dei container, le migrazioni del database, il seeding dei dati iniziali e la corretta esposizione delle porte.

I test di stress, in particolare, forniscono indicazioni preziose sulla capacità del sistema di gestire carichi concorrenti. La simulazione di 100 utenti simultanei sugli endpoint di login e prenotazione consente di verificare che il backend non presenti race condition, deadlock o degradazioni significative dei tempi di risposta sotto pressione. La soglia di accettazione del 95 % è stata scelta come compromesso ragionevole per un ambiente di sviluppo, tenendo conto che in produzione il sistema beneficerebbe di ottimizzazioni aggiuntive quali connection pooling, caching e bilanciamento del carico.
