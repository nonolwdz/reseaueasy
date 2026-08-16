// 1. INITIALISATION DE LA CARTE
const map = L.map('map').setView([46.4704, 2.4357], 13); 
let markers = L.layerGroup().addTo(map);

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
    
    L.marker([lat, lng]).addTo(markers).bindPopup("<b>Centre de la recherche</b>").openPopup();
    
    document.getElementById('antenna-info').innerHTML = "<i>Recherche des antennes dans un rayon de 10km...</i>";
    chercherAntennes(lat, lng);
}

// 4. GÉOLOCALISATION
document.getElementById('btn-geoloc').addEventListener('click', () => {
    if ("geolocation" in navigator) {
        document.getElementById('antenna-info').innerHTML = "<i>Recherche de votre position...</i>";
        navigator.geolocation.getCurrentPosition((position) => {
            markers.clearLayers();
            lancerRecherche(position.coords.latitude, position.coords.longitude);
        }, (erreur) => {
            document.getElementById('antenna-info').innerHTML = `<p style="color:red;">Erreur géolocalisation: ${erreur.message}. Tapez plutôt une adresse.</p>`;
        });
    } else {
        alert("Géolocalisation non supportée par votre navigateur.");
    }
});

// 5. SUGGESTIONS D'ADRESSES EN DIRECT
const inputAdresse = document.getElementById('input-adresse');
const datalist = document.getElementById('suggestions-lieux');

inputAdresse.addEventListener('input', async (e) => {
    const texte = e.target.value;
    if (texte.length < 3) return;

    try {
        const reponse = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${texte}&countrycodes=fr&limit=5`);
        const lieux = await reponse.json();
        
        datalist.innerHTML = "";
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

// 7. RÉCUPÉRATION DES ANTENNES (API Alternative stable : OpenStreetMap)
async function chercherAntennes(lat, lng) {
    const rayon = 10000; 
    
    // Requête spécifique pour trouver les antennes mobiles sur OpenStreetMap
    const query = `
        [out:json][timeout:25];
        (
          node["telecom"="antenna"](around:${rayon},${lat},${lng});
          node["man_made"="mast"]["communication:mobile_phone"="yes"](around:${rayon},${lat},${lng});
          node["man_made"="mast"]["tower:type"="communication"](around:${rayon},${lat},${lng});
        );
        out body;
    `;
    
    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;

    try {
        const reponse = await fetch(url);
        
        if (!reponse.ok) throw new Error(`Erreur réseau ${reponse.status}`);
        
        const donnees = await reponse.json();

        if (!donnees.elements || donnees.elements.length === 0) {
            document.getElementById('antenna-info').innerHTML = "<p>Aucune antenne trouvée à moins de 10km.</p>";
            return;
        }

        document.getElementById('antenna-info').innerHTML = `<i>${donnees.elements.length} antennes trouvées ! Cliquez sur les logos.</i>`;

        donnees.elements.forEach(element => {
            const antenneLat = element.lat;
            const antenneLng = element.lon;
            const tags = element.tags || {};
            
            // Sur OpenStreetMap, l'opérateur est stocké dans le tag "operator"
            const operateur = tags.operator || "Opérateur inconnu";
            let explicationTech = "📞 <b>Réseau Mobile :</b> Antenne recensée par la communauté. Idéal pour capter le réseau.";

            const icone = getIconOperateur(operateur);
            let marqueur = icone ? L.marker([antenneLat, antenneLng], { icon: icone }).addTo(markers) 
                                 : L.circleMarker([antenneLat, antenneLng], { color: "#888", radius: 8 }).addTo(markers);

            marqueur.on('click', () => {
                document.getElementById('antenna-info').innerHTML = `
                    <h3 style="margin-top:0;">${operateur}</h3>
                    <p>${explicationTech}</p>
                    <p><i>Statut : En service 🟢 (Source OSM)</i></p>
                `;
            });
        });

    } catch (erreur) {
        document.getElementById('antenna-info').innerHTML = `<p style='color:red;'><b>Erreur technique :</b> ${erreur.message}</p>`;
    }
}
