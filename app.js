// ==========================================
// 1. IMPORTACIONES DE FIREBASE (Agregamos deleteDoc)
// ==========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, where, doc, getDoc, setDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";

// ==========================================
// 2. CONFIGURACIÓN
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyDOiBLiOYM87sPdgSokNObi0j7FNp5alGI",
  authDomain: "portafolio-bcs.firebaseapp.com",
  projectId: "portafolio-bcs",
  storageBucket: "portafolio-bcs.firebasestorage.app",
  messagingSenderId: "230559001697",
  appId: "1:230559001697:web:caa1e87c5633e6b8e84e20",
  measurementId: "G-V6HNZT2MQY"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// ==========================================
// 3. SISTEMA DE AUTENTICACIÓN
// ==========================================
const candado = document.getElementById('abrir-login');
const btnCerrarSesion = document.getElementById('cerrar-sesion');
const btnEditarSobreMi = document.getElementById('btn-editar-sobremi');
const btnAddExp = document.getElementById('btn-add-exp');
const btnAddProy = document.getElementById('btn-add-proy');

onAuthStateChanged(auth, (user) => {
    if (user) {
        if(btnEditarSobreMi) btnEditarSobreMi.style.display = 'block';
        if(btnAddExp) btnAddExp.style.display = 'block';
        if(btnAddProy) btnAddProy.style.display = 'block';
        if(candado) candado.style.display = 'none';
        if(btnCerrarSesion) btnCerrarSesion.style.display = 'inline';
    } else {
        if(btnEditarSobreMi) btnEditarSobreMi.style.display = 'none';
        if(btnAddExp) btnAddExp.style.display = 'none';
        if(btnAddProy) btnAddProy.style.display = 'none';
        if(candado) candado.style.display = 'inline';
        if(btnCerrarSesion) btnCerrarSesion.style.display = 'none';
    }
    // Recargamos el contenido para mostrar u ocultar los botones de borrar
    cargarExperiencias();
    cargarProyectos();
});

const modalLogin = document.getElementById('login-modal');
if(candado) candado.addEventListener('click', (e) => { e.preventDefault(); modalLogin.style.display = 'flex'; });
if(document.getElementById('btn-cerrar-login')) document.getElementById('btn-cerrar-login').addEventListener('click', () => { modalLogin.style.display = 'none'; });

const btnLogin = document.getElementById('btn-login');
if(btnLogin) {
    btnLogin.addEventListener('click', async () => {
        try {
            btnLogin.textContent = "Verificando...";
            await signInWithEmailAndPassword(auth, document.getElementById('admin-email').value, document.getElementById('admin-pass').value);
            modalLogin.style.display = 'none';
        } catch (error) {
            document.getElementById('login-error').style.display = 'block';
        } finally {
            btnLogin.textContent = "Iniciar Sesión";
        }
    });
}

if(btnCerrarSesion) {
    btnCerrarSesion.addEventListener('click', async (e) => {
        e.preventDefault();
        await signOut(auth);
    });
}

// ==========================================
// 4. CMS: SOBRE MÍ
// ==========================================
const refSobreMi = doc(db, "perfil", "sobre-mi");
const textoSobreMi = document.getElementById('texto-sobremi');
const editorSobreMi = document.getElementById('editor-sobremi');
const inputSobreMi = document.getElementById('input-sobremi');

async function cargarPerfil() {
    if(!textoSobreMi) return;
    const docSnap = await getDoc(refSobreMi);
    textoSobreMi.textContent = docSnap.exists() ? docSnap.data().texto : "Perfil no configurado.";
}
cargarPerfil();

if(btnEditarSobreMi) {
    btnEditarSobreMi.addEventListener('click', () => {
        inputSobreMi.value = textoSobreMi.textContent; 
        textoSobreMi.style.display = 'none'; 
        btnEditarSobreMi.style.display = 'none'; 
        editorSobreMi.style.display = 'block'; 
    });
}

if(document.getElementById('btn-cancelar-edicion')) {
    document.getElementById('btn-cancelar-edicion').addEventListener('click', () => {
        textoSobreMi.style.display = 'block';
        btnEditarSobreMi.style.display = 'block';
        editorSobreMi.style.display = 'none';
    });
}

const btnGuardarSobreMi = document.getElementById('btn-guardar-sobremi');
if(btnGuardarSobreMi) {
    btnGuardarSobreMi.addEventListener('click', async () => {
        const nuevoTexto = inputSobreMi.value.trim();
        if(!nuevoTexto) return;
        btnGuardarSobreMi.textContent = "Guardando...";
        await setDoc(refSobreMi, { texto: nuevoTexto });
        textoSobreMi.textContent = nuevoTexto;
        textoSobreMi.style.display = 'block';
        btnEditarSobreMi.style.display = 'block';
        editorSobreMi.style.display = 'none';
        btnGuardarSobreMi.textContent = "💾 Guardar";
    });
}

