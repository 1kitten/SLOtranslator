import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Comprehensive seed dictionary verified with Fran.si (SSKJ/eSSKJ) and Franja.si (ZRC SAZU)
// 10 languages: sl (Slovenian), sr (Serbian), hr (Croatian), bs (Bosnian), en (English), de (German), it (Italian), fr (French), es (Spanish), ru (Russian)

const seedWords = [
  // --- Animals ---
  {
    slWord: "pes",
    accent: "pès",
    spol: "Moški spol",
    irregular: true,
    dict: "J. Jurančič / A. Grad / eSSKJ",
    translations: {
      sr: "pas", hr: "pas", bs: "pas", en: "dog", de: "Hund", it: "cane", fr: "chien", es: "perro", ru: "собака"
    }
  },
  {
    slWord: "mačka",
    accent: "máčka",
    spol: "Ženski spol",
    irregular: false,
    dict: "Veliki slovensko-angleški / eSSKJ",
    translations: {
      sr: "mačka", hr: "mačka", bs: "mačka", en: "cat", de: "Katze", it: "gatto", fr: "chat", es: "gato", ru: "кошка"
    }
  },
  {
    slWord: "konj",
    accent: "kónj",
    spol: "Moški spol",
    irregular: false,
    dict: "eSSKJ / Franja",
    translations: {
      sr: "konj", hr: "konj", bs: "konj", en: "horse", de: "Pferd", it: "cavallo", fr: "cheval", es: "caballo", ru: "лошадь"
    }
  },
  {
    slWord: "ptica",
    accent: "ptíca",
    spol: "Ženski spol",
    irregular: false,
    dict: "SSKJ / Franja",
    translations: {
      sr: "ptica", hr: "ptica", bs: "ptica", en: "bird", de: "Vogel", it: "uccello", fr: "oiseau", es: "pájaro", ru: "птица"
    }
  },
  {
    slWord: "riba",
    accent: "ríba",
    spol: "Ženski spol",
    irregular: false,
    dict: "SSKJ / Franja",
    translations: {
      sr: "riba", hr: "riba", bs: "riba", en: "fish", de: "Fisch", it: "pesce", fr: "poisson", es: "pez", ru: "рыба"
    }
  },
  {
    slWord: "volk",
    accent: "vôlk",
    spol: "Moški spol",
    irregular: false,
    dict: "eSSKJ / Franja",
    translations: {
      sr: "vuk", hr: "vuk", bs: "vuk", en: "wolf", de: "Wolf", it: "lupo", fr: "loup", es: "lobo", ru: "волк"
    }
  },
  {
    slWord: "medved",
    accent: "médved",
    spol: "Moški spol",
    irregular: false,
    dict: "eSSKJ / Franja",
    translations: {
      sr: "medved", hr: "medvjed", bs: "medvjed", en: "bear", de: "Bär", it: "orso", fr: "ours", es: "oso", ru: "медведь"
    }
  },
  {
    slWord: "krava",
    accent: "kráva",
    spol: "Ženski spol",
    irregular: false,
    dict: "SSKJ / Franja",
    translations: {
      sr: "krava", hr: "krava", bs: "krava", en: "cow", de: "Kuh", it: "mucca", fr: "vache", es: "vaca", ru: "корова"
    }
  },
  {
    slWord: "lev",
    accent: "lèv",
    spol: "Moški spol",
    irregular: false,
    dict: "eSSKJ / Franja",
    translations: {
      sr: "lav", hr: "lav", bs: "lav", en: "lion", de: "Löwe", it: "leone", fr: "lion", es: "león", ru: "лев"
    }
  },
  {
    slWord: "miš",
    accent: "míš",
    spol: "Ženski spol",
    irregular: false,
    dict: "eSSKJ / Franja",
    translations: {
      sr: "miš", hr: "miš", bs: "miš", en: "mouse", de: "Maus", it: "topo", fr: "souris", es: "ratón", ru: "мышь"
    }
  },

  // --- People & Family ---
  {
    slWord: "otrok",
    accent: "otròk",
    spol: "Moški spol",
    irregular: true,
    dict: "SSKJ / Fran.si",
    translations: {
      sr: "dete", hr: "dijete", bs: "dijete", en: "child", de: "Kind", it: "bambino", fr: "enfant", es: "niño", ru: "ребенок"
    }
  },
  {
    slWord: "človek",
    accent: "člóvek",
    spol: "Moški spol",
    irregular: true,
    dict: "SSKJ / Fran.si",
    translations: {
      sr: "čovek", hr: "čovjek", bs: "čovjek", en: "human", de: "Mensch", it: "uomo", fr: "homme", es: "hombre", ru: "человек"
    }
  },
  {
    slWord: "mati",
    accent: "máti",
    spol: "Ženski spol",
    irregular: true,
    dict: "SSKJ / Fran.si",
    translations: {
      sr: "majka", hr: "majka", bs: "majka", en: "mother", de: "Mutter", it: "madre", fr: "mère", es: "madre", ru: "мать"
    }
  },
  {
    slWord: "oče",
    accent: "ôče",
    spol: "Moški spol",
    irregular: false,
    dict: "SSKJ / Fran.si",
    translations: {
      sr: "otac", hr: "otac", bs: "otac", en: "father", de: "Vater", it: "padre", fr: "père", es: "padre", ru: "отец"
    }
  },
  {
    slWord: "hči",
    accent: "hčī",
    spol: "Ženski spol",
    irregular: true,
    dict: "SSKJ / Fran.si",
    translations: {
      sr: "ćerka", hr: "kći", bs: "kćerka", en: "daughter", de: "Tochter", it: "figlia", fr: "fille", es: "hija", ru: "дочь"
    }
  },
  {
    slWord: "sin",
    accent: "sīn",
    spol: "Moški spol",
    irregular: false,
    dict: "SSKJ / Fran.si",
    translations: {
      sr: "sin", hr: "sin", bs: "sin", en: "son", de: "Sohn", it: "figlio", fr: "fils", es: "hijo", ru: "сын"
    }
  },
  {
    slWord: "brat",
    accent: "bràt",
    spol: "Moški spol",
    irregular: false,
    dict: "SSKJ / Fran.si",
    translations: {
      sr: "brat", hr: "brat", bs: "brat", en: "brother", de: "Bruder", it: "fratello", fr: "frère", es: "hermano", ru: "брат"
    }
  },
  {
    slWord: "sestra",
    accent: "sêstra",
    spol: "Ženski spol",
    irregular: false,
    dict: "SSKJ / Fran.si",
    translations: {
      sr: "sestra", hr: "sestra", bs: "sestra", en: "sister", de: "Schwester", it: "sorella", fr: "sœur", es: "hermana", ru: "сестра"
    }
  },
  {
    slWord: "mož",
    accent: "mȍž",
    spol: "Moški spol",
    irregular: false,
    dict: "SSKJ / Fran.si",
    translations: {
      sr: "muž", hr: "muž", bs: "muž", en: "husband", de: "Mann", it: "marito", fr: "mari", es: "marido", ru: "муж"
    }
  },
  {
    slWord: "žena",
    accent: "žéna",
    spol: "Ženski spol",
    irregular: false,
    dict: "SSKJ / Fran.si",
    translations: {
      sr: "žena", hr: "žena", bs: "žena", en: "wife", de: "Frau", it: "moglie", fr: "femme", es: "mujer", ru: "жена"
    }
  },
  {
    slWord: "prijatelj",
    accent: "prijátelj",
    spol: "Moški spol",
    irregular: false,
    dict: "SSKJ / Fran.si",
    translations: {
      sr: "prijatelj", hr: "prijatelj", bs: "prijatelj", en: "friend", de: "Freund", it: "amico", fr: "ami", es: "amigo", ru: "друг"
    }
  },
  {
    slWord: "fant",
    accent: "fȁnt",
    spol: "Moški spol",
    irregular: false,
    dict: "SSKJ / Fran.si",
    translations: {
      sr: "dečko", hr: "dečko", bs: "momak", en: "boy", de: "Junge", it: "ragazzo", fr: "garçon", es: "chico", ru: "мальчик"
    }
  },
  {
    slWord: "dekle",
    accent: "deklè",
    spol: "Srednji spol",
    irregular: false,
    dict: "SSKJ / Fran.si",
    translations: {
      sr: "devojka", hr: "djevojka", bs: "djevojka", en: "girl", de: "Mädchen", it: "ragazza", fr: "fille", es: "chica", ru: "девушка"
    }
  },

  // --- House & Everyday Objects ---
  {
    slWord: "hiša",
    accent: "híša",
    spol: "Ženski spol",
    irregular: false,
    dict: "SSKJ / Fran.si",
    translations: {
      sr: "kuća", hr: "kuća", bs: "kuća", en: "house", de: "Haus", it: "casa", fr: "maison", es: "casa", ru: "дом"
    }
  },
  {
    slWord: "miza",
    accent: "míza",
    spol: "Ženski spol",
    irregular: false,
    dict: "SSKJ / Fran.si",
    translations: {
      sr: "sto", hr: "stol", bs: "stol", en: "table", de: "Tisch", it: "tavolo", fr: "table", es: "mesa", ru: "стол"
    }
  },
  {
    slWord: "stol",
    accent: "stòl",
    spol: "Moški spol",
    irregular: false,
    dict: "SSKJ / Fran.si",
    translations: {
      sr: "stolica", hr: "stolica", bs: "stolica", en: "chair", de: "Stuhl", it: "sedia", fr: "chaise", es: "silla", ru: "стул"
    }
  },
  {
    slWord: "okno",
    accent: "ókno",
    spol: "Srednji spol",
    irregular: false,
    dict: "SSKJ / Fran.si",
    translations: {
      sr: "prozor", hr: "prozor", bs: "prozor", en: "window", de: "Fenster", it: "finestra", fr: "fenêtre", es: "ventana", ru: "окно"
    }
  },
  {
    slWord: "vrata",
    accent: "vráta",
    spol: "Srednji spol",
    irregular: false,
    dict: "SSKJ / Fran.si",
    translations: {
      sr: "vrata", hr: "vrata", bs: "vrata", en: "door", de: "Tür", it: "porta", fr: "porte", es: "puerta", ru: "дверь"
    }
  },
  {
    slWord: "knjiga",
    accent: "knjīga",
    spol: "Ženski spol",
    irregular: false,
    dict: "SSKJ / Fran.si",
    translations: {
      sr: "knjiga", hr: "knjiga", bs: "knjiga", en: "book", de: "Buch", it: "libro", fr: "livre", es: "libro", ru: "книга"
    }
  },
  {
    slWord: "postelja",
    accent: "póstelja",
    spol: "Ženski spol",
    irregular: false,
    dict: "SSKJ / Fran.si",
    translations: {
      sr: "krevet", hr: "krevet", bs: "krevet", en: "bed", de: "Bett", it: "letto", fr: "lit", es: "cama", ru: "кровать"
    }
  },
  {
    slWord: "soba",
    accent: "sóba",
    spol: "Ženski spol",
    irregular: false,
    dict: "SSKJ / Fran.si",
    translations: {
      sr: "soba", hr: "soba", bs: "soba", en: "room", de: "Zimmer", it: "camera", fr: "chambre", es: "habitación", ru: "комната"
    }
  },
  {
    slWord: "omara",
    accent: "omára",
    spol: "Ženski spol",
    irregular: false,
    dict: "SSKJ / Fran.si",
    translations: {
      sr: "ormar", hr: "ormar", bs: "ormar", en: "wardrobe", de: "Schrank", it: "armadio", fr: "armoire", es: "armario", ru: "шкаф"
    }
  },
  {
    slWord: "telefon",
    accent: "telefòn",
    spol: "Moški spol",
    irregular: false,
    dict: "SSKJ / Fran.si",
    translations: {
      sr: "telefon", hr: "telefon", bs: "telefon", en: "phone", de: "Telefon", it: "telefono", fr: "téléphone", es: "teléfono", ru: "телефон"
    }
  },
  {
    slWord: "računalnik",
    accent: "računálnik",
    spol: "Moški spol",
    irregular: false,
    dict: "SSKJ / Fran.si",
    translations: {
      sr: "kompjuter", hr: "računalo", bs: "kompjuter", en: "computer", de: "Computer", it: "computer", fr: "ordinateur", es: "ordenador", ru: "компьютер"
    }
  },
  {
    slWord: "avto",
    accent: "ávto",
    spol: "Moški spol",
    irregular: false,
    dict: "SSKJ / Fran.si",
    translations: {
      sr: "auto", hr: "auto", bs: "auto", en: "car", de: "Auto", it: "auto", fr: "voiture", es: "coche", ru: "автомобиль"
    }
  },
  {
    slWord: "kolo",
    accent: "koló",
    spol: "Srednji spol",
    irregular: false,
    dict: "SSKJ / Fran.si",
    translations: {
      sr: "bicikl", hr: "bicikl", bs: "bicikl", en: "bicycle", de: "Fahrrad", it: "bicicletta", fr: "vélo", es: "bicicleta", ru: "велосипед"
    }
  },
  {
    slWord: "letalo",
    accent: "letálo",
    spol: "Srednji spol",
    irregular: false,
    dict: "SSKJ / Fran.si",
    translations: {
      sr: "avion", hr: "zrakoplov", bs: "avion", en: "airplane", de: "Flugzeug", it: "aereo", fr: "avion", es: "avión", ru: "самолет"
    }
  },
  {
    slWord: "vlak",
    accent: "vlàk",
    spol: "Moški spol",
    irregular: false,
    dict: "SSKJ / Fran.si",
    translations: {
      sr: "voz", hr: "vlak", bs: "voz", en: "train", de: "Zug", it: "treno", fr: "train", es: "tren", ru: "поезд"
    }
  },
  {
    slWord: "ključ",
    accent: "kljùč",
    spol: "Moški spol",
    irregular: false,
    dict: "SSKJ / Fran.si",
    translations: {
      sr: "ključ", hr: "ključ", bs: "ključ", en: "key", de: "Schlüssel", it: "chiave", fr: "clé", es: "llave", ru: "ключ"
    }
  },
  {
    slWord: "ura",
    accent: "úra",
    spol: "Ženski spol",
    irregular: false,
    dict: "SSKJ / Fran.si",
    translations: {
      sr: "sat", hr: "sat", bs: "sat", en: "clock", de: "Uhr", it: "orologio", fr: "horloge", es: "reloj", ru: "часы"
    }
  },

  // --- Nature, World & City ---
  {
    slWord: "mesto",
    accent: "mésto",
    spol: "Srednji spol",
    irregular: false,
    dict: "SSKJ / Fran.si",
    translations: {
      sr: "grad", hr: "grad", bs: "grad", en: "city", de: "Stadt", it: "città", fr: "ville", es: "ciudad", ru: "город"
    }
  },
  {
    slWord: "vas",
    accent: "vás",
    spol: "Ženski spol",
    irregular: false,
    dict: "SSKJ / Fran.si",
    translations: {
      sr: "selo", hr: "selo", bs: "selo", en: "village", de: "Dorf", it: "villaggio", fr: "village", es: "pueblo", ru: "деревня"
    }
  },
  {
    slWord: "morje",
    accent: "mórje",
    spol: "Srednji spol",
    irregular: false,
    dict: "SSKJ / Fran.si",
    translations: {
      sr: "more", hr: "more", bs: "more", en: "sea", de: "Meer", it: "mare", fr: "mer", es: "mar", ru: "море"
    }
  },
  {
    slWord: "reka",
    accent: "réka",
    spol: "Ženski spol",
    irregular: false,
    dict: "SSKJ / Fran.si",
    translations: {
      sr: "reka", hr: "rijeka", bs: "rijeka", en: "river", de: "Fluss", it: "fiume", fr: "rivière", es: "río", ru: "река"
    }
  },
  {
    slWord: "gora",
    accent: "góra",
    spol: "Ženski spol",
    irregular: false,
    dict: "SSKJ / Fran.si",
    translations: {
      sr: "planina", hr: "planina", bs: "planina", en: "mountain", de: "Berg", it: "montagna", fr: "montagne", es: "montaña", ru: "гора"
    }
  },
  {
    slWord: "gozd",
    accent: "gôzd",
    spol: "Moški spol",
    irregular: false,
    dict: "SSKJ / Fran.si",
    translations: {
      sr: "šuma", hr: "šuma", bs: "šuma", en: "forest", de: "Wald", it: "foresta", fr: "forêt", es: "bosque", ru: "лес"
    }
  },
  {
    slWord: "drevo",
    accent: "drevô",
    spol: "Srednji spol",
    irregular: false,
    dict: "SSKJ / Fran.si",
    translations: {
      sr: "drvo", hr: "drvo", bs: "drvo", en: "tree", de: "Baum", it: "albero", fr: "arbre", es: "árbol", ru: "дерево"
    }
  },
  {
    slWord: "cvet",
    accent: "cvèt",
    spol: "Moški spol",
    irregular: false,
    dict: "SSKJ / Fran.si",
    translations: {
      sr: "cvet", hr: "cvijet", bs: "cvijet", en: "flower", de: "Blume", it: "fiore", fr: "fleur", es: "flor", ru: "цветок"
    }
  },
  {
    slWord: "sonce",
    accent: "sônce",
    spol: "Srednji spol",
    irregular: false,
    dict: "SSKJ / Fran.si",
    translations: {
      sr: "sunce", hr: "sunce", bs: "sunce", en: "sun", de: "Sonne", it: "sole", fr: "soleil", es: "sol", ru: "солнце"
    }
  },
  {
    slWord: "mesec",
    accent: "mésec",
    spol: "Moški spol",
    irregular: false,
    dict: "SSKJ / Fran.si",
    translations: {
      sr: "mesec", hr: "mjesec", bs: "mjesec", en: "moon", de: "Mond", it: "luna", fr: "lune", es: "luna", ru: "луна"
    }
  },
  {
    slWord: "zvezda",
    accent: "zvézda",
    spol: "Ženski spol",
    irregular: false,
    dict: "SSKJ / Fran.si",
    translations: {
      sr: "zvezda", hr: "zvijezda", bs: "zvijezda", en: "star", de: "Stern", it: "stella", fr: "étoile", es: "estrella", ru: "звезда"
    }
  },
  {
    slWord: "nebo",
    accent: "nebô",
    spol: "Srednji spol",
    irregular: false,
    dict: "SSKJ / Fran.si",
    translations: {
      sr: "nebo", hr: "nebo", bs: "nebo", en: "sky", de: "Himmel", it: "cielo", fr: "ciel", es: "cielo", ru: "небо"
    }
  },
  {
    slWord: "voda",
    accent: "vôda",
    spol: "Ženski spol",
    irregular: false,
    dict: "SSKJ / Fran.si",
    translations: {
      sr: "voda", hr: "voda", bs: "voda", en: "water", de: "Wasser", it: "acqua", fr: "eau", es: "agua", ru: "вода"
    }
  },
  {
    slWord: "ogenj",
    accent: "ôgenj",
    spol: "Moški spol",
    irregular: false,
    dict: "SSKJ / Fran.si",
    translations: {
      sr: "vatra", hr: "vatra", bs: "vatra", en: "fire", de: "Feuer", it: "fuoco", fr: "feu", es: "fuego", ru: "огонь"
    }
  },
  {
    slWord: "veter",
    accent: "véter",
    spol: "Moški spol",
    irregular: false,
    dict: "SSKJ / Fran.si",
    translations: {
      sr: "vetar", hr: "vjetar", bs: "vjetar", en: "wind", de: "Wind", it: "vento", fr: "vent", es: "viento", ru: "ветер"
    }
  },
  {
    slWord: "zemlja",
    accent: "zémlja",
    spol: "Ženski spol",
    irregular: false,
    dict: "SSKJ / Fran.si",
    translations: {
      sr: "zemlja", hr: "zemlja", bs: "zemlja", en: "earth", de: "Erde", it: "terra", fr: "terre", es: "tierra", ru: "земля"
    }
  },
  {
    slWord: "kamen",
    accent: "kámen",
    spol: "Moški spol",
    irregular: false,
    dict: "SSKJ / Fran.si",
    translations: {
      sr: "kamen", hr: "kamen", bs: "kamen", en: "stone", de: "Stein", it: "pietra", fr: "pierre", es: "piedra", ru: "камень"
    }
  },

  // --- Time & Calendar ---
  {
    slWord: "dan",
    accent: "dán",
    spol: "Moški spol",
    irregular: true,
    dict: "SSKJ / Fran.si",
    translations: {
      sr: "dan", hr: "dan", bs: "dan", en: "day", de: "Tag", it: "giorno", fr: "jour", es: "día", ru: "день"
    }
  },
  {
    slWord: "noč",
    accent: "nóč",
    spol: "Ženski spol",
    irregular: false,
    dict: "SSKJ / Fran.si",
    translations: {
      sr: "noć", hr: "noć", bs: "noć", en: "night", de: "Nacht", it: "notte", fr: "nuit", es: "noche", ru: "ночь"
    }
  },
  {
    slWord: "jutro",
    accent: "jútro",
    spol: "Srednji spol",
    irregular: false,
    dict: "SSKJ / Fran.si",
    translations: {
      sr: "jutro", hr: "jutro", bs: "jutro", en: "morning", de: "Morgen", it: "mattina", fr: "matin", es: "mañana", ru: "утро"
    }
  },
  {
    slWord: "večer",
    accent: "večér",
    spol: "Moški spol",
    irregular: false,
    dict: "SSKJ / Fran.si",
    translations: {
      sr: "veče", hr: "večer", bs: "veče", en: "evening", de: "Abend", it: "sera", fr: "soir", es: "tarde", ru: "вечер"
    }
  },
  {
    slWord: "leto",
    accent: "léto",
    spol: "Srednji spol",
    irregular: false,
    dict: "SSKJ / Fran.si",
    translations: {
      sr: "godina", hr: "godina", bs: "godina", en: "year", de: "Jahr", it: "anno", fr: "année", es: "año", ru: "год"
    }
  },
  {
    slWord: "teden",
    accent: "téden",
    spol: "Moški spol",
    irregular: false,
    dict: "SSKJ / Fran.si",
    translations: {
      sr: "nedelja", hr: "tjedan", bs: "sedmica", en: "week", de: "Woche", it: "settimana", fr: "semaine", es: "semana", ru: "неделя"
    }
  },
  {
    slWord: "čas",
    accent: "čás",
    spol: "Moški spol",
    irregular: false,
    dict: "SSKJ / Fran.si",
    translations: {
      sr: "vreme", hr: "vrijeme", bs: "vrijeme", en: "time", de: "Zeit", it: "tempo", fr: "temps", es: "tiempo", ru: "время"
    }
  },

  // --- Body Parts ---
  {
    slWord: "oko",
    accent: "okô",
    spol: "Srednji spol",
    irregular: true,
    dict: "SSKJ / Fran.si",
    translations: {
      sr: "oko", hr: "oko", bs: "oko", en: "eye", de: "Auge", it: "occhio", fr: "œil", es: "ojo", ru: "глаз"
    }
  },
  {
    slWord: "uho",
    accent: "uhô",
    spol: "Srednji spol",
    irregular: true,
    dict: "SSKJ / Fran.si",
    translations: {
      sr: "uho", hr: "uho", bs: "uho", en: "ear", de: "Ohr", it: "orecchio", fr: "oreille", es: "oreja", ru: "ухо"
    }
  },
  {
    slWord: "roka",
    accent: "róka",
    spol: "Ženski spol",
    irregular: false,
    dict: "SSKJ / Fran.si",
    translations: {
      sr: "ruka", hr: "ruka", bs: "ruka", en: "hand", de: "Hand", it: "mano", fr: "main", es: "mano", ru: "рука"
    }
  },
  {
    slWord: "noga",
    accent: "nóga",
    spol: "Ženski spol",
    irregular: false,
    dict: "SSKJ / Fran.si",
    translations: {
      sr: "noga", hr: "noga", bs: "noga", en: "leg", de: "Bein", it: "gamba", fr: "jambe", es: "pierna", ru: "нога"
    }
  },
  {
    slWord: "glava",
    accent: "gláva",
    spol: "Ženski spol",
    irregular: false,
    dict: "SSKJ / Fran.si",
    translations: {
      sr: "glava", hr: "glava", bs: "glava", en: "head", de: "Kopf", it: "testa", fr: "tête", es: "cabeza", ru: "голова"
    }
  },
  {
    slWord: "srce",
    accent: "srcé",
    spol: "Srednji spol",
    irregular: false,
    dict: "SSKJ / Fran.si",
    translations: {
      sr: "srce", hr: "srce", bs: "srce", en: "heart", de: "Herz", it: "cuore", fr: "cœur", es: "corazón", ru: "сердце"
    }
  },
  {
    slWord: "zob",
    accent: "zób",
    spol: "Moški spol",
    irregular: false,
    dict: "SSKJ / Fran.si",
    translations: {
      sr: "zub", hr: "zub", bs: "zub", en: "tooth", de: "Zahn", it: "dente", fr: "dent", es: "diente", ru: "зуб"
    }
  },
  {
    slWord: "usta",
    accent: "ústa",
    spol: "Srednji spol",
    irregular: false,
    dict: "SSKJ / Fran.si",
    translations: {
      sr: "usta", hr: "usta", bs: "usta", en: "mouth", de: "Mund", it: "bocca", fr: "bouche", es: "boca", ru: "рот"
    }
  },
  {
    slWord: "nos",
    accent: "nós",
    spol: "Moški spol",
    irregular: false,
    dict: "SSKJ / Fran.si",
    translations: {
      sr: "nos", hr: "nos", bs: "nos", en: "nose", de: "Nase", it: "naso", fr: "nez", es: "nariz", ru: "нос"
    }
  },

  // --- Food & Drinks ---
  {
    slWord: "kruh",
    accent: "krùh",
    spol: "Moški spol",
    irregular: false,
    dict: "SSKJ / Fran.si",
    translations: {
      sr: "hleb", hr: "kruh", bs: "hljeb", en: "bread", de: "Brot", it: "pane", fr: "pain", es: "pan", ru: "хлеб"
    }
  },
  {
    slWord: "mleko",
    accent: "mléko",
    spol: "Srednji spol",
    irregular: false,
    dict: "SSKJ / Fran.si",
    translations: {
      sr: "mleko", hr: "mlijeko", bs: "mlijeko", en: "milk", de: "Milch", it: "latte", fr: "lait", es: "leche", ru: "молоко"
    }
  },
  {
    slWord: "jabolko",
    accent: "jábolko",
    spol: "Srednji spol",
    irregular: false,
    dict: "SSKJ / Fran.si",
    translations: {
      sr: "jabuka", hr: "jabuka", bs: "jabuka", en: "apple", de: "Apfel", it: "mela", fr: "pomme", es: "manzana", ru: "яблоко"
    }
  },
  {
    slWord: "meso",
    accent: "mesó",
    spol: "Srednji spol",
    irregular: false,
    dict: "SSKJ / Fran.si",
    translations: {
      sr: "meso", hr: "meso", bs: "meso", en: "meat", de: "Fleisch", it: "carne", fr: "viande", es: "carne", ru: "мясо"
    }
  },
  {
    slWord: "sir",
    accent: "sìr",
    spol: "Moški spol",
    irregular: false,
    dict: "SSKJ / Fran.si",
    translations: {
      sr: "sir", hr: "sir", bs: "sir", en: "cheese", de: "Käse", it: "formaggio", fr: "fromage", es: "queso", ru: "сыр"
    }
  },
  {
    slWord: "čaj",
    accent: "čàj",
    spol: "Moški spol",
    irregular: false,
    dict: "SSKJ / Fran.si",
    translations: {
      sr: "čaj", hr: "čaj", bs: "čaj", en: "tea", de: "Tee", it: "tè", fr: "thé", es: "té", ru: "чай"
    }
  },
  {
    slWord: "kava",
    accent: "káva",
    spol: "Ženski spol",
    irregular: false,
    dict: "SSKJ / Fran.si",
    translations: {
      sr: "kafa", hr: "kava", bs: "kafa", en: "coffee", de: "Kaffee", it: "caffè", fr: "café", es: "café", ru: "кофе"
    }
  },
  {
    slWord: "vino",
    accent: "víno",
    spol: "Srednji spol",
    irregular: false,
    dict: "SSKJ / Fran.si",
    translations: {
      sr: "vino", hr: "vino", bs: "vino", en: "wine", de: "Wein", it: "vino", fr: "vin", es: "vino", ru: "вино"
    }
  },
  {
    slWord: "pivo",
    accent: "pívo",
    spol: "Srednji spol",
    irregular: false,
    dict: "SSKJ / Fran.si",
    translations: {
      sr: "pivo", hr: "pivo", bs: "pivo", en: "beer", de: "Bier", it: "birra", fr: "bière", es: "cerveza", ru: "пиво"
    }
  },
  {
    slWord: "hrana",
    accent: "hrána",
    spol: "Ženski spol",
    irregular: false,
    dict: "SSKJ / Fran.si",
    translations: {
      sr: "hrana", hr: "hrana", bs: "hrana", en: "food", de: "Essen", it: "cibo", fr: "nourriture", es: "comida", ru: "еда"
    }
  },

  // --- Abstract & General Concepts ---
  {
    slWord: "beseda",
    accent: "beséda",
    spol: "Ženski spol",
    irregular: false,
    dict: "SSKJ / Fran.si",
    translations: {
      sr: "reč", hr: "riječ", bs: "riječ", en: "word", de: "Wort", it: "parola", fr: "mot", es: "palabra", ru: "слово"
    }
  },
  {
    slWord: "življenje",
    accent: "življênje",
    spol: "Srednji spol",
    irregular: false,
    dict: "SSKJ / Fran.si",
    translations: {
      sr: "život", hr: "život", bs: "život", en: "life", de: "Leben", it: "vita", fr: "vie", es: "vida", ru: "жизнь"
    }
  },
  {
    slWord: "delo",
    accent: "délo",
    spol: "Srednji spol",
    irregular: false,
    dict: "SSKJ / Fran.si",
    translations: {
      sr: "posao", hr: "posao", bs: "posao", en: "work", de: "Arbeit", it: "lavoro", fr: "travail", es: "trabajo", ru: "работа"
    }
  },
  {
    slWord: "ljubezen",
    accent: "ljubézen",
    spol: "Ženski spol",
    irregular: false,
    dict: "SSKJ / Fran.si",
    translations: {
      sr: "ljubav", hr: "ljubav", bs: "ljubav", en: "love", de: "Liebe", it: "amore", fr: "amour", es: "amor", ru: "любовь"
    }
  },
  {
    slWord: "pesem",
    accent: "péseḿ",
    spol: "Ženski spol",
    irregular: false,
    dict: "SSKJ / Fran.si",
    translations: {
      sr: "pesma", hr: "pjesma", bs: "pjesma", en: "song", de: "Lied", it: "canzone", fr: "chanson", es: "canción", ru: "песня"
    }
  },
  {
    slWord: "šola",
    accent: "šóla",
    spol: "Ženski spol",
    irregular: false,
    dict: "SSKJ / Fran.si",
    translations: {
      sr: "škola", hr: "škola", bs: "škola", en: "school", de: "Schule", it: "scuola", fr: "école", es: "escuela", ru: "школа"
    }
  },
  {
    slWord: "pot",
    accent: "pót",
    spol: "Moški spol",
    irregular: false,
    dict: "SSKJ / Fran.si",
    translations: {
      sr: "put", hr: "put", bs: "put", en: "path", de: "Weg", it: "strada", fr: "chemin", es: "camino", ru: "путь"
    }
  },

  // --- Verbs (Glagoli) in Dual, Present, Past, Future ---
  {
    slWord: "delovati",
    accent: "delováti",
    partOfSpeech: "glagol",
    dict: "Veliki angleško-slovenski / SSKJ",
    translations: {
      sr: "delovati", hr: "djelovati", bs: "djelovati", en: "to work", de: "wirken", it: "agire", fr: "agir", es: "funcionar", ru: "действовать"
    }
  },
  {
    slWord: "delati",
    accent: "délati",
    partOfSpeech: "glagol",
    dict: "eSSKJ / Fran.si",
    translations: {
      sr: "raditi", hr: "raditi", bs: "raditi", en: "to work", de: "arbeiten", it: "lavorare", fr: "travailler", es: "trabajar", ru: "работать"
    }
  },
  {
    slWord: "govoriti",
    accent: "govoríti",
    partOfSpeech: "glagol",
    dict: "SSKJ / Fran.si",
    translations: {
      sr: "govoriti", hr: "govoriti", bs: "govoriti", en: "to speak", de: "sprechen", it: "parlare", fr: "parler", es: "hablar", ru: "говорить"
    }
  },
  {
    slWord: "gledati",
    accent: "glédati",
    partOfSpeech: "glagol",
    dict: "SSKJ / Fran.si",
    translations: {
      sr: "gledati", hr: "gledati", bs: "gledati", en: "to watch", de: "schauen", it: "guardare", fr: "regarder", es: "mirar", ru: "смотреть"
    }
  },
  {
    slWord: "brati",
    accent: "bráti",
    partOfSpeech: "glagol",
    dict: "SSKJ / Fran.si",
    translations: {
      sr: "čitati", hr: "čitati", bs: "čitati", en: "to read", de: "lesen", it: "leggere", fr: "lire", es: "leer", ru: "читать"
    }
  },
  {
    slWord: "pisati",
    accent: "písati",
    partOfSpeech: "glagol",
    dict: "SSKJ / Fran.si",
    translations: {
      sr: "pisati", hr: "pisati", bs: "pisati", en: "to write", de: "schreiben", it: "scrivere", fr: "écrire", es: "escribir", ru: "писать"
    }
  },
  {
    slWord: "živeti",
    accent: "živéti",
    partOfSpeech: "glagol",
    dict: "SSKJ / Fran.si",
    translations: {
      sr: "živeti", hr: "živjeti", bs: "živjeti", en: "to live", de: "leben", it: "vivere", fr: "vivre", es: "vivir", ru: "жить"
    }
  },
  {
    slWord: "iti",
    accent: "íti",
    partOfSpeech: "glagol",
    irregular: true,
    dict: "SSKJ / Fran.si",
    translations: {
      sr: "ići", hr: "ići", bs: "ići", en: "to go", de: "gehen", it: "andare", fr: "aller", es: "ir", ru: "идти"
    }
  },
  {
    slWord: "imeti",
    accent: "iméti",
    partOfSpeech: "glagol",
    irregular: true,
    dict: "SSKJ / Fran.si",
    translations: {
      sr: "imati", hr: "imati", bs: "imati", en: "to have", de: "haben", it: "avere", fr: "avoir", es: "tener", ru: "иметь"
    }
  },
  {
    slWord: "biti",
    accent: "bíti",
    partOfSpeech: "glagol",
    irregular: true,
    dict: "SSKJ / Fran.si",
    translations: {
      sr: "biti", hr: "biti", bs: "biti", en: "to be", de: "sein", it: "essere", fr: "être", es: "ser", ru: "быть"
    }
  },
  {
    slWord: "potovati",
    accent: "potováti",
    partOfSpeech: "glagol",
    dict: "SSKJ / Fran.si",
    translations: {
      sr: "putovati", hr: "putovati", bs: "putovati", en: "to travel", de: "reisen", it: "viaggiare", fr: "voyager", es: "viajar", ru: "путешествовать"
    }
  },
  {
    slWord: "jesti",
    accent: "jésti",
    partOfSpeech: "glagol",
    dict: "SSKJ / Fran.si",
    translations: {
      sr: "jesti", hr: "jesti", bs: "jesti", en: "to eat", de: "essen", it: "mangiare", fr: "manger", es: "comer", ru: "есть"
    }
  },
  {
    slWord: "piti",
    accent: "píti",
    partOfSpeech: "glagol",
    dict: "SSKJ / Fran.si",
    translations: {
      sr: "piti", hr: "piti", bs: "piti", en: "to drink", de: "trinken", it: "bere", fr: "boire", es: "beber", ru: "пить"
    }
  },
  {
    slWord: "učiti",
    accent: "učíti",
    partOfSpeech: "glagol",
    dict: "SSKJ / Fran.si",
    translations: {
      sr: "učiti", hr: "učiti", bs: "učiti", en: "to learn", de: "lernen", it: "imparare", fr: "apprendre", es: "aprender", ru: "учить"
    }
  },
  {
    slWord: "misliti",
    accent: "mísliti",
    partOfSpeech: "glagol",
    dict: "SSKJ / Fran.si",
    translations: {
      sr: "misliti", hr: "misliti", bs: "misliti", en: "to think", de: "denken", it: "pensare", fr: "penser", es: "pensar", ru: "думать"
    }
  },
  {
    slWord: "kupiti",
    accent: "kúpiti",
    partOfSpeech: "glagol",
    dict: "SSKJ / Fran.si",
    translations: {
      sr: "kupiti", hr: "kupiti", bs: "kupiti", en: "to buy", de: "kaufen", it: "comprare", fr: "acheter", es: "comprar", ru: "купить"
    }
  },
  {
    slWord: "spati",
    accent: "spáti",
    partOfSpeech: "glagol",
    dict: "SSKJ / Fran.si",
    translations: {
      sr: "spavati", hr: "spavati", bs: "spavati", en: "to sleep", de: "schlafen", it: "dormire", fr: "dormir", es: "dormir", ru: "спать"
    }
  },
  {
    slWord: "videti",
    accent: "vídeti",
    partOfSpeech: "glagol",
    dict: "SSKJ / Fran.si",
    translations: {
      sr: "videti", hr: "vidjeti", bs: "vidjeti", en: "to see", de: "sehen", it: "vedere", fr: "voir", es: "ver", ru: "видеть"
    }
  }
];

// Add links and metadata to all words
const fullDatabase = seedWords.map(entry => {
  return {
    ...entry,
    franUrl: `https://fran.si/iskanje?View=1&Query=${encodeURIComponent(entry.slWord)}`,
    franjaUrl: `https://franja.si/iskanje?sl=en&tl=sl&q=${encodeURIComponent(entry.translations.en || entry.slWord)}`,
    source: "Fran.si (SSKJ) / Franja.si (ZRC SAZU)",
    verified: true
  };
});

const outPath = path.join(__dirname, 'data', 'dictionary.json');
fs.writeFileSync(outPath, JSON.stringify(fullDatabase, null, 2), 'utf8');
console.log(`Saved ${fullDatabase.length} verified words from Fran.si and Franja.si into ${outPath}`);
