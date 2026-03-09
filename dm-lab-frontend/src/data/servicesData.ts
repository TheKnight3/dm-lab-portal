import {
  Microscope,
  Heart,
  Stethoscope,
  Baby,
  Brain,
  Bone,
  Eye,
  Syringe,
  type LucideIcon,
} from "lucide-react";

export interface ServiceVisit {
  name: string;
  description: string;
}

export interface ServiceDetail {
  slug: string;
  name: string;
  shortDesc: string;
  icon: LucideIcon;
  heroDescription: string;
  whatIs: string;
  whenNeeded: string;
  howItWorks: string;
  preparation?: string;
  visits: ServiceVisit[];
}

export const servicesData: ServiceDetail[] = [
  {
    slug: "analisi-di-laboratorio",
    name: "Analisi di Laboratorio",
    shortDesc: "Esami del sangue, urine e diagnostica molecolare con tecnologie all'avanguardia.",
    icon: Microscope,
    heroDescription: "Diagnostica di laboratorio completa con risultati rapidi e affidabili.",
    whatIs: "Le analisi di laboratorio comprendono un insieme di esami diagnostici eseguiti su campioni biologici (sangue, urine, tessuti) per valutare lo stato di salute del paziente, diagnosticare patologie e monitorare l'efficacia delle terapie in corso.",
    whenNeeded: "Le analisi di laboratorio sono indicate in caso di check-up periodici, sospetto di patologie, monitoraggio di malattie croniche, preparazione a interventi chirurgici e durante la gravidanza.",
    howItWorks: "Il prelievo viene eseguito in ambulatorio da personale qualificato, generalmente al mattino a digiuno. I campioni vengono analizzati con strumentazioni di ultima generazione e i risultati sono disponibili in 24-48 ore.",
    preparation: "Si consiglia il digiuno da almeno 8-12 ore prima del prelievo. È importante comunicare al medico eventuali farmaci in assunzione.",
    visits: [
      { name: "Emocromo completo", description: "Analisi completa dei componenti del sangue." },
      { name: "Glicemia", description: "Misurazione dei livelli di glucosio nel sangue." },
      { name: "Profilo lipidico", description: "Colesterolo totale, HDL, LDL e trigliceridi." },
      { name: "Esame urine completo", description: "Analisi chimico-fisica e microscopica delle urine." },
      { name: "Funzionalità epatica", description: "Transaminasi, bilirubina e altri marker epatici." },
      { name: "Funzionalità renale", description: "Creatinina, azotemia e filtrato glomerulare." },
      { name: "Markers tumorali", description: "PSA, CEA, CA 125 e altri indicatori oncologici." },
      { name: "Esami ormonali", description: "Tiroide, ormoni sessuali e cortisolo." },
    ],
  },
  {
    slug: "cardiologia",
    name: "Cardiologia",
    shortDesc: "Visite specialistiche, ECG, ecocardiogramma e monitoraggio cardiaco.",
    icon: Heart,
    heroDescription: "Prevenzione, diagnosi e cura delle patologie cardiovascolari.",
    whatIs: "La visita cardiologica è la visita specialistica finalizzata a produrre una diagnosi relativa a un eventuale problema che riguarda il cuore. Comprende l'anamnesi, l'esame obiettivo e eventuali esami strumentali.",
    whenNeeded: "La visita cardiologica viene consigliata nei casi in cui il paziente lamenti sintomi quali dolore toracico, respirazione faticosa a riposo o sotto sforzo, svenimento, giramenti di capo, palpitazioni o riduzione della forza in generale.",
    howItWorks: "La visita cardiologica con elettrocardiogramma si compone principalmente di due momenti: il primo riguarda la raccolta di informazioni da parte del medico cardiologo, il secondo consiste in un esame clinico riguardante l'apparato cardiovascolare.",
    preparation: "Non sono previste norme di preparazione specifiche. Si consiglia di portare eventuali esami precedenti e la lista dei farmaci assunti.",
    visits: [
      { name: "Visita cardiologica", description: "Valutazione completa dello stato cardiovascolare." },
      { name: "Elettrocardiogramma (ECG)", description: "Registrazione dell'attività elettrica del cuore." },
      { name: "Ecocardiogramma", description: "Ecografia del cuore per valutare struttura e funzione." },
      { name: "Holter ECG 24h", description: "Monitoraggio continuo del ritmo cardiaco per 24 ore." },
      { name: "Holter pressorio", description: "Misurazione della pressione arteriosa nelle 24 ore." },
      { name: "Test da sforzo", description: "Valutazione della funzionalità cardiaca sotto sforzo." },
    ],
  },
  {
    slug: "medicina-generale",
    name: "Medicina Generale",
    shortDesc: "Check-up completi, visite preventive e certificazioni mediche.",
    icon: Stethoscope,
    heroDescription: "Assistenza sanitaria primaria per la tua salute quotidiana.",
    whatIs: "La medicina generale si occupa della prevenzione, diagnosi e trattamento delle patologie più comuni. Il medico di medicina generale è il primo punto di riferimento per qualsiasi problema di salute.",
    whenNeeded: "È consigliata per check-up annuali, sintomi generali come febbre, stanchezza, dolori diffusi, oppure per ottenere certificazioni mediche per attività sportive o lavorative.",
    howItWorks: "La visita prevede un'anamnesi approfondita, un esame obiettivo completo e, se necessario, la prescrizione di esami diagnostici o l'invio a specialisti.",
    visits: [
      { name: "Check-up completo", description: "Visita generale con esami di base inclusi." },
      { name: "Visita preventiva", description: "Valutazione dello stato di salute generale." },
      { name: "Certificato medico sportivo", description: "Certificazione per attività sportive non agonistiche." },
      { name: "Certificato medico lavoro", description: "Certificazione di idoneità lavorativa." },
      { name: "Visita domiciliare", description: "Assistenza medica a domicilio per pazienti non deambulanti." },
    ],
  },
  {
    slug: "neurologia",
    name: "Neurologia",
    shortDesc: "Visite neurologiche, EEG e percorsi diagnostici specializzati.",
    icon: Brain,
    heroDescription: "Diagnosi e trattamento delle patologie del sistema nervoso.",
    whatIs: "La neurologia si occupa dello studio e del trattamento delle malattie del sistema nervoso centrale e periferico. La visita neurologica valuta le funzioni cerebrali, il sistema motorio, la sensibilità e i riflessi.",
    whenNeeded: "È indicata in caso di cefalee ricorrenti, vertigini, tremori, disturbi della memoria, formicolii, debolezza muscolare o episodi di perdita di coscienza.",
    howItWorks: "La visita comprende un'anamnesi dettagliata e un esame neurologico obiettivo. Possono essere prescritti esami strumentali come EEG, EMG o risonanza magnetica.",
    visits: [
      { name: "Visita neurologica", description: "Valutazione completa del sistema nervoso." },
      { name: "Elettroencefalogramma (EEG)", description: "Registrazione dell'attività elettrica cerebrale." },
      { name: "Elettromiografia (EMG)", description: "Studio della conduzione nervosa e muscolare." },
      { name: "Visita per cefalee", description: "Percorso diagnostico dedicato alle cefalee croniche." },
      { name: "Valutazione cognitiva", description: "Test neuropsicologici per disturbi della memoria." },
    ],
  },
  {
    slug: "ginecologia",
    name: "Ginecologia",
    shortDesc: "Visite ginecologiche, ecografie e screening prenatali.",
    icon: Baby,
    heroDescription: "Assistenza completa per la salute della donna in ogni fase della vita.",
    whatIs: "La ginecologia si occupa della salute dell'apparato riproduttivo femminile. La visita ginecologica comprende l'anamnesi, l'esame obiettivo e, se necessario, ecografia transvaginale e pap test.",
    whenNeeded: "La visita ginecologica è consigliata almeno una volta l'anno per screening preventivi, in caso di irregolarità mestruali, dolore pelvico, oppure durante la gravidanza.",
    howItWorks: "La visita si svolge in ambulatorio e comprende un colloquio iniziale, l'esame obiettivo e eventuali esami strumentali. La durata media è di 30-45 minuti.",
    visits: [
      { name: "Visita ginecologica", description: "Controllo completo dell'apparato riproduttivo." },
      { name: "Pap test", description: "Screening per la prevenzione del tumore al collo dell'utero." },
      { name: "Ecografia pelvica", description: "Visualizzazione degli organi pelvici tramite ultrasuoni." },
      { name: "Ecografia ostetrica", description: "Monitoraggio della gravidanza e sviluppo fetale." },
      { name: "Colposcopia", description: "Esame approfondito del collo dell'utero." },
      { name: "Consulenza prenatale", description: "Percorso di accompagnamento alla gravidanza." },
    ],
  },
  {
    slug: "ortopedia",
    name: "Ortopedia",
    shortDesc: "Visite ortopediche, radiografie e percorsi riabilitativi.",
    icon: Bone,
    heroDescription: "Diagnosi e cura delle patologie dell'apparato muscolo-scheletrico.",
    whatIs: "L'ortopedia è la branca della medicina che si occupa delle patologie dell'apparato locomotore: ossa, articolazioni, muscoli, tendini e legamenti.",
    whenNeeded: "È indicata in caso di dolori articolari o muscolari, traumi, limitazione dei movimenti, deformità scheletriche o per valutazioni post-operatorie.",
    howItWorks: "La visita comprende l'esame clinico, la valutazione della mobilità articolare e, se necessario, esami radiologici. Il medico può prescrivere terapie farmacologiche, fisioterapiche o chirurgiche.",
    visits: [
      { name: "Visita ortopedica", description: "Valutazione completa dell'apparato muscolo-scheletrico." },
      { name: "Radiografia", description: "Imaging per valutare ossa e articolazioni." },
      { name: "Ecografia muscolo-tendinea", description: "Studio ecografico di muscoli e tendini." },
      { name: "Visita fisiatrica", description: "Valutazione per percorsi riabilitativi." },
      { name: "Infiltrazioni articolari", description: "Trattamento con acido ialuronico o cortisone." },
    ],
  },
  {
    slug: "oculistica",
    name: "Oculistica",
    shortDesc: "Visite oculistiche, esami del campo visivo e tonometria.",
    icon: Eye,
    heroDescription: "Prevenzione e cura delle patologie oculari con tecnologie avanzate.",
    whatIs: "L'oculistica si occupa della diagnosi e del trattamento delle malattie dell'occhio e degli annessi oculari. La visita oculistica comprende la misurazione dell'acuità visiva, l'esame del fondo oculare e la misurazione della pressione intraoculare.",
    whenNeeded: "È consigliata per controlli periodici (almeno ogni 2 anni), in caso di calo della vista, arrossamento, dolore oculare, o per screening del glaucoma e della degenerazione maculare.",
    howItWorks: "La visita si svolge in ambulatorio con strumentazioni dedicate. Può includere la dilatazione della pupilla per l'esame del fondo oculare, con durata media di 30-40 minuti.",
    preparation: "In caso di dilatazione pupillare, si consiglia di non guidare per le 2-3 ore successive alla visita.",
    visits: [
      { name: "Visita oculistica completa", description: "Esame completo della funzione visiva." },
      { name: "Esame del campo visivo", description: "Mappatura della visione periferica." },
      { name: "Tonometria", description: "Misurazione della pressione intraoculare." },
      { name: "Fondo oculare", description: "Esame delle strutture posteriori dell'occhio." },
      { name: "Pachimetria corneale", description: "Misurazione dello spessore della cornea." },
      { name: "OCT retinico", description: "Tomografia ottica della retina ad alta risoluzione." },
    ],
  },
  {
    slug: "vaccinazioni",
    name: "Vaccinazioni",
    shortDesc: "Vaccini per adulti e bambini, consulenza vaccinale personalizzata.",
    icon: Syringe,
    heroDescription: "Servizio vaccinale completo per la protezione di tutta la famiglia.",
    whatIs: "Il servizio vaccinale offre la somministrazione di vaccini per adulti e bambini, con consulenza personalizzata basata sull'età, lo stato di salute e le esigenze di viaggio del paziente.",
    whenNeeded: "Le vaccinazioni sono indicate per la prevenzione di malattie infettive, sia nell'ambito del calendario vaccinale nazionale sia per esigenze specifiche come viaggi internazionali o condizioni di rischio.",
    howItWorks: "La seduta prevede un breve colloquio con il medico per valutare eventuali controindicazioni, la somministrazione del vaccino e un periodo di osservazione di 15-30 minuti.",
    visits: [
      { name: "Vaccino antinfluenzale", description: "Protezione stagionale contro i virus influenzali." },
      { name: "Vaccino anti-COVID", description: "Vaccinazione e richiami per SARS-CoV-2." },
      { name: "Vaccino anti-HPV", description: "Prevenzione del papilloma virus umano." },
      { name: "Vaccino anti-tetanico", description: "Richiamo per la protezione contro il tetano." },
      { name: "Vaccinazioni per viaggi", description: "Profilassi per destinazioni internazionali a rischio." },
      { name: "Consulenza vaccinale", description: "Piano vaccinale personalizzato con il medico." },
    ],
  },
];

export function getServiceBySlug(slug: string): ServiceDetail | undefined {
  return servicesData.find((s) => s.slug === slug);
}
