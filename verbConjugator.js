// Slovenian Verb Conjugator Engine
// Specifically designed for dual (dvojina), singular (ednina), and plural (množina)
// across Sedanjik (Present), Preteklik (Past), and Prihodnjik (Future)

const irregularVerbs = {
  "biti": {
    infinitive: "biti",
    translations: { sr: "biti", hr: "biti", bs: "biti", en: "to be", de: "sein", it: "essere", fr: "être", es: "ser/estar", ru: "быть", sl: "biti" },
    present: {
      ednina: { p1: "jaz sem", p2: "ti si", p3: "on/ona je" },
      dvojina: {
        p1: "midva/medve sva",
        p2: "vidva/vedve sta",
        p3: "onadva/onidve sta"
      },
      mnozina: { p1: "mi smo", p2: "vi ste", p3: "oni/one so" }
    },
    pastParticiple: { m_ed: "bil", f_ed: "bila", m_dv: "bila", f_dv: "bili", m_mn: "bili", f_mn: "bile" }
  },
  "iti": {
    infinitive: "iti",
    translations: { sr: "ići", hr: "ići", bs: "ići", en: "to go", de: "gehen", it: "andare", fr: "aller", es: "ir", ru: "идти", sl: "iti" },
    present: {
      ednina: { p1: "jaz grem", p2: "ti greš", p3: "on/ona gre" },
      dvojina: {
        p1: "midva/medve greva",
        p2: "vidva/vedve gresta",
        p3: "onadva/onidve gresta"
      },
      mnozina: { p1: "mi gremo", p2: "vi greste", p3: "oni/one gredo" }
    },
    pastParticiple: { m_ed: "šel", f_ed: "šla", m_dv: "šla", f_dv: "šli", m_mn: "šli", f_mn: "šle" }
  },
  "imeti": {
    infinitive: "imeti",
    translations: { sr: "imati", hr: "imati", bs: "imati", en: "to have", de: "haben", it: "avere", fr: "avoir", es: "tener", ru: "иметь", sl: "imeti" },
    present: {
      ednina: { p1: "jaz imam", p2: "ti imaš", p3: "on/ona ima" },
      dvojina: {
        p1: "midva/medve imava",
        p2: "vidva/vedve imata",
        p3: "onadva/onidve imata"
      },
      mnozina: { p1: "mi imamo", p2: "vi imate", p3: "oni/one imajo" }
    },
    pastParticiple: { m_ed: "imel", f_ed: "imela", m_dv: "imela", f_dv: "imeli", m_mn: "imeli", f_mn: "imele" }
  },
  "hoteti": {
    infinitive: "hoteti",
    translations: { en: "to want", de: "wollen", it: "volere", fr: "vouloir", es: "querer", ru: "хотеть", sr: "hteti", hr: "htjeti", bs: "htjeti", sl: "hoteti" },
    present: {
      ednina: { p1: "jaz hočem", p2: "ti hočeš", p3: "on/ona hoče" },
      dvojina: {
        p1: "midva/medve hočeva",
        p2: "vidva/vedve hočeta",
        p3: "onadva/onidve hočeta"
      },
      mnozina: { p1: "mi hočemo", p2: "vi hočete", p3: "oni/one hočejo" }
    },
    pastParticiple: { m_ed: "hotel", f_ed: "hotela", m_dv: "hotela", f_dv: "hoteli", m_mn: "hoteli", f_mn: "hotele" }
  },
  "vedeti": {
    infinitive: "vedeti",
    translations: { en: "to know", de: "wissen", it: "sapere", fr: "savoir", es: "saber", ru: "знать", sr: "znati", hr: "znati", bs: "znati", sl: "vedeti" },
    present: {
      ednina: { p1: "jaz vem", p2: "ti veš", p3: "on/ona ve" },
      dvojina: {
        p1: "midva/medve veva",
        p2: "vidva/vedve vesta",
        p3: "onadva/onidve vesta"
      },
      mnozina: { p1: "mi vemo", p2: "vi veste", p3: "oni/one vejo" }
    },
    pastParticiple: { m_ed: "vedel", f_ed: "vedela", m_dv: "vedela", f_dv: "vedeli", m_mn: "vedeli", f_mn: "vedele" }
  },
  "moči": {
    infinitive: "moči",
    translations: { en: "to be able to / can", de: "können", it: "potere", fr: "pouvoir", es: "poder", ru: "мочь", sr: "moći", hr: "moći", bs: "moći", sl: "moči" },
    present: {
      ednina: { p1: "jaz morem", p2: "ti moreš", p3: "on/ona more" },
      dvojina: {
        p1: "midva/medve moreva",
        p2: "vidva/vedve moreta",
        p3: "onadva/onidve moreta"
      },
      mnozina: { p1: "mi moremo", p2: "vi morete", p3: "oni/one morejo" }
    },
    pastParticiple: { m_ed: "mogel", f_ed: "mogla", m_dv: "mogla", f_dv: "mogli", m_mn: "mogli", f_mn: "mogle" }
  },
  "jesti": {
    infinitive: "jesti",
    translations: { en: "to eat", de: "essen", it: "mangiare", fr: "manger", es: "comer", ru: "есть", sr: "jesti", hr: "jesti", bs: "jesti", sl: "jesti" },
    present: {
      ednina: { p1: "jaz jem", p2: "ti ješ", p3: "on/ona je" },
      dvojina: {
        p1: "midva/medve jeva",
        p2: "vidva/vedve jesta",
        p3: "onadva/onidve jesta"
      },
      mnozina: { p1: "mi jemo", p2: "vi jeste", p3: "oni/one jedo" }
    },
    pastParticiple: { m_ed: "jedel", f_ed: "jedla", m_dv: "jedla", f_dv: "jedli", m_mn: "jedli", f_mn: "jedle" }
  },
  "dati": {
    infinitive: "dati",
    translations: { en: "to give", de: "geben", it: "dare", fr: "donner", es: "dar", ru: "дать", sr: "dati", hr: "dati", bs: "dati", sl: "dati" },
    present: {
      ednina: { p1: "jaz dam", p2: "ti daš", p3: "on/ona da" },
      dvojina: {
        p1: "midva/medve dava",
        p2: "vidva/vedve dasta",
        p3: "onadva/onidve dasta"
      },
      mnozina: { p1: "mi damo", p2: "vi daste", p3: "oni/one dajo" }
    },
    pastParticiple: { m_ed: "dal", f_ed: "dala", m_dv: "dala", f_dv: "dali", m_mn: "dali", f_mn: "dale" }
  },
  "priti": {
    infinitive: "priti",
    translations: { en: "to come", de: "kommen", it: "venire", fr: "venir", es: "venir", ru: "прийти", sr: "doći", hr: "doći", bs: "doći", sl: "priti" },
    present: {
      ednina: { p1: "jaz pridem", p2: "ti prideš", p3: "on/ona pride" },
      dvojina: {
        p1: "midva/medve prideva",
        p2: "vidva/vedve prideta",
        p3: "onadva/onidve prideta"
      },
      mnozina: { p1: "mi pridemo", p2: "vi pridete", p3: "oni/one pridejo" }
    },
    pastParticiple: { m_ed: "prišel", f_ed: "prišla", m_dv: "prišla", f_dv: "prišli", m_mn: "prišli", f_mn: "prišle" }
  },
  "vzeti": {
    infinitive: "vzeti",
    translations: { en: "to take", de: "nehmen", it: "prendere", fr: "prendre", es: "tomar", ru: "взять", sr: "uzeti", hr: "uzeti", bs: "uzeti", sl: "vzeti" },
    present: {
      ednina: { p1: "jaz vzamem", p2: "ti vzameš", p3: "on/ona vzame" },
      dvojina: {
        p1: "midva/medve vzameva",
        p2: "vidva/vedve vzameta",
        p3: "onadva/onidve vzameta"
      },
      mnozina: { p1: "mi vzamemo", p2: "vi vzamete", p3: "oni/one vzamejo" }
    },
    pastParticiple: { m_ed: "vzel", f_ed: "vzela", m_dv: "vzela", f_dv: "vzeli", m_mn: "vzeli", f_mn: "vzele" }
  },
  "reči": {
    infinitive: "reči",
    translations: { sr: "reći", hr: "reći", bs: "reći", en: "to say", de: "sagen", it: "dire", fr: "dire", es: "decir", ru: "сказать", sl: "reči" },
    present: {
      ednina: { p1: "jaz rečem", p2: "ti rečeš", p3: "on/ona reče" },
      dvojina: {
        p1: "midva/medve rečeva",
        p2: "vidva/vedve rečeta",
        p3: "onadva/onidve rečeta"
      },
      mnozina: { p1: "mi rečemo", p2: "vi rečete", p3: "oni/one rečejo" }
    },
    pastParticiple: { m_ed: "rekel", f_ed: "rekla", m_dv: "rekla", f_dv: "rekli", m_mn: "rekli", f_mn: "rekle" }
  },
  "peči": {
    infinitive: "peči",
    translations: { sr: "peći", hr: "peći", bs: "peći", en: "to bake", de: "backen", it: "cuocere", fr: "cuire", es: "hornear", ru: "печь", sl: "peči" },
    present: {
      ednina: { p1: "jaz pečem", p2: "ti pečeš", p3: "on/ona peče" },
      dvojina: {
        p1: "midva/medve pečeva",
        p2: "vidva/vedve pečeta",
        p3: "onadva/onidve pečeta"
      },
      mnozina: { p1: "mi pečemo", p2: "vi pečete", p3: "oni/one pečejo" }
    },
    pastParticiple: { m_ed: "pekel", f_ed: "pekla", m_dv: "pekla", f_dv: "pekli", m_mn: "pekli", f_mn: "pekle" }
  },
  "teči": {
    infinitive: "teči",
    translations: { sr: "trčati", hr: "trčati", bs: "trčati", en: "to run", de: "laufen", it: "correre", fr: "courir", es: "correr", ru: "бежать", sl: "teči" },
    present: {
      ednina: { p1: "jaz tečem", p2: "ti tečeš", p3: "on/ona teče" },
      dvojina: {
        p1: "midva/medve tečeva",
        p2: "vidva/vedve tečeta",
        p3: "onadva/onidve tečeta"
      },
      mnozina: { p1: "mi tečemo", p2: "vi tečete", p3: "oni/one tečejo" }
    },
    pastParticiple: { m_ed: "tekel", f_ed: "tekla", m_dv: "tekla", f_dv: "tekli", m_mn: "tekli", f_mn: "tekle" }
  },
  "leči": {
    infinitive: "leči",
    translations: { sr: "leći", hr: "leći", bs: "leći", en: "to lie down", de: "sich hinlegen", it: "sdraiarsi", fr: "s'allonger", es: "acostarse", ru: "лечь", sl: "leči" },
    present: {
      ednina: { p1: "jaz ležem", p2: "ti ležeš", p3: "on/ona leže" },
      dvojina: {
        p1: "midva/medve leževa",
        p2: "vidva/vedve ležeta",
        p3: "onadva/onidve ležeta"
      },
      mnozina: { p1: "mi ležemo", p2: "vi ležete", p3: "oni/one ležejo" }
    },
    pastParticiple: { m_ed: "legel", f_ed: "legla", m_dv: "legla", f_dv: "legli", m_mn: "legli", f_mn: "legle" }
  },
  "vreči": {
    infinitive: "vreči",
    translations: { sr: "baciti", hr: "baciti", bs: "baciti", en: "to throw", de: "werfen", it: "gettare", fr: "jeter", es: "tirar", ru: "бросить", sl: "vreči" },
    present: {
      ednina: { p1: "jaz vržem", p2: "ti vržeš", p3: "on/ona vrže" },
      dvojina: {
        p1: "midva/medve vrževa",
        p2: "vidva/vedve vržeta",
        p3: "onadva/onidve vržeta"
      },
      mnozina: { p1: "mi vržemo", p2: "vi vržete", p3: "oni/one vržejo" }
    },
    pastParticiple: { m_ed: "vrgel", f_ed: "vrgla", m_dv: "vrgla", f_dv: "vrgli", m_mn: "vrgli", f_mn: "vrgle" }
  }
};