// ==========================================
// 5. CMS: EXPERIENCIA LABORAL
// ==========================================
const contenedorExp = document.getElementById('contenedor-experiencia');
const modalExp = document.getElementById('modal-exp');

async function cargarExperiencias() {
    if(!contenedorExp) return;
    const querySnapshot = await getDocs(collection(db, "experiencia"));
    contenedorExp.innerHTML = '';
    
    if(querySnapshot.empty) {
        contenedorExp.innerHTML = '<p style="color:#64748b;">No hay experiencias registradas.</p>';
        return;
    }

    const esAdmin = auth.currentUser !== null; // Verifica si tienes sesión iniciada

    querySnapshot.forEach((documento) => {
        const data = documento.data();
        const id = documento.id; // ¡Capturamos el ID secreto!
        const listaTareas = data.tareas.split('-').filter(t => t.trim() !== '').map(t => `<li>${t.trim()}</li>`).join('');
        
        // Si es admin, mostramos el botón de borrar
        const btnBorrar = esAdmin ? `<button class="btn-borrar" data-id="${id}" data-col="experiencia" style="background:#ef4444; color:white; border:none; padding:5px 10px; border-radius:4px; margin-top:10px; cursor:pointer; font-weight:bold; font-size:0.8rem;">🗑️ Borrar</button>` : '';

        contenedorExp.innerHTML += `
            <div class="card-trabajo">
                <div class="empresa-header">
                    <div class="empresa-info">
                        <h4>${data.cargo}</h4>
                        <span class="link-empresa">${data.empresa}</span>
                        <span class="fecha">${data.fecha}</span>
                    </div>
                </div>
                <ul class="tareas">${listaTareas}</ul>
                ${btnBorrar}
            </div>
        `;
    });
}

if(btnAddExp) btnAddExp.addEventListener('click', () => modalExp.style.display = 'flex');
if(document.getElementById('btn-cerrar-exp')) document.getElementById('btn-cerrar-exp').addEventListener('click', () => modalExp.style.display = 'none');

const btnGuardarExp = document.getElementById('btn-guardar-exp');
if(btnGuardarExp) {
    btnGuardarExp.addEventListener('click', async () => {
        await addDoc(collection(db, "experiencia"), {
            cargo: document.getElementById('exp-cargo').value,
            empresa: document.getElementById('exp-empresa').value,
            fecha: document.getElementById('exp-fecha').value,
            tareas: document.getElementById('exp-tareas').value
        });
        modalExp.style.display = 'none';
        
        // Limpiar campos
        document.getElementById('exp-cargo').value = '';
        document.getElementById('exp-empresa').value = '';
        document.getElementById('exp-fecha').value = '';
        document.getElementById('exp-tareas').value = '';
        
        cargarExperiencias(); 
    });
}

// ==========================================
// 6. CMS: PROYECTOS
// ==========================================
const contenedorProy = document.getElementById('contenedor-proyectos');
const modalProy = document.getElementById('modal-proy');

async function cargarProyectos() {
    if(!contenedorProy) return;
    const querySnapshot = await getDocs(collection(db, "proyectos"));
    contenedorProy.innerHTML = '';
    
    if(querySnapshot.empty) {
        contenedorProy.innerHTML = '<p style="color:#64748b;">No hay proyectos registrados.</p>';
        return;
    }

    const esAdmin = auth.currentUser !== null;

    querySnapshot.forEach((documento) => {
        const data = documento.data();
        const id = documento.id;
        
        const btnBorrar = esAdmin ? `<button class="btn-borrar" data-id="${id}" data-col="proyectos" style="background:#ef4444; color:white; border:none; padding:5px 10px; border-radius:4px; margin-top:10px; cursor:pointer; font-weight:bold; font-size:0.8rem;">🗑️ Borrar</button>` : '';

        contenedorProy.innerHTML += `
            <div class="card-proyecto">
                <h4>${data.titulo}</h4>
                <p>${data.descripcion}</p>
                ${btnBorrar}
            </div>
        `;
    });
}

if(btnAddProy) btnAddProy.addEventListener('click', () => modalProy.style.display = 'flex');
if(document.getElementById('btn-cerrar-proy')) document.getElementById('btn-cerrar-proy').addEventListener('click', () => modalProy.style.display = 'none');

