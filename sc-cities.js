/* ============================================================
   sc-cities.js — Ghana city list (shared by search filters,
   the pro-registration form and the travel-distance matcher)

   88 population centres across all 16 regions. Each entry:
   [name, approxKmFromAccra, region]. The km value feeds the
   near-first matching hub table (sc-api.js / data-store.js);
   the region tag groups the registration dropdown (optgroup).
   New cities can be appended without touching the matching
   engine — include all three fields.
   ============================================================ */

window.SC_CITIES = [
    // Greater Accra
    ['Accra', 0, 'Greater Accra'], ['Osu', 5, 'Greater Accra'], ['Labone', 6, 'Greater Accra'],
    ['Cantonments', 7, 'Greater Accra'], ['Airport Residential', 8, 'Greater Accra'],
    ['East Legon', 12, 'Greater Accra'], ['Madina', 16, 'Greater Accra'], ['Adenta', 19, 'Greater Accra'],
    ['Teshie', 14, 'Greater Accra'], ['Nungua', 17, 'Greater Accra'], ['Sakumono', 20, 'Greater Accra'],
    ['Spintex', 15, 'Greater Accra'], ['Dansoman', 9, 'Greater Accra'], ['Achimota', 8, 'Greater Accra'],
    ['Tesano', 10, 'Greater Accra'], ['Ablekuma', 13, 'Greater Accra'], ['Weija', 18, 'Greater Accra'],
    ['Gbawe', 16, 'Greater Accra'], ['Haatso', 14, 'Greater Accra'], ['Dome', 15, 'Greater Accra'],
    ['Tema', 27, 'Greater Accra'], ['Ashaiman', 30, 'Greater Accra'], ['Amasaman', 32, 'Greater Accra'],
    ['Ada', 110, 'Greater Accra'], ['Legon', 11, 'Greater Accra'],
    // Central (Kasoa sits on the Central side of the Accra border)
    ['Cape Coast', 138, 'Central'], ['Elmina', 145, 'Central'], ['Winneba', 62, 'Central'],
    ['Swedru', 82, 'Central'], ['Mankessim', 95, 'Central'], ['Assin Fosu', 175, 'Central'],
    ['Dunkwa-On-Offin', 210, 'Central'], ['Kasoa', 33, 'Central'],
    // Western / Western North
    ['Takoradi', 226, 'Western'], ['Sekondi', 229, 'Western'], ['Tarkwa', 270, 'Western'],
    ['Axim', 280, 'Western'], ['Bibiani', 320, 'Western North'],
    // Ashanti
    ['Kumasi', 253, 'Ashanti'], ['Obuasi', 315, 'Ashanti'], ['Ejisu', 265, 'Ashanti'],
    ['Konongo', 230, 'Ashanti'], ['Mampong', 320, 'Ashanti'], ['Bekwai', 300, 'Ashanti'],
    ['Agogo', 305, 'Ashanti'],
    // Eastern (Nsawam is Eastern, not Greater Accra)
    ['Koforidua', 82, 'Eastern'], ['Nkawkaw', 145, 'Eastern'], ['Akosombo', 100, 'Eastern'],
    ['Suhum', 105, 'Eastern'], ['Begoro', 100, 'Eastern'], ['Kyebi', 70, 'Eastern'],
    ['Oda', 175, 'Eastern'], ['Nkawkaw Kwahu', 150, 'Eastern'], ['Nsawam', 44, 'Eastern'],
    // Volta / Oti
    ['Ho', 175, 'Volta'], ['Keta', 135, 'Volta'], ['Aflao', 185, 'Volta'],
    ['Hohoe', 230, 'Volta'], ['Kpando', 215, 'Volta'],
    ['Dambai', 420, 'Oti'], ['Nkwanta', 460, 'Oti'], ['Worawora', 320, 'Oti'],
    // Northern / North East / Savannah
    ['Tamale', 610, 'Northern'], ['Yendi', 700, 'Northern'], ['Savelugu', 595, 'Northern'],
    ['Gushegu', 690, 'Northern'],
    ['Walewale', 680, 'North East'],
    ['Damongo', 590, 'Savannah'], ['Salaga', 430, 'Savannah'], ['Bole', 640, 'Savannah'],
    // Upper East
    ['Bolgatanga', 790, 'Upper East'], ['Navrongo', 810, 'Upper East'], ['Bawku', 870, 'Upper East'],
    ['Paga', 815, 'Upper East'], ['Zuarungu', 795, 'Upper East'],
    // Upper West
    ['Wa', 745, 'Upper West'], ['Tumu', 620, 'Upper West'], ['Lawra', 800, 'Upper West'],
    // Bono / Bono East / Ahafo
    ['Sunyani', 340, 'Bono'], ['Berekum', 390, 'Bono'], ['Dormaa Ahenkro', 420, 'Bono'],
    ['Wenchi', 390, 'Bono'],
    ['Techiman', 400, 'Bono East'], ['Kintampo', 480, 'Bono East'], ['Atebubu', 350, 'Bono East'],
    ['Goaso', 380, 'Ahafo'], ['Bechem', 360, 'Ahafo'], ['Hwidiem', 395, 'Ahafo']
];
