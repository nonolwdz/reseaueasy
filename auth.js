// Remplace ces valeurs par celles de ton projet Supabase
const supabaseUrl = 'https://TON_PROJET.supabase.co';
const supabaseKey = 'TA_CLE_PUBLIQUE';

// Initialisation (Ne s'activera que quand tu auras mis tes clés)
let supabase;
try {
    supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
} catch (e) {
    console.warn("Supabase n'est pas encore configuré.");
}

const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const btnLogin = document.getElementById('btn-login');
const btnSignup = document.getElementById('btn-signup');
const btnLogout = document.getElementById('btn-logout');
const userStatus = document.getElementById('user-status');
const authForms = document.getElementById('auth-forms');

// Fonction pour mettre à jour l'interface si on est connecté
async function checkUser() {
    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
        userStatus.innerHTML = `Connecté : ${user.email}`;
        authForms.style.display = "none";
        btnLogout.style.display = "block";
    } else {
        userStatus.innerHTML = "Non connecté";
        authForms.style.display = "block";
        btnLogout.style.display = "none";
    }
}

// Inscription
btnSignup.addEventListener('click', async () => {
    if (!supabase) return alert("Configure tes clés Supabase d'abord !");
    const { data, error } = await supabase.auth.signUp({
        email: emailInput.value,
        password: passwordInput.value,
    });
    if (error) alert("Erreur d'inscription: " + error.message);
    else alert("Inscription réussie ! Vérifie tes emails.");
    checkUser();
});

// Connexion
btnLogin.addEventListener('click', async () => {
    if (!supabase) return alert("Configure tes clés Supabase d'abord !");
    const { data, error } = await supabase.auth.signInWithPassword({
        email: emailInput.value,
        password: passwordInput.value,
    });
    if (error) alert("Erreur de connexion: " + error.message);
    checkUser();
});

// Déconnexion
btnLogout.addEventListener('click', async () => {
    await supabase.auth.signOut();
    checkUser();
});

// Vérifier au lancement de la page
checkUser();
