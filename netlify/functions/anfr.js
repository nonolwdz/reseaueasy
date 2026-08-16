exports.handler = async function(event, context) {
    try {
        // Sécurité si les paramètres sont vides
        const params = event.queryStringParameters || {};
        const lat = params.lat || '46.4704';
        const lng = params.lng || '2.4357';
        const rayon = 10000; // 10 km
        
        const urlANFR = `https://data.anfr.fr/d4c/api/records/1.0/search/?dataset=observatoire_2g_3g_4g&resource_id=88ef0887-6b0f-4d3f-8545-6d64c8f597da&geofilter.distance=coordonnees,${lat},${lng},${rayon}&rows=50`;

        const response = await fetch(urlANFR);
        
        if (!response.ok) {
            throw new Error(`Erreur ANFR ${response.status}`);
        }

        const data = await response.json();

        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ error: error.message })
        };
    }
};
