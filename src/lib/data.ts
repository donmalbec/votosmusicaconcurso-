 // Types
export interface Video {
  id: string;
  title: string;
  artist: string;
  youtubeId: string;
  aiPercentage: number;
  description: string;
  genre: string;
}

export interface VoteRecord {
  id: string;
  email: string;
  videoId: string;
  ip: string;
  timestamp: string;
  videoTitle: string;
  artist: string;
  deviceId: string;
}

// Blocked temporary email domains
export const BLOCKED_DOMAINS = [
  "tempmail.com", "10minutemail.com", "guerrillamail.com", "mailinator.com",
  "throwaway.email", "yopmail.com", "trashmail.com", "fakeinbox.com",
  "maildrop.cc", "dispostable.com", "sharklasers.com", "guerrillamailblock.com",
  "grr.la", "guerrillamail.info", "guerrillamail.biz", "guerrillamail.de",
  "guerrillamail.net", "guerrillamail.org", "spam4.me", "binkmail.com",
  "bob.email", "clrmail.com", "discard.email", "filzmail.com",
  "flyspam.com", "get2mail.fr", "getonemail.com", "hatespam.org",
  "inboxclean.com", "laoeq.com", "mt2009.com", "no-spam.ws",
  "nobulk.com", "noclickemail.com", "nogmailspam.info", "nomail2me.com",
  "nwldx.com", "pecinan.com", "programmeateur.com", "proxymail.eu",
  "rcpt.at", "sf-e.ch", "smarttalent.pw", "spamoff.de",
  "tempinbox.co.uk", "tempinbox.com", "tempomail.fr", "temporaryemail.net",
  "thanksnospam.info", "trashdevil.com", "trashdevil.de", "trbvm.com",
  "wegwerfadresse.de", "wegwerfemail.de", "wegwerfmail.de", "wegwerfmail.info",
  "wegwerfmail.net", "wegwerfmail.org", "wh4f.org", "whyspam.me",
  "willhackforfood.biz", "wuzup.net", "xemaps.com", "xent.com",
  "xmaily.com", "xoxy.net"
];