export const verbDescriptions = {
  en: {
    persons: { p1: "1st person", p2: "2nd person", p3: "3rd person" },
    pronouns: { p1: "The two of us", p2: "The two of you", p3: "The two of them" },
    futurePronouns: { p1: "The two of us", p2: "The two of you", p3: "The two of them" },
    genderLabels: {
      m: "Masculine (midva / vidva / onadva)",
      f: "Feminine / Neuter (medve / vedve / onidve)"
    }
  },
  sl: {
    persons: { p1: "1. oseba", p2: "2. oseba", p3: "3. oseba" },
    pronouns: { p1: "Midva / medve", p2: "Vidva / vedve", p3: "Onadva / onidve" },
    futurePronouns: { p1: "Midva / medve", p2: "Vidva / vedve", p3: "Onadva / onidve" },
    genderLabels: {
      m: "Moški spol (midva / vidva / onadva)",
      f: "Ženski in srednji spol (medve / vedve / onidve)"
    }
  },
  de: {
    persons: { p1: "1. Person", p2: "2. Person", p3: "3. Person" },
    pronouns: { p1: "Wir beide", p2: "Ihr beide", p3: "Sie beide" },
    futurePronouns: { p1: "Wir beide", p2: "Ihr beide", p3: "Sie beide" },
    genderLabels: {
      m: "Maskulinum (midva / vidva / onadva)",
      f: "Femininum / Neutrum (medve / vedve / onidve)"
    }
  },
  it: {
    persons: { p1: "1ª persona", p2: "2ª persona", p3: "3ª persona" },
    pronouns: { p1: "Noi due", p2: "Voi due", p3: "Loro due" },
    futurePronouns: { p1: "Noi due", p2: "Voi due", p3: "Loro due" },
    genderLabels: {
      m: "Maschile (midva / vidva / onadva)",
      f: "Femminile / Neutro (medve / vedve / onidve)"
    }
  },
  sr: {
    persons: { p1: "1. lice", p2: "2. lice", p3: "3. lice" },
    pronouns: { p1: "Nas dvoje / nas dve", p2: "Vas dvoje / vas dve", p3: "Njih dvoje / njih dve" },
    futurePronouns: { p1: "Nas dvoje / nas dve", p2: "Vas dvoje / vas dve", p3: "Njih dvoje / njih dve" },
    genderLabels: {
      m: "Muški rod (midva / vidva / onadva)",
      f: "Ženski i srednji rod (medve / vedve / onidve)"
    }
  },
  hr: {
    persons: { p1: "1. lice", p2: "2. lice", p3: "3. lice" },
    pronouns: { p1: "Nas dvoje / nas dvije", p2: "Vas dvoje / vas dvije", p3: "Njih dvoje / njih dvije" },
    futurePronouns: { p1: "Nas dvoje / nas dvije", p2: "Vas dvoje / vas dvije", p3: "Njih dvoje / njih dvije" },
    genderLabels: {
      m: "Muški rod (midva / vidva / onadva)",
      f: "Ženski i srednji rod (medve / vedve / onidve)"
    }
  },
  bs: {
    persons: { p1: "1. lice", p2: "2. lice", p3: "3. lice" },
    pronouns: { p1: "Nas dvoje / nas dvije", p2: "Vas dvoje / vas dvije", p3: "Njih dvoje / njih dvije" },
    futurePronouns: { p1: "Nas dvoje / nas dvije", p2: "Vas dvoje / vas dvije", p3: "Njih dvoje / njih dvije" },
    genderLabels: {
      m: "Muški rod (midva / vidva / onadva)",
      f: "Ženski i srednji rod (medve / vedve / onidve)"
    }
  },
  es: {
    persons: { p1: "1.ª persona", p2: "2.ª persona", p3: "3.ª persona" },
    pronouns: { p1: "Nosotros dos", p2: "Vosotros dos", p3: "Ellos dos" },
    futurePronouns: { p1: "Nosotros dos", p2: "Vosotros dos", p3: "Ellos dos" },
    genderLabels: {
      m: "Masculino (midva / vidva / onadva)",
      f: "Femenino / Neutro (medve / vedve / onidve)"
    }
  },
  fr: {
    persons: { p1: "1re personne", p2: "2e personne", p3: "3e personne" },
    pronouns: { p1: "Nous deux", p2: "Vous deux", p3: "Eux deux" },
    futurePronouns: { p1: "Nous deux", p2: "Vous deux", p3: "Eux deux" },
    genderLabels: {
      m: "Masculin (midva / vidva / onadva)",
      f: "Féminin / Neutre (medve / vedve / onidve)"
    }
  },
  ru: {
    persons: { p1: "1-е лицо", p2: "2-е лицо", p3: "3-е лицо" },
    pronouns: { p1: "Мы вдвоём", p2: "Вы вдвоём", p3: "Они вдвоём" },
    futurePronouns: { p1: "Мы вдвоём", p2: "Вы вдвоём", p3: "Они вдвоём" },
    genderLabels: {
      m: "Мужской род (midva / vidva / onadva)",
      f: "Женский и средний род (medve / vedve / onidve)"
    }
  }
};

