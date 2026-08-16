// 1. INITIALISATION DE LA CARTE
const map = L.map('map').setView([46.603354, 1.888334], 6); // Centré sur la France par défaut
let markers = L.layerGroup().addTo(map); // Groupe pour gérer et effacer les antennes facilement

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
}).addTo(map);

// 2. LOGOS DES OPÉRATEURS
function getIconOperateur(nomOperateur) {
    const nom = (nomOperateur || "").toUpperCase();
    let url = "";

    if (nom.includes("ORANGE")) url = "https://upload.wikimedia.org/wikipedia/commons/c/c8/Orange_logo.svg";
    else if (nom.includes("FREE")) url = "https://upload.wikimedia.org/wikipedia/commons/4/43/Free_Logo.svg";
    else if (nom.includes("SFR")) url = "https://upload.wikimedia.org/wikipedia/commons/3/30/SFR_2022.svg";
    else if (nom.includes("BOUYGUES")) url = "https://upload.wikimedia.org/wikipedia/commons/f/f6/Bouygues_Telecom_logo.svg";
    else return null; 

    return L.icon({ iconUrl: url, iconSize: [25, 25], className: 'logo-antenne' });
}

// 3. FONCTION COMMUNE POUR LANCER LA RECHERCHE
function lancerRecherche(lat, lng) {
    map.setView([lat, lng], 13);
    
    // On marque le centre de la recherche
    L.marker([lat, lng]).addTo(markers).bindPopup("<b>Centre de la recherche</b>").openPopup();
    
    document.getElementById('antenna-info').innerHTML = "<i>Recherche des antennes dans un rayon de 10km...</i>";
    chercherAntennes(lat, lng);
}

// 4. GÉOLOCALISATION
document.getElementById('btn-geoloc').addEventListener('click', () => {
    if ("geolocation" in navigator) {
        document.getElementById('antenna-info').innerHTML = "<i>Recherche de votre position... (Acceptez la demande du navigateur)</i>";
        navigator.geolocation.getCurrentPosition((position) => {
            markers.clearLayers(); // On nettoie l'ancienne recherche
            lancerRecherche(position.coords.latitude, position.coords.longitude);
        }, (erreur) => {
            document.getElementById('antenna-info').innerHTML = `<p style="color:red;">Erreur géolocalisation: ${erreur.message}. Tapez plutôt une adresse.</p>`;
        });
    } else {
        alert("Géolocalisation non supportée par votre navigateur.");
    }
});

// 5. SUGGESTIONS D'ADRESSES EN DIRECT (Auto-complétion)
const inputAdresse = document.getElementById('input-adresse');
const datalist = document.getElementById('suggestions-lieux');

inputAdresse.addEventListener('input', async (e) => {
    const texte = e.target.value;
    if (texte.length < 3) return; // On cherche à partir de 3 lettres tapées

    try {
        const reponse = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${texte}&countrycodes=fr&limit=5`);
        const lieux = await reponse.json();
        
        datalist.innerHTML = ""; // On vide les anciennes suggestions
        lieux.forEach(lieu => {
            const option = document.createElement('option');
            option.value = lieu.display_name;
            datalist.appendChild(option);
        });
    } catch (erreur) {
        console.error("Erreur avec les suggestions :", erreur);
    }
});

// 6. BOUTON DE RECHERCHE D'ADRESSE
document.getElementById('btn-search').addEventListener('click', async () => {
    const adresse = inputAdresse.value;
    if (!adresse) return;

    document.getElementById('antenna-info').innerHTML = "<i>Recherche de l'adresse en cours...</i>";

    try {
        const reponse = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${adresse}&limit=1`);
        const donnees = await reponse.json();

        if (donnees.length > 0) {
            markers.clearLayers();
            lancerRecherche(donnees[0].lat, donnees[0].lon);
        } else {
            document.getElementById('antenna-info').innerHTML = "<p>Adresse introuvable.</p>";
        }
    } catch (erreur) {
        document.getElementById('antenna-info').innerHTML = "<p>Erreur lors de la recherche de l'adresse.</p>";
    }
});

// 7. RÉCUPÉRATION DES ANTENNES (Solution infaillible avec proxy public)
async function chercherAntennes(lat, lng) {
    const rayon = 10000; 
    
    // La vraie adresse de l'ANFR
    const urlANFR = `https://data.anfr.fr/api/records/1.0/search/?dataset=observatoire_2g_3g_4g&geofilter.distance=${lat},${lng},${rayon}&rows=100`;
    
    // Le proxy public gratuit (corsproxy.io) qui fait le relais !
    const url = `https://corsproxy.io/?${encodeURIComponent(urlANFR)}`;

    try {
        const reponse = await fetch(url);
        
        if (!reponse.ok) throw new Error(`Erreur serveur ${reponse.status}`);
        
        const donnees = await reponse.json();

        if (donnees.records.length === 0) {
            document.getElementById('antenna-info').innerHTML = "<p>Aucune antenne trouvée à moins de 10km.</p>";
            return;
        }

        document.getElementById('antenna-info').innerHTML = `<i>${donnees.records.length} antennes trouvées ! Cliquez sur les logos.</i>`;

        donnees.records.forEach(record => {
            if(!record.fields || !record.fields.coordonnees) return;
            
            const antenneLat = record.fields.coordonnees[0];
            const antenneLng = record.fields.coordonnees[1];
            const operateur = record.fields.adm_lb_nom || "Inconnu";
            const technologie = record.fields.generation || "";

            let explicationTech = "";
            if (technologie.includes("5G")) explicationTech = "⚡ <b>5G (3.5 GHz) :</b> Débit ultra-rapide, mais portée courte.";
            else if (technologie.includes("4G")) explicationTech = "🚀 <b>4G :</b> Excellent compromis, bonne pénétration des murs.";
            else explicationTech = "📞 <b>2G/3G :</b> Utile pour les appels. Portée très longue.";

            const icone = getIconOperateur(operateur);
            let marqueur = icone ? L.marker([antenneLat, antenneLng], { icon: icone }).addTo(markers) 
                                 : L.circleMarker([antenneLat, antenneLng], { color: "#888", radius: 8 }).addTo(markers);

            marqueur.on('click', () => {
                document.getElementById('antenna-info').innerHTML = `
                    <h3 style="margin-top:0;">${operateur}</h3>
                    <p><b>Réseaux actifs :</b> ${technologie}</p>
                    <p>${explicationTech}</p>
                    <p><i>Statut : En service 🟢</i></p>
                `;
            });
        });

    } catch (erreur) {
        document.getElementById('antenna-info').innerHTML = `<p style='color:red;'><b>Erreur de connexion :</b> Impossible de charger les données.</p>`;
    }
}
