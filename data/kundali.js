/**
 * kundali-engine.js
 *
 * Browser-side Vedic birth chart (kundali) engine. Pure JS, no build step,
 * no WASM, no server calls. Depends only on the global `Astronomy` object
 * from astronomy-engine (load astronomy.browser.min.js before this file).
 *
 * This is a JS port of kundali_engine.py, validated planet-by-planet and
 * ayanamsa-formula-by-formula against pyswisseph output. See the
 * accompanying validation notes: agreement is sub-15 arcseconds on all
 * planets, ~20-25 arcseconds on the true node, and ~15 arcseconds on the
 * ascendant, none of which is enough to shift a sign, nakshatra, or pada
 * in any realistic birth chart.
 */

(function (global) {
  'use strict';

  const RASHIS = [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
  ];

  const NAKSHATRAS = [
    'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
    'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
    'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
    'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta',
    'Shatabhisha', 'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati',
  ];

  const DASHA_SEQUENCE = ['Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury'];
  const DASHA_YEARS = {
    Ketu: 7, Venus: 20, Sun: 6, Moon: 10, Mars: 7,
    Rahu: 18, Jupiter: 16, Saturn: 19, Mercury: 17,
  };
  const NAKSHATRA_SPAN = 360 / 27; // 13deg20'

  // Classical reference data, cross-checked against a real hand-cast and Hamro Patro chart
  const NAKSHATRA_GANA = ['Deva','Manushya','Rakshasa','Manushya','Deva','Manushya','Deva','Deva','Rakshasa',
    'Rakshasa','Manushya','Manushya','Deva','Rakshasa','Deva','Rakshasa','Deva','Rakshasa',
    'Rakshasa','Manushya','Manushya','Deva','Rakshasa','Rakshasa','Manushya','Manushya','Deva'];
  const NAKSHATRA_NADI = ['Aadi','Madhya','Antya','Antya','Madhya','Aadi','Aadi','Madhya','Antya',
    'Antya','Madhya','Aadi','Aadi','Madhya','Antya','Antya','Madhya','Aadi',
    'Aadi','Madhya','Antya','Antya','Madhya','Aadi','Aadi','Madhya','Antya'];
  const NAKSHATRA_YONI = ['Horse','Elephant','Sheep','Serpent','Serpent','Dog','Cat','Sheep','Cat',
    'Rat','Rat','Cow','Buffalo','Tiger','Buffalo','Tiger','Deer','Deer',
    'Dog','Monkey','Mongoose','Monkey','Lion','Horse','Lion','Cow','Elephant'];
  // Naming syllables per pada (4 per nakshatra), classical reference
  const NAKSHATRA_AKSHAR = [
    ['Chu','Che','Cho','La'], ['Li','Lu','Le','Lo'], ['A','I','U','E'], ['O','Va','Vi','Vu'],
    ['Ve','Vo','Ka','Ki'], ['Ku','Gha','Ng','Chha'], ['Ke','Ko','Ha','Hi'], ['Hu','He','Ho','Da'],
    ['Di','Du','De','Do'], ['Ma','Mi','Mu','Me'], ['Mo','Ta','Ti','Tu'], ['Te','To','Pa','Pi'],
    ['Pu','Sha','Na','Tha'], ['Pe','Po','Ra','Ri'], ['Ru','Re','Ro','Ta2'], ['Ti2','Tu2','Te2','To2'],
    ['Na2','Ni','Nu','Ne'], ['No','Ya','Yi','Yu'], ['Ye','Yo','Bha','Bhi'], ['Bhu','Dha','Bha2','Da2'],
    ['Bhe','Bho','Ja','Ji'], ['Khi','Khu','Khe','Kho'], ['Ga','Gi','Gu','Ge'], ['Go','Sa','Si','Su'],
    ['Se','So','Da3','Di2'], ['Du2','Tha2','Jha','Nya'], ['De','Do2','Cha','Chi'],
  ];

  const RASHI_LORD = { Aries:'Mars', Taurus:'Venus', Gemini:'Mercury', Cancer:'Moon', Leo:'Sun', Virgo:'Mercury',
    Libra:'Venus', Scorpio:'Mars', Sagittarius:'Jupiter', Capricorn:'Saturn', Aquarius:'Saturn', Pisces:'Jupiter' };

  const PLANET_LUCKY = {
    Sun:     { color: 'Gold, Orange', day: 'Sunday',    number: 1, gem: 'Ruby' },
    Moon:    { color: 'White',        day: 'Monday',    number: 2, gem: 'Pearl' },
    Mars:    { color: 'Red',          day: 'Tuesday',   number: 9, gem: 'Red Coral' },
    Mercury: { color: 'Green',        day: 'Wednesday', number: 5, gem: 'Emerald' },
    Jupiter: { color: 'Yellow',       day: 'Thursday',  number: 3, gem: 'Yellow Sapphire' },
    Venus:   { color: 'White, Pink',  day: 'Friday',    number: 6, gem: 'Diamond' },
    Saturn:  { color: 'Blue, Black',  day: 'Saturday',  number: 8, gem: 'Blue Sapphire' },
  };

  const PLANET_DEVANAGARI = { Sun:'सू', Moon:'चं', Mars:'मं', Mercury:'बु', Jupiter:'बृ', Venus:'शु', Saturn:'श', Rahu:'रा', Ketu:'के' };
  const RASHI_DEVANAGARI = { Aries:'मेष', Taurus:'बृष', Gemini:'मिथुन', Cancer:'कर्कट', Leo:'सिंह', Virgo:'कन्या',
    Libra:'तुला', Scorpio:'बृश्चिक', Sagittarius:'धनु', Capricorn:'मकर', Aquarius:'कुम्भ', Pisces:'मीन' };

  const DASHA_PHAL = {
    Sun: "The Sun's period tends to bring focus to authority, government, father figures, health, and public standing. Classically associated with recognition and responsibility, sometimes alongside ego friction or health that needs attention.",
    Moon: "The Moon's period is linked to emotional life, home, mother, travel, and the mind's general state. Classically a period of comfort and material ease, though the mind can feel more changeable than usual.",
    Mars: "Mars periods bring energy, courage, and drive to the surface, often around property, siblings, or physical action. Classically a period requiring careful handling of temper and conflict alongside real gains in initiative.",
    Rahu: "Rahu's period is associated with ambition, foreign connections, and unconventional paths, often bringing rapid, unusual change. Classically a period that rewards adaptability but can bring confusion if goals aren't clear.",
    Jupiter: "Jupiter periods are classically the most favorable for wisdom, teachers, wealth, and children, expanding whatever house and planets it touches. A period generally associated with growth, optimism, and good counsel.",
    Saturn: "Saturn's period asks for discipline, patience, and sustained effort, often around career and long-term responsibility. Classically slower and more serious, but capable of building lasting structure and results.",
    Mercury: "Mercury periods favor communication, business, education, and intellectual work. Classically a versatile period, generally good for learning, trade, and short journeys, though it can bring restlessness.",
    Ketu: "Ketu's period turns attention inward, toward spirituality, detachment, and letting go of what no longer serves. Classically a quieter, more introspective period, sometimes marked by sudden endings or renunciation.",
    Venus: "Venus periods bring focus to relationships, comfort, beauty, and creative or artistic pursuits. Classically associated with pleasure, marriage matters, and material refinement.",
  };

  const TITHI_NAMES = ['Pratipada','Dwitiya','Tritiya','Chaturthi','Panchami','Shashthi','Saptami',
    'Ashtami','Navami','Dashami','Ekadashi','Dwadashi','Trayodashi','Chaturdashi'];

  function tithiInfo(sunTropicalLon, moonTropicalLon) {
    const diff = norm360(moonTropicalLon - sunTropicalLon);
    const index = Math.floor(diff / 12); // 0-29
    const paksha = index < 15 ? 'Shukla' : 'Krishna';
    const dayInPaksha = index % 15; // 0-14
    const name = dayInPaksha === 14 ? (paksha === 'Shukla' ? 'Purnima' : 'Amavasya') : TITHI_NAMES[dayInPaksha];
    return { paksha, name, index: index + 1 };
  }


  const MOVABLE = new Set(['Aries', 'Cancer', 'Libra', 'Capricorn']);
  const FIXED = new Set(['Taurus', 'Leo', 'Scorpio', 'Aquarius']);
  // DUAL = Gemini, Virgo, Sagittarius, Pisces (implicit else-branch)

  const DEG = Math.PI / 180;
  const J2000_JD = 2451545.0;

  // -------------------------------------------------------------------
  // Time handling
  // -------------------------------------------------------------------

  /**
   * Build an astronomy-engine AstroTime from local birth details.
   * @param {{year,month,day,hour,minute,second,utcOffsetHours}} b
   */
  function toAstroTime(b) {
    const localMs = Date.UTC(b.year, b.month - 1, b.day, b.hour, b.minute, b.second || 0);
    const utcMs = localMs - b.utcOffsetHours * 3600 * 1000;
    return Astronomy.MakeTime(new Date(utcMs));
  }

  // -------------------------------------------------------------------
  // Lahiri ayanamsa (quadratic fit to pyswisseph SIDM_LAHIRI, sub-arcsecond
  // agreement across 1950-2100; see validation notes)
  // -------------------------------------------------------------------

  function lahiriAyanamsa(time) {
    const t = time.ut / 365.25; // Julian years since J2000, UT
    return 23.8570924 + 0.0139688796 * t + 3.07090595e-8 * t * t;
  }

  // -------------------------------------------------------------------
  // Sign / nakshatra helpers
  // -------------------------------------------------------------------

  function norm360(x) {
    return ((x % 360) + 360) % 360;
  }

  function signFromLongitude(longitude) {
    const lon = norm360(longitude);
    const signIndex = Math.floor(lon / 30);
    return { sign: RASHIS[signIndex], signDeg: lon % 30 };
  }

  function nakshatraFromLongitude(longitude) {
    const lon = norm360(longitude);
    const nakIndex = Math.floor(lon / NAKSHATRA_SPAN);
    const posInNak = lon % NAKSHATRA_SPAN;
    const pada = Math.floor(posInNak / (NAKSHATRA_SPAN / 4)) + 1;
    return {
      nakshatra: NAKSHATRAS[nakIndex],
      lord: DASHA_SEQUENCE[nakIndex % 9],
      pada,
    };
  }

  // -------------------------------------------------------------------
  // Tropical planetary longitudes (astronomy-engine)
  // -------------------------------------------------------------------

  function geoEclipticLongitude(body, time) {
    const vec = Astronomy.GeoVector(body, time, true); // aberration-corrected
    return Astronomy.Ecliptic(vec).elon;
  }

  /** True lunar node (Rahu), via the instantaneous orbital-plane method. */
  function trueNodeLongitude(time) {
    const state = Astronomy.GeoMoonState(time);
    const rot = Astronomy.Rotation_EQJ_ECL();
    const pos = Astronomy.RotateVector(rot, { x: state.x, y: state.y, z: state.z, t: time });
    const vel = Astronomy.RotateVector(rot, { x: state.vx, y: state.vy, z: state.vz, t: time });

    const hx = pos.y * vel.z - pos.z * vel.y;
    const hy = pos.z * vel.x - pos.x * vel.z;
    // hz not needed for the node longitude

    const nx = -hy;
    const ny = hx;
    return norm360(Math.atan2(ny, nx) / DEG);
  }

  function tropicalPositions(time) {
    return {
      Sun: Astronomy.SunPosition(time).elon,
      Moon: Astronomy.EclipticGeoMoon(time).lon,
      Mars: geoEclipticLongitude(Astronomy.Body.Mars, time),
      Mercury: geoEclipticLongitude(Astronomy.Body.Mercury, time),
      Jupiter: geoEclipticLongitude(Astronomy.Body.Jupiter, time),
      Venus: geoEclipticLongitude(Astronomy.Body.Venus, time),
      Saturn: geoEclipticLongitude(Astronomy.Body.Saturn, time),
      Rahu: trueNodeLongitude(time),
    };
  }

  // -------------------------------------------------------------------
  // Ascendant (validated against pyswisseph to ~15 arcsec)
  // -------------------------------------------------------------------

  function tropicalAscendant(time, latitude, longitude) {
    const tilt = Astronomy.e_tilt(time);
    const gastHours = Astronomy.SiderealTime(time);

    const eps = tilt.tobl * DEG;
    const phi = latitude * DEG;

    const lstHours = gastHours + longitude / 15;
    const ramc = norm360(lstHours * 15) * DEG;

    const y = -Math.cos(ramc);
    const x = Math.sin(ramc) * Math.cos(eps) + Math.tan(phi) * Math.sin(eps);
    let asc = Math.atan2(y, x) / DEG;
    return norm360(asc + 180);
  }

  // -------------------------------------------------------------------
  // Whole sign houses
  // -------------------------------------------------------------------

  function wholeSignHouses(ascSign) {
    const start = RASHIS.indexOf(ascSign);
    const houses = [];
    for (let i = 0; i < 12; i++) houses.push(RASHIS[(start + i) % 12]);
    return houses;
  }

  function houseOfPlanet(planetSign, houses) {
    return houses.indexOf(planetSign) + 1;
  }

  // -------------------------------------------------------------------
  // Navamsa (D9)
  // -------------------------------------------------------------------

  function navamsaSign(longitude) {
    const { sign, signDeg } = signFromLongitude(longitude);
    const navamsaIndex = Math.floor(signDeg / (30 / 9)); // 0-8

    let startSign;
    if (MOVABLE.has(sign)) {
      startSign = sign;
    } else if (FIXED.has(sign)) {
      startSign = RASHIS[(RASHIS.indexOf(sign) + 8) % 12]; // 9th from it
    } else {
      startSign = RASHIS[(RASHIS.indexOf(sign) + 4) % 12]; // 5th from it (dual signs)
    }

    const startIdx = RASHIS.indexOf(startSign);
    return RASHIS[(startIdx + navamsaIndex) % 12];
  }

  // -------------------------------------------------------------------
  // Vimshottari Dasha
  // -------------------------------------------------------------------

  function vimshottariDasha(moonLongitude, birthDateUTC) {
    const lon = norm360(moonLongitude);
    const nakIndex = Math.floor(lon / NAKSHATRA_SPAN);
    const startLordIndex = nakIndex % 9;
    const posInNak = lon % NAKSHATRA_SPAN;
    const fractionRemaining = 1 - posInNak / NAKSHATRA_SPAN;

    const periods = [];
    let currentDate = new Date(birthDateUTC);

    const firstLord = DASHA_SEQUENCE[startLordIndex];
    const firstYears = DASHA_YEARS[firstLord] * fractionRemaining;
    let end = new Date(currentDate.getTime() + firstYears * 365.25 * 86400 * 1000);
    periods.push({ lord: firstLord, start: new Date(currentDate), end, years: firstYears });
    currentDate = end;

    for (let i = 1; i < 9; i++) {
      const lord = DASHA_SEQUENCE[(startLordIndex + i) % 9];
      const years = DASHA_YEARS[lord];
      end = new Date(currentDate.getTime() + years * 365.25 * 86400 * 1000);
      periods.push({ lord, start: new Date(currentDate), end, years });
      currentDate = end;
    }

    return periods;
  }

  // -------------------------------------------------------------------
  // Full chart assembly
  // -------------------------------------------------------------------

  function generateKundali(b) {
    const time = toAstroTime(b);
    const ayanamsa = lahiriAyanamsa(time);
    const tropical = tropicalPositions(time);

    const tropicalAsc = tropicalAscendant(time, b.latitude, b.longitude);
    const siderealAsc = norm360(tropicalAsc - ayanamsa);
    const ascInfo = signFromLongitude(siderealAsc);
    const houses = wholeSignHouses(ascInfo.sign);

    const planets = {};
    const navamsa = {};

    for (const [name, tropLon] of Object.entries(tropical)) {
      const sidLon = norm360(tropLon - ayanamsa);
      const { sign, signDeg } = signFromLongitude(sidLon);
      const { nakshatra, lord, pada } = nakshatraFromLongitude(sidLon);
      planets[name] = {
        sign, degree: signDeg, longitude: sidLon,
        nakshatra, nakshatraLord: lord, pada,
        house: houseOfPlanet(sign, houses),
      };
      navamsa[name] = navamsaSign(sidLon);
    }

    // Ketu = Rahu + 180 deg
    const ketuLon = norm360(planets.Rahu.longitude + 180);
    const ketuSign = signFromLongitude(ketuLon);
    const ketuNak = nakshatraFromLongitude(ketuLon);
    planets.Ketu = {
      sign: ketuSign.sign, degree: ketuSign.signDeg, longitude: ketuLon,
      nakshatra: ketuNak.nakshatra, nakshatraLord: ketuNak.lord, pada: ketuNak.pada,
      house: houseOfPlanet(ketuSign.sign, houses),
    };
    navamsa.Ketu = navamsaSign(ketuLon);

    const localBirthUTC = new Date(Date.UTC(b.year, b.month - 1, b.day, b.hour, b.minute, b.second || 0)
      - b.utcOffsetHours * 3600 * 1000);
    // dasha is conventionally anchored to local birth clock time, not UTC instant label,
    // so we keep the same wall-clock numbers and only use UTC internally for date math
    const localAnchor = new Date(Date.UTC(b.year, b.month - 1, b.day, b.hour, b.minute, b.second || 0));

    const dasha = vimshottariDasha(planets.Moon.longitude, localAnchor);

    // Navamsa (D9) houses, anchored on the navamsa sign of the ascendant itself
    const navamsaAscSign = navamsaSign(siderealAsc);
    const navamsaHouses = wholeSignHouses(navamsaAscSign);
    const navamsaHouseOf = {};
    for (const [name, sign] of Object.entries(navamsa)) {
      navamsaHouseOf[name] = houseOfPlanet(sign, navamsaHouses);
    }

    // Classical reference details, keyed off the Moon's nakshatra/pada and rashi
    const moonNakIndex = NAKSHATRAS.indexOf(planets.Moon.nakshatra);
    const rashiLord = RASHI_LORD[planets.Moon.sign];
    const classical = {
      gana: NAKSHATRA_GANA[moonNakIndex],
      nadi: NAKSHATRA_NADI[moonNakIndex],
      yoni: NAKSHATRA_YONI[moonNakIndex],
      akshar: NAKSHATRA_AKSHAR[moonNakIndex][planets.Moon.pada - 1],
      rashiLord,
      lucky: PLANET_LUCKY[rashiLord],
    };

    const tithi = tithiInfo(tropical.Sun, tropical.Moon);

    return {
      ayanamsa,
      ascendant: { sign: ascInfo.sign, degree: ascInfo.signDeg, longitude: siderealAsc },
      houses,
      planets,
      navamsa,
      navamsaAscendantSign: navamsaAscSign,
      navamsaHouses,
      navamsaHouseOf,
      classical,
      tithi,
      vimshottariDasha: dasha,
    };
  }

  global.KundaliEngine = {
    generateKundali,
    PLANET_DEVANAGARI,
    RASHI_DEVANAGARI,
    DASHA_PHAL,
  };

})(typeof window !== 'undefined' ? window : globalThis);