export function isVerbInfinitive(word) {
  if (!word) return false;
  const w = word.toLowerCase().trim();
  if (irregularVerbs[w]) return true;
  return w.endsWith('ti') || w.endsWith('či');
}

export function conjugateVerb(verb, lang = 'en') {
  const inf = verb.toLowerCase().trim();

  let present, pp;

  if (irregularVerbs[inf]) {
    const ir = irregularVerbs[inf];
    present = ir.present;
    pp = ir.pastParticiple;
  } else if (inf.endsWith('či')) {
    // Algorithmic handler for -či verbs (prefixed and stem variants)
    let presentStem, pastStem, mEdEnding = 'kel', fEdEnding = 'kla';
    if (inf.endsWith('vleči')) {
      const pfx = inf.slice(0, -5);
      presentStem = pfx + 'vleč';
      pastStem = pfx + 'vlek';
      mEdEnding = 'kel'; fEdEnding = 'kla';
    } else if (inf.endsWith('obleči')) {
      const pfx = inf.slice(0, -6);
      presentStem = pfx + 'obleč';
      pastStem = pfx + 'oblek';
      mEdEnding = 'kel'; fEdEnding = 'kla';
    } else if (inf.endsWith('sleči')) {
      const pfx = inf.slice(0, -5);
      presentStem = pfx + 'sleč';
      pastStem = pfx + 'slek';
      mEdEnding = 'kel'; fEdEnding = 'kla';
    } else if (inf.endsWith('leči')) {
      const pfx = inf.slice(0, -4);
      presentStem = pfx + 'lež';
      pastStem = pfx + 'leg';
      mEdEnding = 'gel'; fEdEnding = 'gla';
    } else if (inf.endsWith('vreči')) {
      const pfx = inf.slice(0, -5);
      presentStem = pfx + 'vrž';
      pastStem = pfx + 'vrg';
      mEdEnding = 'gel'; fEdEnding = 'gla';
    } else if (inf.endsWith('seči')) {
      const pfx = inf.slice(0, -4);
      presentStem = pfx + 'sež';
      pastStem = pfx + 'seg';
      mEdEnding = 'gel'; fEdEnding = 'gla';
    } else if (inf.endsWith('striči')) {
      const pfx = inf.slice(0, -6);
      presentStem = pfx + 'striž';
      pastStem = pfx + 'strig';
      mEdEnding = 'gel'; fEdEnding = 'gla';
    } else if (inf.endsWith('moči')) {
      const pfx = inf.slice(0, -4);
      presentStem = pfx + 'mor';
      pastStem = pfx + 'mog';
      mEdEnding = 'gel'; fEdEnding = 'gla';
    } else {
      // teči, peči, reči, and standard prefixed derivatives (izreči, poreči, preteči, speči, etc.)
      const base = inf.slice(0, -2);
      presentStem = base + 'č';
      pastStem = base;
      mEdEnding = 'kel'; fEdEnding = 'kla';
    }

    present = {
      ednina: {
        p1: `jaz ${presentStem}em`,
        p2: `ti ${presentStem}eš`,
        p3: `on/ona ${presentStem}e`
      },
      dvojina: {
        p1: `midva/medve ${presentStem}eva`,
        p2: `vidva/vedve ${presentStem}eta`,
        p3: `onadva/onidve ${presentStem}eta`
      },
      mnozina: {
        p1: `mi ${presentStem}emo`,
        p2: `vi ${presentStem}ete`,
        p3: `oni/one ${presentStem}ejo`
      }
    };

    const ppStem = (pastStem.endsWith('k') || pastStem.endsWith('g')) ? pastStem.slice(0, -1) : pastStem;
    const isVelarG = mEdEnding === 'gel';
    pp = {
      m_ed: `${ppStem}${mEdEnding}`,
      f_ed: `${ppStem}${fEdEnding}`,
      m_dv: `${ppStem}${fEdEnding}`,
      f_dv: `${ppStem}${isVelarG ? 'gli' : 'kli'}`,
      m_mn: `${ppStem}${isVelarG ? 'gli' : 'kli'}`,
      f_mn: `${ppStem}${isVelarG ? 'gle' : 'kle'}`
    };
  } else if (inf.endsWith('ovati') || inf.endsWith('evati')) {
    // E.g. delovati -> delujem
    const base = inf.slice(0, -5); // del-
    const stem = base + 'uj'; // deluj-
    const pastStem = inf.slice(0, -2); // delova-
    present = {
      ednina: {
        p1: `jaz ${stem}em`,
        p2: `ti ${stem}eš`,
        p3: `on/ona ${stem}e`
      },
      dvojina: {
        p1: `midva/medve ${stem}eva`,
        p2: `vidva/vedve ${stem}eta`,
        p3: `onadva/onidve ${stem}eta`
      },
      mnozina: {
        p1: `mi ${stem}emo`,
        p2: `vi ${stem}ete`,
        p3: `oni/one ${stem}ejo`
      }
    };
    pp = {
      m_ed: `${pastStem}l`,  // deloval
      f_ed: `${pastStem}la`, // delovala
      m_dv: `${pastStem}la`, // delovala
      f_dv: `${pastStem}li`, // delovali
      m_mn: `${pastStem}li`, // delovali
      f_mn: `${pastStem}le`  // delovale
    };
  } else if (inf.endsWith('ati')) {
    // E.g. delati -> delam
    const stem = inf.slice(0, -3); // del-
    const pastStem = inf.slice(0, -2); // dela-
    present = {
      ednina: {
        p1: `jaz ${stem}am`,
        p2: `ti ${stem}aš`,
        p3: `on/ona ${stem}a`
      },
      dvojina: {
        p1: `midva/medve ${stem}ava`,
        p2: `vidva/vedve ${stem}ata`,
        p3: `onadva/onidve ${stem}ata`
      },
      mnozina: {
        p1: `mi ${stem}amo`,
        p2: `vi ${stem}ate`,
        p3: `oni/one ${stem}ajo`
      }
    };
    pp = {
      m_ed: `${pastStem}l`,
      f_ed: `${pastStem}la`,
      m_dv: `${pastStem}la`,
      f_dv: `${pastStem}li`,
      m_mn: `${pastStem}li`,
      f_mn: `${pastStem}le`
    };
  } else if (inf.endsWith('iti')) {
    // E.g. govoriti -> govorim
    const stem = inf.slice(0, -3); // govor-
    const pastStem = inf.slice(0, -2); // govori-
    present = {
      ednina: {
        p1: `jaz ${stem}im`,
        p2: `ti ${stem}iš`,
        p3: `on/ona ${stem}i`
      },
      dvojina: {
        p1: `midva/medve ${stem}iva`,
        p2: `vidva/vedve ${stem}ita`,
        p3: `onadva/onidve ${stem}ita`
      },
      mnozina: {
        p1: `mi ${stem}imo`,
        p2: `vi ${stem}ite`,
        p3: `oni/one ${stem}ijo`
      }
    };
    pp = {
      m_ed: `${pastStem}l`,
      f_ed: `${pastStem}la`,
      m_dv: `${pastStem}la`,
      f_dv: `${pastStem}li`,
      m_mn: `${pastStem}li`,
      f_mn: `${pastStem}le`
    };
  } else if (inf.endsWith('eti')) {
    // E.g. videti -> vidim / živeti -> živim
    const stem = inf.slice(0, -3);
    const pastStem = inf.slice(0, -2);
    present = {
      ednina: {
        p1: `jaz ${stem}im`,
        p2: `ti ${stem}iš`,
        p3: `on/ona ${stem}i`
      },
      dvojina: {
        p1: `midva/medve ${stem}iva`,
        p2: `vidva/vedve ${stem}ita`,
        p3: `onadva/onidve ${stem}ita`
      },
      mnozina: {
        p1: `mi ${stem}imo`,
        p2: `vi ${stem}ite`,
        p3: `oni/one ${stem}ijo`
      }
    };
    pp = {
      m_ed: `${pastStem}l`,
      f_ed: `${pastStem}la`,
      m_dv: `${pastStem}la`,
      f_dv: `${pastStem}li`,
      m_mn: `${pastStem}li`,
      f_mn: `${pastStem}le`
    };
  } else {
    // Generic fallback for other verbs
    const stem = inf.slice(0, -2);
    present = {
      ednina: { p1: `jaz ${stem}em`, p2: `ti ${stem}eš`, p3: `on/ona ${stem}e` },
      dvojina: { p1: `midva/medve ${stem}eva`, p2: `vidva/vedve ${stem}eta`, p3: `onadva/onidve ${stem}eta` },
      mnozina: { p1: `mi ${stem}emo`, p2: `vi ${stem}ete`, p3: `oni/one ${stem}ejo` }
    };
    pp = {
      m_ed: `${stem}l`, f_ed: `${stem}la`,
      m_dv: `${stem}la`, f_dv: `${stem}li`,
      m_mn: `${stem}li`, f_mn: `${stem}le`
    };
  }

  // Preteklik (Past)
  const past = {
    ednina: {
      p1: `jaz sem ${pp.m_ed} / sem ${pp.f_ed}`,
      p2: `ti si ${pp.m_ed} / si ${pp.f_ed}`,
      p3: `on je ${pp.m_ed} / ona je ${pp.f_ed}`
    },
    dvojina: {
      moski: `midva sva ${pp.m_dv}`,
      zenski_srednji: `medve sva ${pp.f_dv}`,
      p1: `midva sva ${pp.m_dv} / medve sva ${pp.f_dv}`,
      p2: `vidva sta ${pp.m_dv} / vedve sta ${pp.f_dv}`,
      p3: `onadva sta ${pp.m_dv} / onidve sta ${pp.f_dv}`
    },
    mnozina: {
      p1: `mi smo ${pp.m_mn} / me smo ${pp.f_mn}`,
      p2: `vi ste ${pp.m_mn} / ve ste ${pp.f_mn}`,
      p3: `oni so ${pp.m_mn} / one so ${pp.f_mn}`
    }
  };

  // Prihodnjik (Future)
  const future = {
    ednina: {
      p1: `jaz bom ${pp.m_ed} / bom ${pp.f_ed}`,
      p2: `ti boš ${pp.m_ed} / boš ${pp.f_ed}`,
      p3: `on bo ${pp.m_ed} / ona bo ${pp.f_ed}`
    },
    dvojina: {
      p1: `midva bova ${pp.m_dv} / medve bova ${pp.f_dv}`,
      p2: `vidva bosta ${pp.m_dv} / vedve bosta ${pp.f_dv}`,
      p3: `onadva bosta ${pp.m_dv} / onidve bosta ${pp.f_dv}`
    },
    mnozina: {
      p1: `mi bomo ${pp.m_mn} / me bomo ${pp.f_mn}`,
      p2: `vi boste ${pp.m_mn} / ve boste ${pp.f_mn}`,
      p3: `oni bodo ${pp.m_mn} / one bodo ${pp.f_mn}`
    }
  };

  // Dedicated Dvojina Highlight summary localized to user language
  const loc = verbDescriptions[lang] || verbDescriptions.en;
  const dvojinaSummary = {
    sedanjik: [
      { person: loc.persons.p1, form: present.dvojina.p1, desc: loc.pronouns.p1, enDesc: loc.pronouns.p1, audioText: present.dvojina.p1 },
      { person: loc.persons.p2, form: present.dvojina.p2, desc: loc.pronouns.p2, enDesc: loc.pronouns.p2, audioText: present.dvojina.p2 },
      { person: loc.persons.p3, form: present.dvojina.p3, desc: loc.pronouns.p3, enDesc: loc.pronouns.p3, audioText: present.dvojina.p3 }
    ],
    preteklik: [
      {
        genderLabel: loc.genderLabels.m,
        participle: pp.m_dv,
        example: `midva sva ${pp.m_dv}`,
        p1: `midva sva ${pp.m_dv}`,
        p2: `vidva sta ${pp.m_dv}`,
        p3: `onadva sta ${pp.m_dv}`,
        audioText: `midva sva ${pp.m_dv}`
      },
      {
        genderLabel: loc.genderLabels.f,
        participle: pp.f_dv,
        example: `medve sva ${pp.f_dv}`,
        p1: `medve sva ${pp.f_dv}`,
        p2: `vedve sta ${pp.f_dv}`,
        p3: `onidve sta ${pp.f_dv}`,
        audioText: `medve sva ${pp.f_dv}`
      }
    ],
    prihodnjik: [
      { person: loc.persons.p1, form: `Midva/medve bova ${pp.m_dv}/${pp.f_dv}`, example: `midva bova ${pp.m_dv}`, desc: loc.futurePronouns.p1, enDesc: loc.futurePronouns.p1, audioText: `midva bova ${pp.m_dv}` },
      { person: loc.persons.p2, form: `Vidva/vedve bosta ${pp.m_dv}/${pp.f_dv}`, example: `vidva bosta ${pp.m_dv}`, desc: loc.futurePronouns.p2, enDesc: loc.futurePronouns.p2, audioText: `vidva bosta ${pp.m_dv}` },
      { person: loc.persons.p3, form: `Onadva/onidve bosta ${pp.m_dv}/${pp.f_dv}`, example: `onadva bosta ${pp.m_dv}`, desc: loc.futurePronouns.p3, enDesc: loc.futurePronouns.p3, audioText: `onadva bosta ${pp.m_dv}` }
    ]
  };

  return {
    infinitive: inf,
    present,
    past,
    future,
    dvojinaSummary,
    pastParticiple: pp
  };
}

export { irregularVerbs };
