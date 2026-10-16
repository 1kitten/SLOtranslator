// Slovenian Verb Conjugator Engine
// Specifically designed for dual (dvojina), singular (ednina), and plural (množina)
// across Sedanjik (Present), Preteklik (Past), and Prihodnjik (Future)

const irregularVerbs = {
  "biti": {
    infinitive: "biti",
    translations: { sr: "biti", hr: "biti", bs: "biti", en: "to be", de: "sein", it: "essere", fr: "être", es: "ser/estar", ru: "быть" },
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
    translations: { sr: "ići", hr: "ići", bs: "ići", en: "to go", de: "gehen", it: "andare", fr: "aller", es: "ir", ru: "идти" },
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
    translations: { sr: "imati", hr: "imati", bs: "imati", en: "to have", de: "haben", it: "avere", fr: "avoir", es: "tener", ru: "иметь" },
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
  }
};

export function isVerbInfinitive(word) {
  if (!word) return false;
  const w = word.toLowerCase().trim();
  if (irregularVerbs[w]) return true;
  return w.endsWith('ti') || w.endsWith('či');
}

export function conjugateVerb(verb) {
  const inf = verb.toLowerCase().trim();

  let present, pp;

  if (irregularVerbs[inf]) {
    const ir = irregularVerbs[inf];
    present = ir.present;
    pp = ir.pastParticiple;
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

  // Dedicated Dvojina Highlight summary matching the user's uploaded photo exactly!
  const dvojinaSummary = {
    sedanjik: [
      { person: "1. oseba", form: present.dvojina.p1, enDesc: "The two of us work", audioText: present.dvojina.p1 },
      { person: "2. oseba", form: present.dvojina.p2, enDesc: "The two of you work", audioText: present.dvojina.p2 },
      { person: "3. oseba", form: present.dvojina.p3, enDesc: "The two of them work", audioText: present.dvojina.p3 }
    ],
    preteklik: [
      {
        genderLabel: "Masculine (Moški spol - onadva/midva/vidva)",
        participle: pp.m_dv,
        example: `midva sva ${pp.m_dv}`,
        p1: `midva sva ${pp.m_dv}`,
        p2: `vidva sta ${pp.m_dv}`,
        p3: `onadva sta ${pp.m_dv}`,
        audioText: `midva sva ${pp.m_dv}`
      },
      {
        genderLabel: "Feminine/Neuter (Ženski in srednji spol - onidve/medve/vedve)",
        participle: pp.f_dv,
        example: `medve sva ${pp.f_dv}`,
        p1: `medve sva ${pp.f_dv}`,
        p2: `vedve sta ${pp.f_dv}`,
        p3: `onidve sta ${pp.f_dv}`,
        audioText: `medve sva ${pp.f_dv}`
      }
    ],
    prihodnjik: [
      { person: "1. oseba", form: `Midva/medve bova ${pp.m_dv}/${pp.f_dv}`, example: `midva bova ${pp.m_dv}`, enDesc: "The two of us will work", audioText: `midva bova ${pp.m_dv}` },
      { person: "2. oseba", form: `Vidva/vedve bosta ${pp.m_dv}/${pp.f_dv}`, example: `vidva bosta ${pp.m_dv}`, enDesc: "The two of you will work", audioText: `vidva bosta ${pp.m_dv}` },
      { person: "3. oseba", form: `Onadva/onidve bosta ${pp.m_dv}/${pp.f_dv}`, example: `onadva bosta ${pp.m_dv}`, enDesc: "The two of them will work", audioText: `onadva bosta ${pp.m_dv}` }
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
