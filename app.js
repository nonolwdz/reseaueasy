// 1. INITIALISATION DE LA CARTE
const map = L.map('map').setView([46.4704, 2.4357], 13);
let markers = L.layerGroup().addTo(map);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
}).addTo(map);

// 2. COULEURS PAR OPÉRATEUR
function getCouleurOperateur(nomOperateur) {
    const nom = (nomOperateur || "").toUpperCase();
    if (nom.includes("ORANGE")) return "#ff7900";   // Orange
    if (nom.includes("FREE")) return "#e2001a";     // Rouge Free
    if (nom.includes("SFR")) return "#ea0000";      // Rouge SFR
    if (nom.includes("BOUYGUES")) return "#004b93"; // Bleu Bouygues
    return "#888888";                               // Gris
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

// 7. RÉCUPÉRATION DES ANTENNES (Avec analyse sécurisée du texte brut)
async function chercherAntennes(lat, lng) {
    document.getElementById('antenna-info').innerHTML = "<i>Chargement des antennes...</i>";
    
    const url = `/.netlify/functions/anfr?lat=${lat}&lng=${lng}`;

    try {
        const reponse = await fetch(url);
        const texteBrut = await reponse.text();
        
        let donnees;
        try {
            donnees = JSON.parse(texteBrut);
        } catch (e) {
            throw new Error("Le serveur Netlify renvoie une page d'erreur au lieu du JSON : " + texteBrut.substring(0, 80));
        }

        if (!donnees.records || donnees.records.length === 0) {
            document.getElementById('antenna-info').innerHTML = "<p>Aucune antenne trouvée à moins de 10km.</p>";
            return;
        }

        let antennesAffichees = 0;

        donnees.records.forEach(record => {
            let antenneLat = null;
            let antenneLng = null;

            if (record.geometry && record.geometry.coordinates) {
                antenneLng = record.geometry.coordinates[0];
                antenneLat = record.geometry.coordinates[1];
            } else if (record.fields) {
                if (Array.isArray(record.fields.coordonnees)) {
                    antenneLat = record.fields.coordonnees[0];
                    antenneLng = record.fields.coordonnees[1];
                } else if (record.fields.geo_point_2d) {
                    antenneLat = record.fields.geo_point_2d.lat;
                    antenneLng = record.fields.geo_point_2d.lon;
                }
            }

            if (!antenneLat || !antenneLng) return;

            antennesAffichees++;

            const fields = record.fields || {};
            const operateur = fields.adm_lb_nom || "Inconnu";
            const technologie = fields.generation || "";

            let explicationTech = "";
            if (technologie.includes("5G")) explicationTech = "⚡ <b>5G (3.5 GHz) :</b> Débit ultra-rapide, mais portée courte.";
            else if (technologie.includes("4G")) explicationTech = "🚀 <b>4G :</b> Excellent compromis, bonne pénétration des murs.";
            else explicationTech = "📞 <b>2G/3G :</b> Utile pour les appels. Portée très longue.";

            const couleur = getCouleurOperateur(operateur);
            const marqueur = L.circleMarker([antenneLat, antenneLng], {
                color: '#ffffff',
                fillColor: couleur,
                fillOpacity: 0.9,
                radius: 8,
                weight: 2
            }).addTo(markers);

            marqueur.on('click', () => {
                document.getElementById('antenna-info').innerHTML = `
                    <h3 style="margin-top:0; color:${couleur};">${operateur}</h3>
                    <p><b>Réseaux actifs :</b> ${technologie}</p>
                    <p>${explicationTech}</p>
                    <p><i>Statut : En service 🟢</i></p>
                `;
            });
        });

        document.getElementById('antenna-info').innerHTML = `<i>${antennesAffichees} antennes affichées sur la carte ! Cliquez dessus.</i>`;

    } catch (erreur) {
        console.error("Erreur technique:", erreur);
        document.getElementById('antenna-info').innerHTML = `<p style='color:red;'><b>Erreur technique :</b> ${erreur.message}</p>`;
    }
}