// Real contest participants
export const VIDEOS: Video[] = [
  {
    id: "v1",
    youtubeId: "Vl88Y1nKjvU",
    title: "Esto es PizzaDao",
    artist: "MelitzagMusic y MHA",
    aiPercentage: 15,
    description: "Himno oficial con ritmos urbanos y esencia de comunidad.",
    genre: "Urbano / Trap"
  },
  {
    id: "v2",
    youtubeId: "y2KBz8ghU2U",
    title: "Maratón de Pizza",
    artist: "Canto de Río",
    aiPercentage: 0,
    description: "Una oda acústica a las largas noches de pizza y música.",
    genre: "Folk / Acústico"
  },
  {
    id: "v3",
    youtubeId: "3ht83Y0UaLc",
    title: "Modo Avión",
    artist: "Canto de Río",
    aiPercentage: 5,
    description: "Desconexión total para disfrutar del momento PizzaDAO.",
    genre: "Indie / Pop"
  },
  {
    id: "v4",
    youtubeId: "q6G2iw1eWeU",
    title: "Shud b Free",
    artist: "Tony Sky x Davi Ruiz x Los Onchain",
    aiPercentage: 25,
    description: "Libertad financiera y descentralización en cada beat.",
    genre: "Hip Hop / Onchain"
  },
  {
    id: "v5",
    youtubeId: "1w8UztilybA",
    title: "Bitcoin Legend",
    artist: "Joan Barbosa",
    aiPercentage: 40,
    description: "La leyenda de la moneda que lo cambió todo.",
    genre: "Electronic / Synth"
  },
  {
    id: "v6",
    youtubeId: "Ad9xfczI5qI",
    title: "Zappi Infinita",
    artist: "Driado",
    aiPercentage: 85,
    description: "Exploración sonora generada masivamente por IA.",
    genre: "Experimental / AI"
  },
  {
    id: "v7",
    youtubeId: "mjsWcoY4XDc",
    title: "Apolo Bacco - GPP",
    artist: "Apolo Bacco ft. LuckyKid",
    aiPercentage: 20,
    description: "Flow elegante para el Global Pizza Party.",
    genre: "R&B / Soul"
  },
  {
    id: "v8",
    youtubeId: "_53NfyQIpzs",
    title: "Pizza Gratis",
    artist: "La Macabrita",
    aiPercentage: 10,
    description: "Ritmos latinos celebrando la generosidad de la DAO.",
    genre: "Latin / Party"
  },
  {
    id: "v9",
    youtubeId: "ak4hKidZoH8",
    title: "Solo unas Pizzas",
    artist: "Marco Crypto",
    aiPercentage: 35,
    description: "Historias de blockchain contadas entre rebanadas.",
    genre: "Storytelling / Rap"
  },
  {
    id: "v10",
    youtubeId: "8JjZoLhOeC4",
    title: "PizzaDaoParty",
    artist: "Marco Crypto",
    aiPercentage: 50,
    description: "El sonido de la fiesta descentralizada más grande.",
    genre: "EDM / Electro"
  },
  {
    id: "v11",
    youtubeId: "CmSbXhj78BQ",
    title: "Masa Y Fuego",
    artist: "Sebastián Ceciliano",
    aiPercentage: 12,
    description: "La alquimia de la pizza convertida en canción.",
    genre: "Rock / Fusion"
  },
  {
    id: "v12",
    youtubeId: "NGgU_t6xtJg",
    title: "Pura Pizza",
    artist: "Sebastián Ceciliano",
    aiPercentage: 8,
    description: "Esencia pura, sin conservantes, solo Web3.",
    genre: "Pop Rock"
  },
  {
    id: "v13",
    youtubeId: "W7MuVmNWRmQ",
    title: "Pizza X",
    artist: "Brauxelion ft. YoungBleak",
    aiPercentage: 65,
    description: "Sonidos del futuro procesados por redes neuronales.",
    genre: "Hyperpop / AI"
  },
  {
    id: "v14",
    youtubeId: "h0rrsPxAlVU",
    title: "Free Pizza",
    artist: "Blackjales",
    aiPercentage: 30,
    description: "Un grito de guerra por la pizza libre para todos.",
    genre: "Punk / Grunge"
  },
  {
    id: "v15",
    youtubeId: "u4nPAnvS7Co",
    title: "Global Pizza Party",
    artist: "Herimax",
    aiPercentage: 45,
    description: "Latinoamérica unida por el queso y la blockchain.",
    genre: "Reggaeton / Future"
  },
  {
    id: "v16",
    youtubeId: "y6Tu1IZ-u-4",
    title: "Tango, Pizza y Amigos",
    artist: "RGabrielDiaz",
    aiPercentage: 0,
    description: "La tradición del tango se encuentra con la pasión por la pizza.",
    genre: "Tango / Fusion"
  },
  {
    id: "v17",
    youtubeId: "_Akdw6oCYSE",
    title: "Arcade Pizza Session II",
    artist: "MrRayius",
    aiPercentage: 5,
    description: "Atmósferas retro y beats relajados para una tarde de juegos.",
    genre: "Lo-fi / 8-bit"
  },
  {
    id: "v18",
    youtubeId: "2MC4ygeHABg",
    title: "Pizza DA0",
    artist: "FVST",
    aiPercentage: 15,
    description: "Ritmos urbanos directos desde la comunidad DA0.",
    genre: "Trap / Urbano"
  },
  {
    id: "v19",
    youtubeId: "f5Pl1R72b8Q",
    title: "Cariddi Records #1",
    artist: "Cariddi Crypto",
    aiPercentage: 10,
    description: "Exploración electrónica en el ecosistema Cariddi.",
    genre: "Electronic / Tech"
  },
  {
    id: "v20",
    youtubeId: "GqfFzduZJK4",
    title: "JOSHA \\ ZONAS",
    artist: "Josha",
    aiPercentage: 5,
    description: "Zonas de confort y pizza en esta propuesta indie.",
    genre: "Indie / Alternativo"
  },
  {
    id: "v21",
    youtubeId: "NbQ9PSGvvTM",
    title: "Ñam Ñam Ñam Ñam",
    artist: "Sandro B.",
    aiPercentage: 0,
    description: "Un tributo rítmico y divertido al acto de comer pizza.",
    genre: "Experimental / Pop"
  },
  {
    id: "v22",
    youtubeId: "rzgHrw79K7c",
    title: "PizzaDao x Cariddi Cowork",
    artist: "Wincoiner",
    aiPercentage: 10,
    description: "El sonido de la colaboración y el networking con aroma a queso.",
    genre: "Soundtrack / Ambient"
  },
  {
    id: "v23",
    youtubeId: "Ki9qHaGd8ko",
    title: "JOSHA * Muzza Boy",
    artist: "Joya",
    aiPercentage: 0,
    description: "Pop fresco para todos los amantes de la muzzarella.",
    genre: "Pop / Fresh"
  },
  {
    id: "v24",
    youtubeId: "hnp1hWNjtFs",
    title: "Pizza Day",
    artist: "Keleven ft. Sielo",
    aiPercentage: 15,
    description: "Celebrando el día más importante del año con flow.",
    genre: "Urbano / Party"
  }
];