const btnGuardarProy = document.getElementById('btn-guardar-proy');
if(btnGuardarProy) {
    btnGuardarProy.addEventListener('click', async () => {
        await addDoc(collection(db, "proyectos"), {
            titulo: document.getElementById('proy-titulo').value,
            descripcion: document.getElementById('proy-desc').value
        });
        modalProy.style.display = 'none';
        
        // Limpiar campos
        document.getElementById('proy-titulo').value = '';
        document.getElementById('proy-desc').value = '';
        
        cargarProyectos(); 
    });
}

// ==========================================
// 7. MOTOR DE ELIMINACIÓN (El poder de borrar)
// ==========================================
// Escuchamos los clics en toda la página, pero actuamos solo si es un botón de borrar
document.addEventListener('click', async (e) => {
    if(e.target.classList.contains('btn-borrar')) {
        const idSecreto = e.target.getAttribute('data-id');
        const coleccion = e.target.getAttribute('data-col');
        
        // Pequeña medida de seguridad para evitar clics accidentales
        if(confirm("¿Estás seguro de que quieres borrar este registro? Esta acción no se puede deshacer.")) {
            try {
                // Orden de destrucción a Firebase
                await deleteDoc(doc(db, coleccion, idSecreto));
                
                // Recargar visualmente la sección afectada
                if(coleccion === 'experiencia') cargarExperiencias();
                if(coleccion === 'proyectos') cargarProyectos();
            } catch (error) {
                console.error("Error al borrar:", error);
                alert("Hubo un error al intentar borrar el documento.");
            }
        }
    }
});

// ==========================================
// 8. GESTIÓN DE RECOMENDACIONES (Lectura y Envío)
// ==========================================
const formRecom = document.getElementById('form-recomendacion');
if(document.getElementById('btn-abrir-form')) document.getElementById('btn-abrir-form').addEventListener('click', (e) => { e.preventDefault(); formRecom.style.display = 'block'; });
if(document.getElementById('btn-cancelar-recom')) document.getElementById('btn-cancelar-recom').addEventListener('click', () => formRecom.style.display = 'none');

const btnEnviarRecom = document.getElementById('btn-enviar-recom');
if(btnEnviarRecom) {
    btnEnviarRecom.addEventListener('click', async () => {
        const nombre = document.getElementById('nombre-recom').value.trim();
        const cargo = document.getElementById('cargo-recom').value.trim();
        const texto = document.getElementById('texto-recom').value.trim();
        if(!nombre || !cargo || !texto) return;

        btnEnviarRecom.textContent = "Enviando...";
        await addDoc(collection(db, "recomendaciones"), { nombre, cargo, texto, estado: "pendiente", fecha: new Date().toISOString() });
        alert("¡Recomendación enviada con éxito!");
        formRecom.style.display = 'none';
        btnEnviarRecom.textContent = "Enviar para revisión";
        
        document.getElementById('nombre-recom').value = '';
        document.getElementById('cargo-recom').value = '';
        document.getElementById('texto-recom').value = '';
    });
}

async function cargarRecomendaciones() {
    const cont = document.querySelector('.grid-recomendaciones');
    if(!cont) return;
    const resultados = await getDocs(query(collection(db, "recomendaciones"), where("estado", "==", "aprobado")));
    if (!resultados.empty) {
        cont.innerHTML = ''; 
        resultados.forEach((documento) => {
            const data = documento.data();
            const iniciales = data.nombre.substring(0, 2).toUpperCase();
            cont.innerHTML += `
                <div class="card-recomendacion">
                    <div class="perfil-recomienda">
                        <div class="avatar">${iniciales}</div>
                        <div><strong>${data.nombre}</strong><span>${data.cargo}</span></div>
                    </div>
                    <p class="texto-recomendacion">"${data.texto}"</p>
                    <span class="fecha-recom">Perfil Validado</span>
                </div>
            `;
        });
    }
}
cargarRecomendaciones();

// ==========================================
// 9. ENRUTADOR DINÁMICO (SISTEMA SPA)
// ==========================================
const enlacesNav = document.querySelectorAll('.nav-links a');
const todasLasVistas = document.querySelectorAll('header, .seccion');

function alternarVistas(idDestino) {
    // 1. Alternar la visibilidad de las secciones
    todasLasVistas.forEach(vista => {
        if (`#${vista.id}` === idDestino) {
            vista.classList.add('activa');
        } else {
            vista.classList.remove('activa');
        }
    });

    // 2. Alternar el estado activo en los botones del menú
    enlacesNav.forEach(enlace => {
        if (enlace.getAttribute('href') === idDestino) {
            enlace.classList.add('activo');
        } else {
            enlace.classList.remove('activo');
        }
    });
}

