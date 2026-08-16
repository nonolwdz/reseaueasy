// REMPLACE JUSTE "TON_PROJET_URL_ICI" PAR LA VRAIE ADRESSE DE TON PROJET SUPABASE
const supabaseUrl = 'https://gpyyhfxaeduuvygeekep.supabase.co';
// Ta clé publique est déjà insérée ci-dessous :
const supabaseKey = 'sb_publishable_IHUull9DWA_RlXr2csKgrg_LVQlMvbx';

// Initialisation de Supabase
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const btnLogin = document.getElementById('btn-login');
const btnSignup = document.getElementById('btn-signup');
const btnLogout = document.getElementById('btn-logout');
const userStatus = document.getElementById('user-status');
const authForms = document.getElementById('auth-forms');

// Fonction pour mettre à jour l'interface si on est connecté
async function checkUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    
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
    if (!emailInput.value || !passwordInput.value) {
        return alert("Veuillez remplir l'email et le mot de passe.");
    }
    
    const { data, error } = await supabase.auth.signUp({
        email: emailInput.value,
        password: passwordInput.value,
    });
    
    if (error) {
        alert("Erreur d'inscription : " + error.message);
    } else {
        alert("Inscription réussie ! Vous êtes maintenant connecté.");
    }
    checkUser();
});

// Connexion
btnLogin.addEventListener('click', async () => {
    if (!emailInput.value || !passwordInput.value) {
        return alert("Veuillez remplir l'email et le mot de passe.");
    }

    const { data, error } = await supabase.auth.signInWithPassword({
        email: emailInput.value,
        password: passwordInput.value,
    });
    
    if (error) {
        alert("Erreur de connexion : " + error.message);
    } 
    checkUser();
});

// Déconnexion
btnLogout.addEventListener('click', async () => {
    await supabase.auth.signOut();
    checkUser();
});

// Vérification de l'état de connexion au chargement de la page
checkUser();