// Escuchar los clics en la barra de navegación
enlacesNav.forEach(enlace => {
    enlace.addEventListener('click', (e) => {
        const idDestino = enlace.getAttribute('href');
        
        // Si el enlace apunta a un ID interno (ej. #proyectos)
        if (idDestino.startsWith('#')) {
            e.preventDefault();
            alternarVistas(idDestino);
            
            // Actualiza la URL en el navegador de forma limpia sin recargar la página
            history.pushState(null, null, idDestino);
        }
    });
});

// Detectar la vista inicial al cargar la página (por si entran directo a un enlace o por defecto al Inicio)
const hashInicial = window.location.hash || '#inicio';
alternarVistas(hashInicial);


// ==========================================
// 10. CMS: SECCIÓN DE INICIO (HEADER / CONTACTO)
// ==========================================
const refInicio = doc(db, "perfil", "inicio");

// Referencias HTML
const imgFoto = document.getElementById('inicio-foto');
const txtSubtitulo = document.getElementById('inicio-subtitulo');
const txtUbicacion = document.getElementById('inicio-ubicacion');
const linkEmail = document.getElementById('inicio-email');
const linkLinkedin = document.getElementById('inicio-linkedin');
const linkGithub = document.getElementById('inicio-github');
const txtLogros = document.getElementById('inicio-logros'); // NUEVO

const modalInicio = document.getElementById('modal-inicio');
const btnEditarInicio = document.getElementById('btn-editar-inicio');
const btnCerrarInicio = document.getElementById('btn-cerrar-inicio');
const btnGuardarInicio = document.getElementById('btn-guardar-inicio');

// Vigilar si el Admin entra
onAuthStateChanged(auth, (user) => {
    if (user && btnEditarInicio) {
        btnEditarInicio.style.display = 'block';
    } else if (btnEditarInicio) {
        btnEditarInicio.style.display = 'none';
    }
});

// Cargar los datos desde Firebase al abrir la página
async function cargarInicio() {
    if(!imgFoto) return;
    try {
        const docSnap = await getDoc(refInicio);
        if (docSnap.exists()) {
            const data = docSnap.data();
            if(data.foto) imgFoto.src = data.foto;
            if(data.subtitulo) txtSubtitulo.textContent = data.subtitulo;
            if(data.ubicacion) txtUbicacion.textContent = data.ubicacion;
            if(data.email) linkEmail.href = `mailto:${data.email}`;
            if(data.linkedin) linkLinkedin.href = data.linkedin;
            if(data.github) linkGithub.href = data.github;
            if(data.logros) txtLogros.textContent = data.logros; // NUEVO
        }
    } catch(e) { console.error("Error al cargar inicio:", e); }
}
cargarInicio();

// Abrir modal y rellenar con los datos actuales
if(btnEditarInicio) {
    btnEditarInicio.addEventListener('click', () => {
        document.getElementById('edit-foto').value = imgFoto.src;
        document.getElementById('edit-subtitulo').value = txtSubtitulo.textContent;
        document.getElementById('edit-ubicacion').value = txtUbicacion.textContent;
        document.getElementById('edit-email').value = linkEmail.href.replace('mailto:', '');
        document.getElementById('edit-linkedin').value = linkLinkedin.href;
        document.getElementById('edit-github').value = linkGithub.href;
        document.getElementById('edit-logros').value = txtLogros.textContent; // NUEVO
        
        modalInicio.style.display = 'flex';
    });
}

// Cerrar modal
if(btnCerrarInicio) btnCerrarInicio.addEventListener('click', () => modalInicio.style.display = 'none');

// Guardar cambios en Firebase
if(btnGuardarInicio) {
    btnGuardarInicio.addEventListener('click', async () => {
        const data = {
            foto: document.getElementById('edit-foto').value.trim() || 'https://via.placeholder.com/160',
            subtitulo: document.getElementById('edit-subtitulo').value.trim(),
            ubicacion: document.getElementById('edit-ubicacion').value.trim(),
            email: document.getElementById('edit-email').value.trim(),
            linkedin: document.getElementById('edit-linkedin').value.trim(),
            github: document.getElementById('edit-github').value.trim(),
            logros: document.getElementById('edit-logros').value.trim() // NUEVO
        };

        btnGuardarInicio.textContent = "Guardando...";
        try {
            await setDoc(refInicio, data);
            
            // Actualizar vista al instante
            imgFoto.src = data.foto;
            txtSubtitulo.textContent = data.subtitulo;
            txtUbicacion.textContent = data.ubicacion;
            linkEmail.href = `mailto:${data.email}`;
            linkLinkedin.href = data.linkedin;
            linkGithub.href = data.github;
            txtLogros.textContent = data.logros; // NUEVO
            
            modalInicio.style.display = 'none';
        } catch (error) {
            console.error("Error:", error);
            alert("Hubo un problema al guardar los datos.");
        } finally {
            btnGuardarInicio.textContent = "Guardar";
        }
    });
}