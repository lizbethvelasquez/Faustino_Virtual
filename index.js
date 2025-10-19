/**
 * Sistema de Gestión Escolar
 *
 * Esta aplicación simula un sistema de gestión escolar completo con tres roles de usuario:
 * 1. Dirección: Control total sobre cursos, alumnos, notas y permisos.
 * 2. Profesor: Gestiona las notas de los alumnos en sus cursos asignados.
 * 3. Alumno: Consulta sus propias notas por materia.
 *
 * La persistencia de datos se realiza a través de una API de Google Apps Script
 * conectada a una Hoja de Cálculo de Google.
 */
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
// --- CONFIGURACIÓN DE LA API ---
// PEGA AQUÍ LA URL DE TU APLICACIÓN WEB DE GOOGLE APPS SCRIPT
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbzek8PTHa6_Wb-rsai5GFAH1SUxx3ihpnJJvOq_1cIFYHNi2adgCleAFnBZPJ_igU5c/exec';
// --- COMPONENTES DE LA APLICACIÓN ---
// Splash Screen
const SplashScreen = ({ message }) => (React.createElement("div", { className: `splash-screen` },
    React.createElement("svg", { className: "splash-logo", width: "100", height: "100", viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg" },
        React.createElement("path", { d: "M12 2L2 7V17L12 22L22 17V7L12 2Z", stroke: "white", strokeWidth: "2", strokeLinejoin: "round" }),
        React.createElement("path", { d: "M12 11V22", stroke: "white", strokeWidth: "2" }),
        React.createElement("path", { d: "M10 8.5C10 7.67 10.67 7 11.5 7H13C13.83 7 14.5 7.67 14.5 8.5C14.5 9.33 13.83 10 13 10H12V12H14", stroke: "white", strokeWidth: "1.5" })),
    React.createElement("h1", { className: "splash-title" }, "FaustinoVirtual"),
    React.createElement("p", { className: "splash-message" }, message)));
// Indicador de guardado
const SavingIndicator = ({ status }) => {
    const [isVisible, setIsVisible] = useState(false);
    useEffect(() => {
        setIsVisible(status.type !== 'idle');
    }, [status.type]);
    return (React.createElement("div", { className: `saving-indicator ${status.type} ${isVisible ? 'visible' : ''}` },
        React.createElement("div", { className: "spinner-container" },
            status.type === 'saving' && React.createElement("div", { className: "spinner" }),
            status.type === 'success' && React.createElement("div", { className: "checkmark" }, "\u2713"),
            status.type === 'error' && React.createElement("div", { className: "crossmark" }, "\u00D7")),
        React.createElement("span", null, status.message)));
};
// Modal Genérico
const Modal = ({ children, onClose }) => (React.createElement("div", { className: "modal-overlay" },
    React.createElement("div", { className: "modal-content" },
        React.createElement("button", { className: "modal-close", onClick: onClose }, "\u00D7"),
        children)));
// Modal de Confirmación
const ConfirmationModal = ({ message, onConfirm, onCancel }) => (React.createElement(Modal, { onClose: onCancel },
    React.createElement("div", { className: "confirmation-modal" },
        React.createElement("h2", null, "Confirmaci\u00F3n"),
        React.createElement("p", null, message),
        React.createElement("div", { className: "confirmation-actions" },
            React.createElement("button", { className: "btn-cancel", onClick: onCancel }, "No"),
            React.createElement("button", { className: "btn-confirm-delete", onClick: onConfirm }, "S\u00ED")))));
// Componente para la pantalla de inicio de sesión
const LoginScreen = ({ onLogin, appData, onDataChange }) => {
    const { usuarios, alumnos } = appData;
    const [role, setRole] = useState('Dirección');
    const [user, setUser] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const errorTimeoutRef = useRef(null);
    useEffect(() => {
        // Cleanup timeout on component unmount
        return () => {
            if (errorTimeoutRef.current) {
                clearTimeout(errorTimeoutRef.current);
            }
        };
    }, []);
    const handleLogin = () => {
        if (errorTimeoutRef.current) {
            clearTimeout(errorTimeoutRef.current);
        }
        setError('');
        let foundUser;
        if (role === 'Alumno') {
            foundUser = alumnos.find((a) => a.nombre === user && a.ci === password);
            if (foundUser) {
                onLogin({
                    id_usuario: foundUser.id_alumno,
                    nombre: foundUser.nombre,
                    rol: 'Alumno',
                    ci: foundUser.ci,
                    contraseña: foundUser.ci,
                });
                return;
            }
        }
        else {
            foundUser = usuarios.find((u) => u.rol === role &&
                u.usuario === user &&
                u.contraseña === password);
            if (foundUser) {
                onLogin(foundUser);
                return;
            }
        }
        setError('Usuario o contraseña incorrectos');
        onDataChange(appData); // Actualizar DB en error
        errorTimeoutRef.current = window.setTimeout(() => {
            setError('');
        }, 2000);
    };
    return (React.createElement("div", { className: "login-container" },
        React.createElement("div", { className: "login-box" },
            React.createElement("h2", null, "Iniciar Sesi\u00F3n"),
            React.createElement("div", { className: "input-group" },
                React.createElement("label", { htmlFor: "role" }, "Rol"),
                React.createElement("select", { id: "role", value: role, onChange: (e) => setRole(e.target.value) },
                    React.createElement("option", { value: "Direcci\u00F3n" }, "Direcci\u00F3n"),
                    React.createElement("option", { value: "Profesor" }, "Profesor"),
                    React.createElement("option", { value: "Alumno" }, "Alumno"))),
            React.createElement("div", { className: "input-group" },
                React.createElement("label", { htmlFor: "user" }, role === 'Alumno' ? 'Nombre Completo' : 'Usuario'),
                React.createElement("input", { type: "text", id: "user", value: user, onChange: (e) => setUser(e.target.value) })),
            React.createElement("div", { className: "input-group" },
                React.createElement("label", { htmlFor: "password" }, role === 'Alumno' ? 'CI' : 'Contraseña'),
                React.createElement("input", { type: "password", id: "password", value: password, onChange: (e) => setPassword(e.target.value) })),
            error && React.createElement("p", { className: "error-message" }, error),
            React.createElement("button", { onClick: handleLogin }, "Iniciar Sesi\u00F3n"),
            React.createElement("div", { className: "credentials-hint" },
                React.createElement("p", null, "Contacte a Direcci\u00F3n para sus credenciales."),
                React.createElement("p", null, "Si est\u00E1 probando, aseg\u00FArese de haber poblado la hoja de c\u00E1lculo de Google con datos de usuario.")))));
};
// --- PANELES POR ROL ---
const AlumnoDashboard = ({ user, onLogout, appData }) => {
    const studentData = useMemo(() => appData.alumnos.find(a => a.id_alumno === user.id_usuario), [appData.alumnos, user.id_usuario]);
    return (React.createElement("div", { className: "dashboard" },
        React.createElement("div", { className: "dashboard-header" },
            React.createElement("h1", null, "Panel del Alumno"),
            React.createElement("div", { className: "header-controls" },
                React.createElement("span", null,
                    "Bienvenido, ",
                    user.nombre),
                React.createElement("button", { onClick: onLogout }, "Cerrar Sesi\u00F3n"))),
        React.createElement("div", { className: "dashboard-content" }, studentData ? (React.createElement(BoletaDisplay, { student: studentData, appData: appData })) : (React.createElement("div", { className: "management-container" },
            React.createElement("h3", null, "Error"),
            React.createElement("p", { className: "placeholder-text" }, "No se pudieron cargar los datos del alumno."))))));
};
const GradingModal = ({ student, course, appData, onSave, onClose }) => {
    const [localGrades, setLocalGrades] = useState({});
    useEffect(() => {
        const studentCourseNotes = appData.notas.filter(n => n.id_alumno === student.id_alumno && n.id_curso === course.id_curso);
        const notesMap = {};
        studentCourseNotes.forEach(note => {
            const key = `${note.trimestre}-${note.tipo_nota}-${note.numero_nota}`;
            notesMap[key] = note.valor_nota;
        });
        setLocalGrades(notesMap);
    }, [student, course, appData.notas]);
    const handleInputChange = (trimestre, tipo_nota, numero_nota, value) => {
        const key = `${trimestre}-${tipo_nota}-${numero_nota}`;
        const numericValue = value === '' ? '' : Math.max(0, Math.min(100, Number(value)));
        setLocalGrades(prev => (Object.assign(Object.assign({}, prev), { [key]: numericValue })));
    };
    const handleSave = () => {
        const updatedNotes = Object.entries(localGrades).map(([key, value]) => {
            if (value === '' || value === null)
                return null;
            const [trimestre, tipo_nota, numero_nota] = key.split('-');
            const existingNote = appData.notas.find(n => n.id_alumno === student.id_alumno &&
                n.id_curso === course.id_curso &&
                n.trimestre === Number(trimestre) &&
                n.tipo_nota === tipo_nota &&
                n.numero_nota === Number(numero_nota));
            return {
                id_nota: existingNote ? existingNote.id_nota : `n${Date.now()}${Math.random()}`.replace('.', ''),
                id_alumno: student.id_alumno,
                id_curso: course.id_curso,
                trimestre: Number(trimestre),
                tipo_nota: tipo_nota,
                numero_nota: Number(numero_nota),
                valor_nota: Number(value),
            };
        }).filter((n) => n !== null);
        onSave(updatedNotes);
        onClose();
    };
    const renderTrimester = (trimestre) => {
        var _a, _b;
        const isUnlocked = (_b = (_a = appData.trimestres.find(t => t.id_alumno === student.id_alumno && t.trimestre === trimestre)) === null || _a === void 0 ? void 0 : _a.desbloqueado) !== null && _b !== void 0 ? _b : false;
        return (React.createElement("div", { className: `trimester-section ${!isUnlocked ? 'locked' : ''}`, key: `trimestre-${trimestre}` },
            React.createElement("h4", null,
                trimestre,
                "er Trimestre",
                !isUnlocked && React.createElement("span", { className: "lock-icon" }, "\uD83D\uDD12 Bloqueado")),
            ['practica', 'examen'].map(tipo => (React.createElement("div", { key: tipo },
                React.createElement("h5", null, tipo === 'practica' ? 'Prácticas' : 'Exámenes'),
                React.createElement("div", { className: "grades-grid" }, [1, 2, 3, 4, 5].map(num => {
                    var _a;
                    return (React.createElement("div", { className: "input-group-grade", key: `${trimestre}-${tipo}-${num}` },
                        React.createElement("label", { htmlFor: `grade-${trimestre}-${tipo}-${num}` },
                            "Nota ",
                            num),
                        React.createElement("input", { type: "number", id: `grade-${trimestre}-${tipo}-${num}`, min: "0", max: "100", value: (_a = localGrades[`${trimestre}-${tipo}-${num}`]) !== null && _a !== void 0 ? _a : '', onChange: (e) => handleInputChange(trimestre, tipo, num, e.target.value), disabled: !isUnlocked })));
                })))))));
    };
    return (React.createElement(Modal, { onClose: onClose },
        React.createElement("div", { className: "grading-modal-content" },
            React.createElement("div", { className: "grading-modal-header" },
                React.createElement("h3", null,
                    "Calificar a: ",
                    student.nombre),
                React.createElement("p", null,
                    React.createElement("strong", null, "Curso:"),
                    " ",
                    course.materia,
                    " - ",
                    course.nombre_completo)),
            renderTrimester(1),
            renderTrimester(2),
            renderTrimester(3),
            React.createElement("div", { className: "form-actions modal-actions" },
                React.createElement("button", { type: "button", className: "btn-confirm", onClick: handleSave }, "Guardar Cambios"),
                React.createElement("button", { type: "button", className: "btn-cancel", onClick: onClose }, "Cancelar")))));
};
const ProfesorGradeManagement = ({ user, appData, onDataChange }) => {
    const assignedCourses = useMemo(() => appData.cursos
        .filter(c => c.id_profesor === user.id_usuario)
        .sort((a, b) => a.nombre_completo.localeCompare(b.nombre_completo) || a.materia.localeCompare(b.materia)), [appData.cursos, user.id_usuario]);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [studentsInCourse, setStudentsInCourse] = useState([]);
    const [isGrading, setIsGrading] = useState(null);
    useEffect(() => {
        if (selectedCourse) {
            const inscriptions = appData.inscripciones.filter(i => i.id_curso === selectedCourse.id_curso);
            const studentIds = inscriptions.map(i => i.id_alumno);
            const students = appData.alumnos
                .filter(a => studentIds.includes(a.id_alumno))
                .sort((a, b) => a.nombre.localeCompare(b.nombre));
            setStudentsInCourse(students);
        }
        else {
            setStudentsInCourse([]);
        }
    }, [selectedCourse, appData]);
    const handleSaveGrades = async (newGrades) => {
        var _a, _b;
        const studentId = (_a = newGrades[0]) === null || _a === void 0 ? void 0 : _a.id_alumno;
        const courseId = (_b = newGrades[0]) === null || _b === void 0 ? void 0 : _b.id_curso;
        if (!studentId || !courseId)
            return;
        const otherNotes = appData.notas.filter(n => !(n.id_alumno === studentId && n.id_curso === courseId));
        const finalNotes = [...otherNotes, ...newGrades];
        await onDataChange(Object.assign(Object.assign({}, appData), { notas: finalNotes }));
    };
    return (React.createElement("div", { className: "management-container" },
        React.createElement("h3", null, "Gesti\u00F3n de Notas"),
        React.createElement("div", { className: "form-grid" },
            React.createElement("div", { className: "input-group" },
                React.createElement("label", { htmlFor: "select-course" }, "Seleccione un curso para gestionar"),
                React.createElement("select", { id: "select-course", value: (selectedCourse === null || selectedCourse === void 0 ? void 0 : selectedCourse.id_curso) || '', onChange: (e) => {
                        const course = assignedCourses.find(c => c.id_curso === e.target.value);
                        setSelectedCourse(course || null);
                    } },
                    React.createElement("option", { value: "" }, "-- Mis Cursos --"),
                    assignedCourses.map(c => (React.createElement("option", { key: c.id_curso, value: c.id_curso },
                        c.nombre_completo,
                        " - ",
                        c.materia)))))),
        selectedCourse ? (React.createElement("div", { className: "table-container" },
            React.createElement("h4", null,
                "Alumnos en ",
                selectedCourse.nombre_completo,
                " - ",
                selectedCourse.materia),
            React.createElement("table", { className: "styled-table" },
                React.createElement("thead", null,
                    React.createElement("tr", null,
                        React.createElement("th", null, "N\u00B0"),
                        React.createElement("th", null, "Nombre del Alumno"),
                        React.createElement("th", null, "Acciones"))),
                React.createElement("tbody", null, studentsInCourse.map((student, index) => (React.createElement("tr", { key: student.id_alumno },
                    React.createElement("td", null, index + 1),
                    React.createElement("td", null, student.nombre),
                    React.createElement("td", null,
                        React.createElement("button", { className: "btn-edit", onClick: () => setIsGrading(student) }, "Calificar"))))))),
            studentsInCourse.length === 0 && React.createElement("p", null, "No hay alumnos inscritos en este curso."))) : (React.createElement("p", { className: "placeholder-text" }, "Seleccione un curso de la lista para ver a sus alumnos y registrar notas.")),
        isGrading && selectedCourse && (React.createElement(GradingModal, { student: isGrading, course: selectedCourse, appData: appData, onSave: handleSaveGrades, onClose: () => setIsGrading(null) }))));
};
const TeacherProfile = ({ user, appData }) => {
    const assignedSubjects = useMemo(() => {
        return appData.cursos
            .filter(c => c.id_profesor === user.id_usuario)
            .sort((a, b) => a.nombre_completo.localeCompare(b.nombre_completo) || a.materia.localeCompare(b.materia));
    }, [user.id_usuario, appData.cursos]);
    return (React.createElement("div", { className: "management-container" },
        React.createElement("h3", null, "Mi Perfil"),
        React.createElement("div", { className: "profile-details" },
            React.createElement("div", { className: "detail-item" },
                React.createElement("label", null, "Nombre Completo:"),
                React.createElement("span", null, user.nombre)),
            React.createElement("div", { className: "detail-item" },
                React.createElement("label", null, "CI:"),
                React.createElement("span", null, user.ci)),
            React.createElement("div", { className: "detail-item" },
                React.createElement("label", null, "Usuario:"),
                React.createElement("span", null, user.usuario)),
            React.createElement("div", { className: "detail-item" },
                React.createElement("label", null, "Especialidad Principal:"),
                React.createElement("span", null, user.especialidad))),
        React.createElement("h4", { className: "profile-subjects-title" }, "Materias Asignadas"),
        React.createElement("div", { className: "table-container" },
            React.createElement("table", { className: "styled-table" },
                React.createElement("thead", null,
                    React.createElement("tr", null,
                        React.createElement("th", null, "Curso"),
                        React.createElement("th", null, "Paralelo"),
                        React.createElement("th", null, "Materia"))),
                React.createElement("tbody", null,
                    assignedSubjects.map(subject => (React.createElement("tr", { key: subject.id_curso },
                        React.createElement("td", null, subject.nombre_curso),
                        React.createElement("td", null, subject.paralelo),
                        React.createElement("td", null, subject.materia)))),
                    assignedSubjects.length === 0 && (React.createElement("tr", null,
                        React.createElement("td", { colSpan: 3, style: { textAlign: 'center' } }, "No tienes materias asignadas actualmente."))))))));
};
const ProfesorDashboard = ({ user, onLogout, appData, onDataChange }) => {
    const [activeView, setActiveView] = useState('notas');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const viewTitles = {
        notas: 'Registrar Notas',
        boletas: 'Boletas de Notas',
        perfil: 'Mi Perfil'
    };
    const renderActiveView = () => {
        switch (activeView) {
            case 'notas':
                return React.createElement(ProfesorGradeManagement, { user: user, appData: appData, onDataChange: onDataChange });
            case 'boletas':
                return React.createElement(BoletaManagement, { appData: appData });
            case 'perfil':
                return React.createElement(TeacherProfile, { user: user, appData: appData });
            default:
                return (React.createElement("div", { className: "management-container" },
                    React.createElement("h3", null,
                        viewTitles[activeView],
                        " (Pr\u00F3ximamente)"),
                    React.createElement("p", null, "Esta secci\u00F3n estar\u00E1 disponible en futuras actualizaciones.")));
        }
    };
    return (React.createElement("div", { className: "dashboard" },
        React.createElement("div", { className: "dashboard-header" },
            React.createElement("button", { className: "hamburger-menu", onClick: () => setIsMobileMenuOpen(true) }, "\u2630"),
            React.createElement("h1", null, "Panel del Profesor"),
            React.createElement("div", { className: "header-controls" },
                React.createElement("span", null,
                    "Bienvenido, ",
                    user.nombre),
                React.createElement("button", { onClick: onLogout }, "Cerrar Sesi\u00F3n"))),
        isMobileMenuOpen && (React.createElement(React.Fragment, null,
            React.createElement("div", { className: "mobile-nav-overlay", onClick: () => setIsMobileMenuOpen(false) }),
            React.createElement("div", { className: `mobile-nav ${isMobileMenuOpen ? 'open' : ''}` },
                React.createElement("button", { className: "mobile-nav-close", onClick: () => setIsMobileMenuOpen(false) }, "\u00D7"),
                Object.entries(viewTitles).map(([key, title]) => (React.createElement("button", { key: key, className: activeView === key ? 'active' : '', onClick: () => {
                        setActiveView(key);
                        setIsMobileMenuOpen(false);
                    } }, title)))))),
        React.createElement("div", { className: "dashboard-content" }, renderActiveView())));
};
const AdminManagement = ({ appData, onDataChange }) => {
    const initialFormState = {
        nombres: '',
        apellidos: '',
        ci: '',
        usuario: '',
        contraseña: '',
    };
    const [formData, setFormData] = useState(initialFormState);
    const [editingId, setEditingId] = useState(null);
    const [userToDelete, setUserToDelete] = useState(null);
    const admins = useMemo(() => appData.usuarios.filter(u => u.rol === 'Dirección'), [appData.usuarios]);
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => (Object.assign(Object.assign({}, prev), { [name]: value })));
    };
    const handleCancel = () => {
        setFormData(initialFormState);
        setEditingId(null);
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        const { nombres, apellidos, ci, usuario, contraseña } = formData;
        if (!nombres || !apellidos || !ci || !usuario || !contraseña) {
            alert('Todos los campos son obligatorios.');
            return;
        }
        const newUserData = {
            nombre: `${nombres.trim()} ${apellidos.trim()}`,
            ci: ci.trim(),
            usuario: usuario.trim(),
            contraseña: contraseña,
            rol: 'Dirección',
        };
        let updatedUsuarios;
        if (editingId) {
            updatedUsuarios = appData.usuarios.map(u => u.id_usuario === editingId ? Object.assign(Object.assign({}, u), newUserData) : u);
        }
        else {
            updatedUsuarios = [
                ...appData.usuarios,
                Object.assign(Object.assign({}, newUserData), { id_usuario: `u${Date.now()}` }),
            ];
        }
        await onDataChange(Object.assign(Object.assign({}, appData), { usuarios: updatedUsuarios }));
        handleCancel();
    };
    const handleEdit = (user) => {
        setEditingId(user.id_usuario);
        const [nombres = '', ...apellidosArr] = user.nombre.split(' ');
        const apellidos = apellidosArr.join(' ');
        setFormData({
            nombres,
            apellidos,
            ci: user.ci || '',
            usuario: user.usuario || '',
            contraseña: user.contraseña,
        });
    };
    const handleDelete = (user) => {
        setUserToDelete(user);
    };
    const confirmDelete = async () => {
        if (!userToDelete)
            return;
        const updatedUsuarios = appData.usuarios.filter(u => u.id_usuario !== userToDelete.id_usuario);
        await onDataChange(Object.assign(Object.assign({}, appData), { usuarios: updatedUsuarios }));
        setUserToDelete(null);
    };
    return (React.createElement("div", { className: "management-container" },
        React.createElement("h3", null, "Registrar Administradores"),
        React.createElement("form", { onSubmit: handleSubmit, className: "admin-form" },
            React.createElement("div", { className: "form-grid" },
                React.createElement("div", { className: "input-group" },
                    React.createElement("label", { htmlFor: "nombres" }, "Nombres"),
                    React.createElement("input", { type: "text", name: "nombres", id: "nombres", value: formData.nombres, onChange: handleInputChange })),
                React.createElement("div", { className: "input-group" },
                    React.createElement("label", { htmlFor: "apellidos" }, "Apellidos"),
                    React.createElement("input", { type: "text", name: "apellidos", id: "apellidos", value: formData.apellidos, onChange: handleInputChange })),
                React.createElement("div", { className: "input-group" },
                    React.createElement("label", { htmlFor: "ci" }, "CI"),
                    React.createElement("input", { type: "text", name: "ci", id: "ci", value: formData.ci, onChange: handleInputChange })),
                React.createElement("div", { className: "input-group" },
                    React.createElement("label", { htmlFor: "usuario" }, "Usuario"),
                    React.createElement("input", { type: "text", name: "usuario", id: "usuario", value: formData.usuario, onChange: handleInputChange })),
                React.createElement("div", { className: "input-group" },
                    React.createElement("label", { htmlFor: "contrase\u00F1a" }, "Contrase\u00F1a"),
                    React.createElement("input", { type: "password", name: "contrase\u00F1a", id: "contrase\u00F1a", value: formData.contraseña, onChange: handleInputChange }))),
            React.createElement("div", { className: "form-actions" },
                React.createElement("button", { type: "submit", className: "btn-confirm" }, editingId ? 'Actualizar' : 'Registrar'),
                React.createElement("button", { type: "button", className: "btn-cancel", onClick: handleCancel }, "Cancelar"))),
        React.createElement("div", { className: "table-container" },
            React.createElement("table", { className: "styled-table" },
                React.createElement("thead", null,
                    React.createElement("tr", null,
                        React.createElement("th", null, "Nombres"),
                        React.createElement("th", null, "Apellidos"),
                        React.createElement("th", null, "CI"),
                        React.createElement("th", null, "Usuario"),
                        React.createElement("th", null, "Acciones"))),
                React.createElement("tbody", null, admins.map(admin => {
                    const [nombres = '', ...apellidosArr] = admin.nombre.split(' ');
                    const apellidos = apellidosArr.join(' ');
                    return (React.createElement("tr", { key: admin.id_usuario },
                        React.createElement("td", null, nombres),
                        React.createElement("td", null, apellidos),
                        React.createElement("td", null, admin.ci),
                        React.createElement("td", null, admin.usuario),
                        React.createElement("td", null,
                            React.createElement("button", { className: "btn-edit", onClick: () => handleEdit(admin) }, "Editar"),
                            React.createElement("button", { className: "btn-delete", onClick: () => handleDelete(admin) }, "Eliminar"))));
                })))),
        userToDelete && (React.createElement(ConfirmationModal, { message: `¿Estás seguro de que deseas eliminar al administrador ${userToDelete.nombre}?`, onConfirm: confirmDelete, onCancel: () => setUserToDelete(null) }))));
};
const TeacherManagement = ({ appData, onDataChange }) => {
    const especialidades = [
        'Lengua Extranjera', 'Ciencias Sociales', 'Educación Física y Deportes',
        'Educación Musical', 'Artes Plásticas y Visuales', 'Cosmovisiones Filosofía y Psicológica',
        'Valores Espiritualidad y Religiones', 'Matemática', 'Técnica Tecnológica General',
        'Técnica Tecnológica Especializada', 'Biología – Geografía', 'Física', 'Química'
    ];
    const initialFormState = {
        nombres: '',
        apellidos: '',
        especialidad: especialidades[0],
        ci: '',
        usuario: '',
        contraseña: '',
    };
    const [formData, setFormData] = useState(initialFormState);
    const [editingId, setEditingId] = useState(null);
    const [userToDelete, setUserToDelete] = useState(null);
    const profesores = useMemo(() => appData.usuarios.filter(u => u.rol === 'Profesor'), [appData.usuarios]);
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => (Object.assign(Object.assign({}, prev), { [name]: value })));
    };
    const handleCancel = () => {
        setFormData(initialFormState);
        setEditingId(null);
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        const { nombres, apellidos, especialidad, ci, usuario, contraseña } = formData;
        if (!nombres || !apellidos || !ci || !usuario || !contraseña || !especialidad) {
            alert('Todos los campos son obligatorios.');
            return;
        }
        const newUserData = {
            nombre: `${nombres.trim()} ${apellidos.trim()}`,
            ci: ci.trim(),
            usuario: usuario.trim(),
            contraseña: contraseña,
            rol: 'Profesor',
            especialidad: especialidad,
        };
        let updatedUsuarios;
        if (editingId) {
            updatedUsuarios = appData.usuarios.map(u => u.id_usuario === editingId ? Object.assign(Object.assign({}, u), newUserData) : u);
        }
        else {
            updatedUsuarios = [
                ...appData.usuarios,
                Object.assign(Object.assign({}, newUserData), { id_usuario: `u${Date.now()}` }),
            ];
        }
        await onDataChange(Object.assign(Object.assign({}, appData), { usuarios: updatedUsuarios }));
        handleCancel();
    };
    const handleEdit = (user) => {
        setEditingId(user.id_usuario);
        const [nombres = '', ...apellidosArr] = user.nombre.split(' ');
        const apellidos = apellidosArr.join(' ');
        setFormData({
            nombres,
            apellidos,
            especialidad: user.especialidad || especialidades[0],
            ci: user.ci || '',
            usuario: user.usuario || '',
            contraseña: user.contraseña,
        });
    };
    const handleDelete = (user) => {
        setUserToDelete(user);
    };
    const confirmDelete = async () => {
        if (!userToDelete)
            return;
        const updatedUsuarios = appData.usuarios.filter(u => u.id_usuario !== userToDelete.id_usuario);
        await onDataChange(Object.assign(Object.assign({}, appData), { usuarios: updatedUsuarios }));
        setUserToDelete(null);
    };
    return (React.createElement("div", { className: "management-container" },
        React.createElement("h3", null, "Registrar Profesores"),
        React.createElement("form", { onSubmit: handleSubmit, className: "admin-form" },
            React.createElement("div", { className: "form-grid" },
                React.createElement("div", { className: "input-group" },
                    React.createElement("label", { htmlFor: "nombres" }, "Nombres"),
                    React.createElement("input", { type: "text", name: "nombres", id: "nombres", value: formData.nombres, onChange: handleInputChange })),
                React.createElement("div", { className: "input-group" },
                    React.createElement("label", { htmlFor: "apellidos" }, "Apellidos"),
                    React.createElement("input", { type: "text", name: "apellidos", id: "apellidos", value: formData.apellidos, onChange: handleInputChange })),
                React.createElement("div", { className: "input-group" },
                    React.createElement("label", { htmlFor: "especialidad" }, "Especialidad"),
                    React.createElement("select", { name: "especialidad", id: "especialidad", value: formData.especialidad, onChange: handleInputChange }, especialidades.map(esp => React.createElement("option", { key: esp, value: esp }, esp)))),
                React.createElement("div", { className: "input-group" },
                    React.createElement("label", { htmlFor: "ci" }, "CI"),
                    React.createElement("input", { type: "text", name: "ci", id: "ci", value: formData.ci, onChange: handleInputChange })),
                React.createElement("div", { className: "input-group" },
                    React.createElement("label", { htmlFor: "usuario" }, "Usuario"),
                    React.createElement("input", { type: "text", name: "usuario", id: "usuario", value: formData.usuario, onChange: handleInputChange })),
                React.createElement("div", { className: "input-group" },
                    React.createElement("label", { htmlFor: "contrase\u00F1a" }, "Contrase\u00F1a"),
                    React.createElement("input", { type: "password", name: "contrase\u00F1a", id: "contrase\u00F1a", value: formData.contraseña, onChange: handleInputChange }))),
            React.createElement("div", { className: "form-actions" },
                React.createElement("button", { type: "submit", className: "btn-confirm" }, editingId ? 'Actualizar' : 'Registrar'),
                React.createElement("button", { type: "button", className: "btn-cancel", onClick: handleCancel }, "Cancelar"))),
        React.createElement("div", { className: "table-container" },
            React.createElement("table", { className: "styled-table" },
                React.createElement("thead", null,
                    React.createElement("tr", null,
                        React.createElement("th", null, "Nombres"),
                        React.createElement("th", null, "Apellidos"),
                        React.createElement("th", null, "Especialidad"),
                        React.createElement("th", null, "CI"),
                        React.createElement("th", null, "Usuario"),
                        React.createElement("th", null, "Acciones"))),
                React.createElement("tbody", null, profesores.map(prof => {
                    const [nombres = '', ...apellidosArr] = prof.nombre.split(' ');
                    const apellidos = apellidosArr.join(' ');
                    return (React.createElement("tr", { key: prof.id_usuario },
                        React.createElement("td", null, nombres),
                        React.createElement("td", null, apellidos),
                        React.createElement("td", null, prof.especialidad),
                        React.createElement("td", null, prof.ci),
                        React.createElement("td", null, prof.usuario),
                        React.createElement("td", null,
                            React.createElement("button", { className: "btn-edit", onClick: () => handleEdit(prof) }, "Editar"),
                            React.createElement("button", { className: "btn-delete", onClick: () => handleDelete(prof) }, "Eliminar"))));
                })))),
        userToDelete && (React.createElement(ConfirmationModal, { message: `¿Estás seguro de que deseas eliminar al profesor ${userToDelete.nombre}?`, onConfirm: confirmDelete, onCancel: () => setUserToDelete(null) }))));
};
const StudentDetailsModal = ({ student, appData, onClose }) => {
    const studentInscription = appData.inscripciones.find(i => i.id_alumno === student.id_alumno);
    const studentCourse = studentInscription ? appData.cursos.find(c => c.id_curso === studentInscription.id_curso) : null;
    const cursoCompleto = studentCourse ? `${studentCourse.nombre_curso} "${studentCourse.paralelo}"` : 'No asignado';
    return (React.createElement(Modal, { onClose: onClose },
        React.createElement("div", { className: "student-details-modal" },
            React.createElement("h3", null, "Detalles del Alumno"),
            React.createElement("div", { className: "details-grid" },
                React.createElement("div", { className: "detail-item" },
                    React.createElement("label", null, "Nombre Completo:"),
                    React.createElement("span", null, student.nombre || '-')),
                React.createElement("div", { className: "detail-item" },
                    React.createElement("label", null, "CI:"),
                    React.createElement("span", null, student.ci || '-')),
                React.createElement("div", { className: "detail-item" },
                    React.createElement("label", null, "RUDE:"),
                    React.createElement("span", null, student.rude || '-')),
                React.createElement("div", { className: "detail-item" },
                    React.createElement("label", null, "Fecha de Nacimiento:"),
                    React.createElement("span", null, student.fecha_nacimiento || '-')),
                React.createElement("div", { className: "detail-item" },
                    React.createElement("label", null, "Nacionalidad:"),
                    React.createElement("span", null, student.nacionalidad || '-')),
                React.createElement("div", { className: "detail-item" },
                    React.createElement("label", null, "G\u00E9nero:"),
                    React.createElement("span", null, student.genero || '-')),
                React.createElement("div", { className: "detail-item" },
                    React.createElement("label", null, "Direcci\u00F3n:"),
                    React.createElement("span", null, student.direccion || '-')),
                React.createElement("div", { className: "detail-item" },
                    React.createElement("label", null, "Tel\u00E9fono:"),
                    React.createElement("span", null, student.telefono || '-')),
                React.createElement("div", { className: "detail-item" },
                    React.createElement("label", null, "Curso Asignado:"),
                    React.createElement("span", null, cursoCompleto))),
            React.createElement("div", { className: "form-actions modal-actions" },
                React.createElement("button", { type: "button", className: "btn-cancel", onClick: onClose }, "Cerrar")))));
};
const StudentManagement = ({ appData, onDataChange }) => {
    const initialFormState = {
        nombres: '',
        apellidos: '',
        ci: '',
        rude: '',
        fecha_nacimiento: '',
        nacionalidad: '',
        genero: 'Femenino',
        direccion: '',
        telefono: '',
        nombre_curso: '',
        paralelo: '',
    };
    const [formData, setFormData] = useState(initialFormState);
    const [editingId, setEditingId] = useState(null);
    const [studentToDelete, setStudentToDelete] = useState(null);
    const [studentToView, setStudentToView] = useState(null);
    const [selectedSubjects, setSelectedSubjects] = useState({});
    const gradosDisponibles = useMemo(() => [...new Set(appData.cursos.map(c => c.nombre_curso))], [appData.cursos]);
    const paralelosDisponibles = useMemo(() => {
        if (!formData.nombre_curso)
            return [];
        return [...new Set(appData.cursos.filter(c => c.nombre_curso === formData.nombre_curso).map(c => c.paralelo))];
    }, [formData.nombre_curso, appData.cursos]);
    const subjectsForSelectedCourse = useMemo(() => {
        if (!formData.nombre_curso || !formData.paralelo) {
            return [];
        }
        const courses = appData.cursos.filter(c => c.nombre_curso === formData.nombre_curso && c.paralelo === formData.paralelo);
        return courses.map(course => {
            const teacher = appData.usuarios.find(u => u.id_usuario === course.id_profesor);
            return {
                id_curso: course.id_curso,
                materia: course.materia,
                profesor: teacher ? teacher.nombre : 'No asignado'
            };
        }).sort((a, b) => a.materia.localeCompare(b.materia));
    }, [formData.nombre_curso, formData.paralelo, appData.cursos, appData.usuarios]);
    useEffect(() => {
        if (editingId) {
            const studentInscriptions = appData.inscripciones
                .filter(i => i.id_alumno === editingId)
                .map(i => i.id_curso);
            const selectionForEditing = subjectsForSelectedCourse.reduce((acc, subject) => {
                acc[subject.id_curso] = studentInscriptions.includes(subject.id_curso);
                return acc;
            }, {});
            setSelectedSubjects(selectionForEditing);
        }
        else {
            const initialSelection = subjectsForSelectedCourse.reduce((acc, subject) => {
                acc[subject.id_curso] = true; // Default to checked for new students
                return acc;
            }, {});
            setSelectedSubjects(initialSelection);
        }
    }, [subjectsForSelectedCourse, editingId, appData.inscripciones]);
    const handleSubjectToggle = (courseId) => {
        setSelectedSubjects(prev => (Object.assign(Object.assign({}, prev), { [courseId]: !prev[courseId] })));
    };
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name === 'nombre_curso') {
            setFormData(prev => (Object.assign(Object.assign({}, prev), { nombre_curso: value, paralelo: '' })));
        }
        else {
            setFormData(prev => (Object.assign(Object.assign({}, prev), { [name]: value })));
        }
    };
    const handleCancel = () => {
        setFormData(initialFormState);
        setEditingId(null);
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        const { nombres, apellidos, ci, rude } = formData;
        if (!nombres || !apellidos || !ci || !rude) {
            alert('Los campos Nombres, Apellidos, CI y RUDE son obligatorios.');
            return;
        }
        const newStudentData = {
            nombre: `${nombres.trim()} ${apellidos.trim()}`,
            ci: ci.trim(),
            rude: rude.trim(),
            fecha_nacimiento: formData.fecha_nacimiento,
            nacionalidad: formData.nacionalidad.trim(),
            genero: formData.genero,
            direccion: formData.direccion.trim(),
            telefono: formData.telefono.trim(),
        };
        let updatedAlumnos = [...appData.alumnos];
        let studentId = editingId;
        if (editingId) {
            updatedAlumnos = appData.alumnos.map(a => a.id_alumno === editingId ? Object.assign(Object.assign({}, a), newStudentData) : a);
        }
        else {
            const newStudent = Object.assign(Object.assign({}, newStudentData), { id_alumno: `a${Date.now()}` });
            studentId = newStudent.id_alumno;
            updatedAlumnos.push(newStudent);
        }
        let updatedInscripciones = [...appData.inscripciones];
        if (studentId) {
            // Remove all previous inscriptions for this student and add the new selected ones.
            updatedInscripciones = appData.inscripciones.filter(i => i.id_alumno !== studentId);
            const selectedCourseIds = Object.entries(selectedSubjects)
                .filter(([_, isSelected]) => isSelected)
                .map(([courseId, _]) => courseId);
            const newInscriptions = selectedCourseIds.map(courseId => ({
                id_alumno: studentId,
                id_curso: courseId
            }));
            updatedInscripciones.push(...newInscriptions);
        }
        await onDataChange(Object.assign(Object.assign({}, appData), { alumnos: updatedAlumnos, inscripciones: updatedInscripciones }));
        handleCancel();
    };
    const handleEdit = (student) => {
        setEditingId(student.id_alumno);
        const [nombres = '', ...apellidosArr] = student.nombre.split(' ');
        const apellidos = apellidosArr.join(' ');
        const studentInscription = appData.inscripciones.find(i => i.id_alumno === student.id_alumno);
        const studentCourse = studentInscription ? appData.cursos.find(c => c.id_curso === studentInscription.id_curso) : null;
        setFormData({
            nombres,
            apellidos,
            ci: student.ci || '',
            rude: student.rude || '',
            fecha_nacimiento: student.fecha_nacimiento || '',
            nacionalidad: student.nacionalidad || '',
            genero: student.genero || 'Femenino',
            direccion: student.direccion || '',
            telefono: student.telefono || '',
            nombre_curso: (studentCourse === null || studentCourse === void 0 ? void 0 : studentCourse.nombre_curso) || '',
            paralelo: (studentCourse === null || studentCourse === void 0 ? void 0 : studentCourse.paralelo) || '',
        });
    };
    const handleDelete = (student) => {
        setStudentToDelete(student);
    };
    const confirmDelete = async () => {
        if (!studentToDelete)
            return;
        const updatedAlumnos = appData.alumnos.filter(a => a.id_alumno !== studentToDelete.id_alumno);
        const updatedInscripciones = appData.inscripciones.filter(i => i.id_alumno !== studentToDelete.id_alumno);
        await onDataChange(Object.assign(Object.assign({}, appData), { alumnos: updatedAlumnos, inscripciones: updatedInscripciones }));
        setStudentToDelete(null);
    };
    return (React.createElement("div", { className: "management-container" },
        React.createElement("h3", null, "Registrar Alumnos"),
        React.createElement("form", { onSubmit: handleSubmit, className: "admin-form" },
            React.createElement("div", { className: "form-grid" },
                React.createElement("div", { className: "input-group" },
                    React.createElement("label", { htmlFor: "nombres" }, "Nombres"),
                    React.createElement("input", { type: "text", name: "nombres", id: "nombres", value: formData.nombres, onChange: handleInputChange })),
                React.createElement("div", { className: "input-group" },
                    React.createElement("label", { htmlFor: "apellidos" }, "Apellidos"),
                    React.createElement("input", { type: "text", name: "apellidos", id: "apellidos", value: formData.apellidos, onChange: handleInputChange })),
                React.createElement("div", { className: "input-group" },
                    React.createElement("label", { htmlFor: "ci" }, "CI"),
                    React.createElement("input", { type: "text", name: "ci", id: "ci", value: formData.ci, onChange: handleInputChange })),
                React.createElement("div", { className: "input-group" },
                    React.createElement("label", { htmlFor: "rude" }, "RUDE"),
                    React.createElement("input", { type: "text", name: "rude", id: "rude", value: formData.rude, onChange: handleInputChange })),
                React.createElement("div", { className: "input-group" },
                    React.createElement("label", { htmlFor: "fecha_nacimiento" }, "Fecha de Nacimiento"),
                    React.createElement("input", { type: "date", name: "fecha_nacimiento", id: "fecha_nacimiento", value: formData.fecha_nacimiento, onChange: handleInputChange })),
                React.createElement("div", { className: "input-group" },
                    React.createElement("label", { htmlFor: "nombre_curso" }, "Curso"),
                    React.createElement("select", { name: "nombre_curso", id: "nombre_curso", value: formData.nombre_curso, onChange: handleInputChange },
                        React.createElement("option", { value: "" }, "-- No Asignado --"),
                        gradosDisponibles.map(g => React.createElement("option", { key: g, value: g }, g)))),
                React.createElement("div", { className: "input-group" },
                    React.createElement("label", { htmlFor: "paralelo" }, "Paralelo"),
                    React.createElement("select", { name: "paralelo", id: "paralelo", value: formData.paralelo, onChange: handleInputChange, disabled: !formData.nombre_curso },
                        React.createElement("option", { value: "" }, "Seleccione..."),
                        paralelosDisponibles.map(p => React.createElement("option", { key: p, value: p }, p)))),
                React.createElement("div", { className: "input-group" },
                    React.createElement("label", { htmlFor: "nacionalidad" }, "Nacionalidad"),
                    React.createElement("input", { type: "text", name: "nacionalidad", id: "nacionalidad", value: formData.nacionalidad, onChange: handleInputChange })),
                React.createElement("div", { className: "input-group" },
                    React.createElement("label", { htmlFor: "genero" }, "G\u00E9nero"),
                    React.createElement("select", { name: "genero", id: "genero", value: formData.genero, onChange: handleInputChange },
                        React.createElement("option", { value: "Femenino" }, "Femenino"),
                        React.createElement("option", { value: "Masculino" }, "Masculino"))),
                React.createElement("div", { className: "input-group" },
                    React.createElement("label", { htmlFor: "direccion" }, "Direcci\u00F3n"),
                    React.createElement("input", { type: "text", name: "direccion", id: "direccion", value: formData.direccion, onChange: handleInputChange })),
                React.createElement("div", { className: "input-group" },
                    React.createElement("label", { htmlFor: "telefono" }, "Tel\u00E9fono"),
                    React.createElement("input", { type: "text", name: "telefono", id: "telefono", value: formData.telefono, onChange: handleInputChange })),
                subjectsForSelectedCourse.length > 0 && (React.createElement("div", { className: "course-details-display" },
                    React.createElement("h4", null, "Materias a Inscribir"),
                    React.createElement("ul", { className: "subject-selection-list" }, subjectsForSelectedCourse.map(s => (React.createElement("li", { key: s.id_curso },
                        React.createElement("label", null,
                            React.createElement("input", { type: "checkbox", checked: !!selectedSubjects[s.id_curso], onChange: () => handleSubjectToggle(s.id_curso) }),
                            React.createElement("strong", null,
                                s.materia,
                                ":"),
                            " ",
                            s.profesor)))))))),
            React.createElement("div", { className: "form-actions" },
                React.createElement("button", { type: "submit", className: "btn-confirm" }, editingId ? 'Actualizar' : 'Registrar'),
                React.createElement("button", { type: "button", className: "btn-cancel", onClick: handleCancel }, "Cancelar"))),
        React.createElement("div", { className: "table-container" },
            React.createElement("table", { className: "styled-table" },
                React.createElement("thead", null,
                    React.createElement("tr", null,
                        React.createElement("th", null, "Nombres"),
                        React.createElement("th", null, "Apellidos"),
                        React.createElement("th", null, "CI"),
                        React.createElement("th", null, "RUDE"),
                        React.createElement("th", null, "Acciones"))),
                React.createElement("tbody", null, appData.alumnos.map(student => {
                    const [nombres = '', ...apellidosArr] = student.nombre.split(' ');
                    const apellidos = apellidosArr.join(' ');
                    return (React.createElement("tr", { key: student.id_alumno },
                        React.createElement("td", null, nombres),
                        React.createElement("td", null, apellidos),
                        React.createElement("td", null, student.ci),
                        React.createElement("td", null, student.rude),
                        React.createElement("td", null,
                            React.createElement("button", { className: "btn-edit", onClick: () => handleEdit(student) }, "Editar"),
                            React.createElement("button", { className: "btn-delete", onClick: () => handleDelete(student) }, "Eliminar"),
                            React.createElement("button", { className: "btn-view", onClick: () => setStudentToView(student) }, "Ver Detalle"))));
                })))),
        studentToView && (React.createElement(StudentDetailsModal, { student: studentToView, appData: appData, onClose: () => setStudentToView(null) })),
        studentToDelete && (React.createElement(ConfirmationModal, { message: `¿Estás seguro de que deseas eliminar al alumno ${studentToDelete.nombre}? Se eliminarán también todas sus inscripciones y notas.`, onConfirm: confirmDelete, onCancel: () => setStudentToDelete(null) }))));
};
const CourseManagement = ({ appData, onDataChange }) => {
    const asignaturas = [
        'Lengua Extranjera', 'Ciencias Sociales', 'Educación Física y Deportes',
        'Educación Musical', 'Artes Plásticas y Visuales', 'Cosmovisiones Filosofía y Psicológica',
        'Valores Espiritualidad y Religiones', 'Matemática', 'Técnica Tecnológica General',
        'Técnica Tecnológica Especializada', 'Biología – Geografía', 'Física', 'Química', 'Lenguaje', 'Ciencias'
    ];
    const grados = ['Primero', 'Segundo', 'Tercero', 'Cuarto', 'Quinto', 'Sexto'];
    const paralelos = ['A', 'B', 'C'];
    const initialFormState = {
        materia: asignaturas[0],
        nombre_curso: grados[0],
        paralelo: paralelos[0],
        id_profesor: '',
    };
    const [formData, setFormData] = useState(initialFormState);
    const [editingId, setEditingId] = useState(null);
    const [courseToDelete, setCourseToDelete] = useState(null);
    const profesores = useMemo(() => appData.usuarios.filter(u => u.rol === 'Profesor'), [appData.usuarios]);
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => (Object.assign(Object.assign({}, prev), { [name]: value })));
    };
    const handleCancel = () => {
        setFormData(initialFormState);
        setEditingId(null);
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        const newCourseData = {
            materia: formData.materia,
            nombre_curso: formData.nombre_curso,
            paralelo: formData.paralelo,
            id_profesor: formData.id_profesor || undefined,
        };
        const nombre_completo = `${newCourseData.nombre_curso} ${newCourseData.paralelo}`;
        let updatedCursos;
        if (editingId) {
            updatedCursos = appData.cursos.map(c => c.id_curso === editingId ? Object.assign(Object.assign(Object.assign({}, c), newCourseData), { nombre_completo }) : c);
        }
        else {
            updatedCursos = [
                ...appData.cursos,
                Object.assign(Object.assign({}, newCourseData), { nombre_completo, id_curso: `c${Date.now()}` }),
            ];
        }
        await onDataChange(Object.assign(Object.assign({}, appData), { cursos: updatedCursos }));
        handleCancel();
    };
    const handleEdit = (curso) => {
        setEditingId(curso.id_curso);
        setFormData({
            materia: curso.materia,
            nombre_curso: curso.nombre_curso,
            paralelo: curso.paralelo,
            id_profesor: curso.id_profesor || '',
        });
    };
    const handleDelete = (curso) => {
        setCourseToDelete(curso);
    };
    const confirmDelete = async () => {
        if (!courseToDelete)
            return;
        const updatedCursos = appData.cursos.filter(c => c.id_curso !== courseToDelete.id_curso);
        await onDataChange(Object.assign(Object.assign({}, appData), { cursos: updatedCursos }));
        setCourseToDelete(null);
    };
    return (React.createElement("div", { className: "management-container" },
        React.createElement("h3", null, "Registrar Cursos"),
        React.createElement("form", { onSubmit: handleSubmit, className: "admin-form" },
            React.createElement("div", { className: "form-grid" },
                React.createElement("div", { className: "input-group" },
                    React.createElement("label", { htmlFor: "materia" }, "Asignatura"),
                    React.createElement("select", { name: "materia", id: "materia", value: formData.materia, onChange: handleInputChange }, asignaturas.sort().map(asig => React.createElement("option", { key: asig, value: asig }, asig)))),
                React.createElement("div", { className: "input-group" },
                    React.createElement("label", { htmlFor: "nombre_curso" }, "Curso"),
                    React.createElement("select", { name: "nombre_curso", id: "nombre_curso", value: formData.nombre_curso, onChange: handleInputChange }, grados.map(g => React.createElement("option", { key: g, value: g }, g)))),
                React.createElement("div", { className: "input-group" },
                    React.createElement("label", { htmlFor: "paralelo" }, "Paralelo"),
                    React.createElement("select", { name: "paralelo", id: "paralelo", value: formData.paralelo, onChange: handleInputChange }, paralelos.map(p => React.createElement("option", { key: p, value: p }, p)))),
                React.createElement("div", { className: "input-group" },
                    React.createElement("label", { htmlFor: "id_profesor" }, "Profesor Asignado"),
                    React.createElement("select", { name: "id_profesor", id: "id_profesor", value: formData.id_profesor, onChange: handleInputChange },
                        React.createElement("option", { value: "" }, "-- No Asignado --"),
                        profesores.map(p => React.createElement("option", { key: p.id_usuario, value: p.id_usuario }, p.nombre))))),
            React.createElement("div", { className: "form-actions" },
                React.createElement("button", { type: "submit", className: "btn-confirm" }, editingId ? 'Actualizar' : 'Registrar'),
                React.createElement("button", { type: "button", className: "btn-cancel", onClick: handleCancel }, "Cancelar"))),
        React.createElement("div", { className: "table-container" },
            React.createElement("table", { className: "styled-table" },
                React.createElement("thead", null,
                    React.createElement("tr", null,
                        React.createElement("th", null, "Asignatura"),
                        React.createElement("th", null, "Curso"),
                        React.createElement("th", null, "Paralelo"),
                        React.createElement("th", null, "Profesor Asignado"),
                        React.createElement("th", null, "Acciones"))),
                React.createElement("tbody", null, appData.cursos.map(curso => {
                    const profesor = profesores.find(p => p.id_usuario === curso.id_profesor);
                    return (React.createElement("tr", { key: curso.id_curso },
                        React.createElement("td", null, curso.materia),
                        React.createElement("td", null, curso.nombre_curso),
                        React.createElement("td", null, curso.paralelo),
                        React.createElement("td", null, profesor ? profesor.nombre : React.createElement("span", { style: { color: '#888' } }, "No asignado")),
                        React.createElement("td", null,
                            React.createElement("button", { className: "btn-edit", onClick: () => handleEdit(curso) }, "Editar"),
                            React.createElement("button", { className: "btn-delete", onClick: () => handleDelete(curso) }, "Eliminar"))));
                })))),
        courseToDelete && (React.createElement(ConfirmationModal, { message: `¿Estás seguro de que deseas eliminar el curso de ${courseToDelete.materia} - ${courseToDelete.nombre_completo}?`, onConfirm: confirmDelete, onCancel: () => setCourseToDelete(null) }))));
};
const GradeManagement = ({ appData, onDataChange }) => {
    const [filters, setFilters] = useState({
        asignatura: '',
        id_profesor: '',
        nombre_curso: '',
        paralelo: '',
    });
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [studentsInCourse, setStudentsInCourse] = useState([]);
    const [isGrading, setIsGrading] = useState(null);
    const uniqueSubjects = useMemo(() => [...new Set(appData.cursos.map(c => c.materia))].sort(), [appData.cursos]);
    const professors = useMemo(() => appData.usuarios.filter(u => u.rol === 'Profesor').sort((a, b) => a.nombre.localeCompare(b.nombre)), [appData.usuarios]);
    const uniqueGrados = useMemo(() => [...new Set(appData.cursos.map(c => c.nombre_curso))].sort(), [appData.cursos]);
    const uniqueParalelos = useMemo(() => [...new Set(appData.cursos.map(c => c.paralelo))].sort(), [appData.cursos]);
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => (Object.assign(Object.assign({}, prev), { [name]: value })));
    };
    const handleSaveGrades = async (newGrades) => {
        var _a, _b;
        const studentId = (_a = newGrades[0]) === null || _a === void 0 ? void 0 : _a.id_alumno;
        const courseId = (_b = newGrades[0]) === null || _b === void 0 ? void 0 : _b.id_curso;
        if (!studentId || !courseId)
            return;
        const otherNotes = appData.notas.filter(n => !(n.id_alumno === studentId && n.id_curso === courseId));
        const finalNotes = [...otherNotes, ...newGrades];
        await onDataChange(Object.assign(Object.assign({}, appData), { notas: finalNotes }));
    };
    useEffect(() => {
        if (filters.asignatura && filters.nombre_curso && filters.paralelo && filters.id_profesor) {
            const foundCourse = appData.cursos.find(c => c.materia === filters.asignatura &&
                c.nombre_curso === filters.nombre_curso &&
                c.paralelo === filters.paralelo &&
                c.id_profesor === filters.id_profesor);
            if (foundCourse) {
                const inscriptions = appData.inscripciones.filter(i => i.id_curso === foundCourse.id_curso);
                const studentIds = inscriptions.map(i => i.id_alumno);
                const students = appData.alumnos.filter(a => studentIds.includes(a.id_alumno));
                setSelectedCourse(foundCourse);
                setStudentsInCourse(students);
            }
            else {
                setSelectedCourse(null);
                setStudentsInCourse([]);
            }
        }
        else {
            setSelectedCourse(null);
            setStudentsInCourse([]);
        }
    }, [filters, appData]);
    return (React.createElement("div", { className: "management-container" },
        React.createElement("h3", null, "Registrar Notas"),
        React.createElement("div", { className: "form-grid grade-filters" },
            React.createElement("div", { className: "input-group" },
                React.createElement("label", { htmlFor: "asignatura" }, "Asignatura"),
                React.createElement("select", { name: "asignatura", id: "asignatura", value: filters.asignatura, onChange: handleFilterChange },
                    React.createElement("option", { value: "" }, "Seleccione..."),
                    uniqueSubjects.map(s => React.createElement("option", { key: s, value: s }, s)))),
            React.createElement("div", { className: "input-group" },
                React.createElement("label", { htmlFor: "id_profesor" }, "Profesor"),
                React.createElement("select", { name: "id_profesor", id: "id_profesor", value: filters.id_profesor, onChange: handleFilterChange },
                    React.createElement("option", { value: "" }, "Seleccione..."),
                    professors.map(p => React.createElement("option", { key: p.id_usuario, value: p.id_usuario }, p.nombre)))),
            React.createElement("div", { className: "input-group" },
                React.createElement("label", { htmlFor: "nombre_curso" }, "Curso"),
                React.createElement("select", { name: "nombre_curso", id: "nombre_curso", value: filters.nombre_curso, onChange: handleFilterChange },
                    React.createElement("option", { value: "" }, "Seleccione..."),
                    uniqueGrados.map(g => React.createElement("option", { key: g, value: g }, g)))),
            React.createElement("div", { className: "input-group" },
                React.createElement("label", { htmlFor: "paralelo" }, "Paralelo"),
                React.createElement("select", { name: "paralelo", id: "paralelo", value: filters.paralelo, onChange: handleFilterChange },
                    React.createElement("option", { value: "" }, "Seleccione..."),
                    uniqueParalelos.map(p => React.createElement("option", { key: p, value: p }, p))))),
        selectedCourse && (React.createElement("div", { className: "table-container" },
            React.createElement("table", { className: "styled-table" },
                React.createElement("thead", null,
                    React.createElement("tr", null,
                        React.createElement("th", null, "N\u00B0"),
                        React.createElement("th", null, "Nombre del Alumno"),
                        React.createElement("th", null, "Acciones"))),
                React.createElement("tbody", null, studentsInCourse.map((student, index) => (React.createElement("tr", { key: student.id_alumno },
                    React.createElement("td", null, index + 1),
                    React.createElement("td", null, student.nombre),
                    React.createElement("td", null,
                        React.createElement("button", { className: "btn-edit", onClick: () => setIsGrading(student) }, "Calificar"))))))))),
        studentsInCourse.length === 0 && filters.asignatura && filters.id_profesor && filters.nombre_curso && filters.paralelo && (React.createElement("p", { style: { textAlign: 'center', marginTop: '2rem' } }, "No se encontraron alumnos para la selecci\u00F3n actual.")),
        isGrading && selectedCourse && (React.createElement(GradingModal, { student: isGrading, course: selectedCourse, appData: appData, onSave: handleSaveGrades, onClose: () => setIsGrading(null) }))));
};
const BoletaDisplay = ({ student, appData }) => {
    const { cursos, inscripciones, notas } = appData;
    const studentReport = useMemo(() => {
        const studentInscriptions = inscripciones.filter(i => i.id_alumno === student.id_alumno);
        const studentCourses = studentInscriptions.map(i => cursos.find(c => c.id_curso === i.id_curso)).filter((c) => !!c);
        const subjects = [...new Set(studentCourses.map(c => c.materia))];
        return subjects.map(materia => {
            const coursesForSubject = studentCourses.filter(c => c.materia === materia);
            const courseIds = coursesForSubject.map(c => c.id_curso);
            const trimestresData = [1, 2, 3].map(trimestreNum => {
                const relevantNotes = notas.filter(n => n.id_alumno === student.id_alumno &&
                    courseIds.includes(n.id_curso) &&
                    n.trimestre === trimestreNum);
                const practicas = relevantNotes
                    .filter(n => n.tipo_nota === 'practica')
                    .sort((a, b) => a.numero_nota - b.numero_nota)
                    .map(n => n.valor_nota);
                const examenes = relevantNotes
                    .filter(n => n.tipo_nota === 'examen')
                    .sort((a, b) => a.numero_nota - b.numero_nota)
                    .map(n => n.valor_nota);
                const promedio = relevantNotes.length > 0
                    ? Math.round(relevantNotes.reduce((acc, note) => acc + note.valor_nota, 0) / relevantNotes.length)
                    : null;
                return { practicas, examenes, promedio };
            });
            const validAverages = trimestresData.map(t => t.promedio).filter((v) => v !== null);
            const finalAverage = validAverages.length > 0 ? Math.round(validAverages.reduce((a, b) => a + b, 0) / validAverages.length) : null;
            return {
                materia,
                t1: trimestresData[0].promedio,
                t2: trimestresData[1].promedio,
                t3: trimestresData[2].promedio,
                details: {
                    t1: { practicas: trimestresData[0].practicas, examenes: trimestresData[0].examenes },
                    t2: { practicas: trimestresData[1].practicas, examenes: trimestresData[1].examenes },
                    t3: { practicas: trimestresData[2].practicas, examenes: trimestresData[2].examenes },
                },
                finalAverage,
                estado: finalAverage === null ? '' : (finalAverage >= 51 ? 'Aprobado' : 'Reprobado')
            };
        });
    }, [student, cursos, inscripciones, notas]);
    return (React.createElement("div", { className: "boletin-container", style: { marginTop: '2rem' } },
        React.createElement("div", { className: "boletin-header" },
            React.createElement("h4", null, "Bolet\u00EDn de Calificaciones"),
            React.createElement("p", null,
                React.createElement("strong", null, "Alumno:"),
                " ",
                student.nombre),
            React.createElement("p", null,
                React.createElement("strong", null, "CI:"),
                " ",
                student.ci)),
        React.createElement("div", { className: "table-container" },
            React.createElement("table", { className: "styled-table" },
                React.createElement("thead", null,
                    React.createElement("tr", null,
                        React.createElement("th", null, "Materia"),
                        React.createElement("th", null, "1er Trimestre"),
                        React.createElement("th", null, "2do Trimestre"),
                        React.createElement("th", null, "3er Trimestre"),
                        React.createElement("th", null, "Promedio Final"),
                        React.createElement("th", null, "Estado"))),
                React.createElement("tbody", null, studentReport.map(row => {
                    var _a, _b, _c, _d;
                    return (React.createElement("tr", { key: row.materia },
                        React.createElement("td", null, row.materia),
                        React.createElement("td", null, (_a = row.t1) !== null && _a !== void 0 ? _a : '-'),
                        React.createElement("td", null, (_b = row.t2) !== null && _b !== void 0 ? _b : '-'),
                        React.createElement("td", null, (_c = row.t3) !== null && _c !== void 0 ? _c : '-'),
                        React.createElement("td", null, (_d = row.finalAverage) !== null && _d !== void 0 ? _d : '-'),
                        React.createElement("td", { className: row.estado === 'Aprobado' ? 'status-aprobado' : (row.estado === 'Reprobado' ? 'status-reprobado' : '') }, row.estado)));
                })))),
        React.createElement("div", { className: "table-container", style: { marginTop: '2.5rem' } },
            React.createElement("h4", { className: "boleta-details-title" }, "Detalle de Calificaciones - 1er Trimestre"),
            React.createElement("table", { className: "styled-table details-table" },
                React.createElement("thead", null,
                    React.createElement("tr", null,
                        React.createElement("th", { rowSpan: 2 }, "Materia"),
                        React.createElement("th", { colSpan: 5 }, "Pr\u00E1cticas"),
                        React.createElement("th", { colSpan: 5 }, "Ex\u00E1menes")),
                    React.createElement("tr", null,
                        [1, 2, 3, 4, 5].map(n => React.createElement("th", { key: `h-p${n}` },
                            "P",
                            n)),
                        [1, 2, 3, 4, 5].map(n => React.createElement("th", { key: `h-e${n}` },
                            "E",
                            n)))),
                React.createElement("tbody", null, studentReport.map(row => (React.createElement("tr", { key: `${row.materia}-t1-details` },
                    React.createElement("td", null, row.materia),
                    [0, 1, 2, 3, 4].map(i => { var _a; return React.createElement("td", { key: `t1-p${i}` }, (_a = row.details.t1.practicas[i]) !== null && _a !== void 0 ? _a : '-'); }),
                    [0, 1, 2, 3, 4].map(i => { var _a; return React.createElement("td", { key: `t1-e${i}` }, (_a = row.details.t1.examenes[i]) !== null && _a !== void 0 ? _a : '-'); }))))))),
        React.createElement("div", { className: "table-container", style: { marginTop: '2.5rem' } },
            React.createElement("h4", { className: "boleta-details-title" }, "Detalle de Calificaciones - 2do Trimestre"),
            React.createElement("table", { className: "styled-table details-table" },
                React.createElement("thead", null,
                    React.createElement("tr", null,
                        React.createElement("th", { rowSpan: 2 }, "Materia"),
                        React.createElement("th", { colSpan: 5 }, "Pr\u00E1cticas"),
                        React.createElement("th", { colSpan: 5 }, "Ex\u00E1menes")),
                    React.createElement("tr", null,
                        [1, 2, 3, 4, 5].map(n => React.createElement("th", { key: `h-p${n}` },
                            "P",
                            n)),
                        [1, 2, 3, 4, 5].map(n => React.createElement("th", { key: `h-e${n}` },
                            "E",
                            n)))),
                React.createElement("tbody", null, studentReport.map(row => (React.createElement("tr", { key: `${row.materia}-t2-details` },
                    React.createElement("td", null, row.materia),
                    [0, 1, 2, 3, 4].map(i => { var _a; return React.createElement("td", { key: `t2-p${i}` }, (_a = row.details.t2.practicas[i]) !== null && _a !== void 0 ? _a : '-'); }),
                    [0, 1, 2, 3, 4].map(i => { var _a; return React.createElement("td", { key: `t2-e${i}` }, (_a = row.details.t2.examenes[i]) !== null && _a !== void 0 ? _a : '-'); }))))))),
        React.createElement("div", { className: "table-container", style: { marginTop: '2.5rem' } },
            React.createElement("h4", { className: "boleta-details-title" }, "Detalle de Calificaciones - 3er Trimestre"),
            React.createElement("table", { className: "styled-table details-table" },
                React.createElement("thead", null,
                    React.createElement("tr", null,
                        React.createElement("th", { rowSpan: 2 }, "Materia"),
                        React.createElement("th", { colSpan: 5 }, "Pr\u00E1cticas"),
                        React.createElement("th", { colSpan: 5 }, "Ex\u00E1menes")),
                    React.createElement("tr", null,
                        [1, 2, 3, 4, 5].map(n => React.createElement("th", { key: `h-p${n}` },
                            "P",
                            n)),
                        [1, 2, 3, 4, 5].map(n => React.createElement("th", { key: `h-e${n}` },
                            "E",
                            n)))),
                React.createElement("tbody", null, studentReport.map(row => (React.createElement("tr", { key: `${row.materia}-t3-details` },
                    React.createElement("td", null, row.materia),
                    [0, 1, 2, 3, 4].map(i => { var _a; return React.createElement("td", { key: `t3-p${i}` }, (_a = row.details.t3.practicas[i]) !== null && _a !== void 0 ? _a : '-'); }),
                    [0, 1, 2, 3, 4].map(i => { var _a; return React.createElement("td", { key: `t3-e${i}` }, (_a = row.details.t3.examenes[i]) !== null && _a !== void 0 ? _a : '-'); })))))))));
};
const BoletaManagement = ({ appData }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const searchRef = useRef(null);
    useEffect(() => {
        if (searchTerm.trim().length > 1) {
            const results = appData.alumnos.filter(a => a.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                a.ci.includes(searchTerm));
            setSearchResults(results);
        }
        else {
            setSearchResults([]);
        }
    }, [searchTerm, appData.alumnos]);
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setSearchResults([]);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);
    const handleSelectStudent = (student) => {
        setSelectedStudent(student);
        setSearchTerm('');
        setSearchResults([]);
    };
    return (React.createElement("div", { className: "management-container" },
        React.createElement("h3", null, "Buscar Boleta de Notas"),
        React.createElement("div", { className: "search-container", ref: searchRef },
            React.createElement("div", { className: "input-group" },
                React.createElement("label", { htmlFor: "search-student" }, "Buscar por Nombre o CI del Alumno"),
                React.createElement("input", { type: "text", id: "search-student", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), placeholder: "Escriba aqu\u00ED...", autoComplete: "off" })),
            searchResults.length > 0 && (React.createElement("ul", { className: "search-results" }, searchResults.map(student => (React.createElement("li", { key: student.id_alumno, onClick: () => handleSelectStudent(student) },
                student.nombre,
                " - ",
                student.ci)))))),
        selectedStudent ? (React.createElement(BoletaDisplay, { student: selectedStudent, appData: appData })) : (React.createElement("p", { className: "placeholder-text" }, "Seleccione un alumno para ver su boleta de calificaciones."))));
};
const TrimesterManagement = ({ appData, onDataChange }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const handleToggle = (studentId, trimestreNum) => {
        const existingEntry = appData.trimestres.find(t => t.id_alumno === studentId && t.trimestre === trimestreNum);
        let updatedTrimestres;
        if (existingEntry) {
            updatedTrimestres = appData.trimestres.map(t => t.id_trimestre === existingEntry.id_trimestre
                ? Object.assign(Object.assign({}, t), { desbloqueado: !t.desbloqueado }) : t);
        }
        else {
            const newEntry = {
                id_trimestre: `t${Date.now()}${Math.random()}`.replace('.', ''),
                id_alumno: studentId,
                trimestre: trimestreNum,
                desbloqueado: true,
            };
            updatedTrimestres = [...appData.trimestres, newEntry];
        }
        onDataChange(Object.assign(Object.assign({}, appData), { trimestres: updatedTrimestres }));
    };
    const filteredAlumnos = useMemo(() => {
        const sortedAlumnos = [...appData.alumnos].sort((a, b) => a.nombre.localeCompare(b.nombre));
        if (!searchTerm.trim()) {
            return sortedAlumnos;
        }
        return sortedAlumnos.filter(a => a.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            a.ci.includes(searchTerm));
    }, [searchTerm, appData.alumnos]);
    return (React.createElement("div", { className: "management-container" },
        React.createElement("h3", null, "Gesti\u00F3n de Trimestres"),
        React.createElement("div", { className: "search-container", style: { margin: '0 0 2rem 0', maxWidth: '100%' } },
            React.createElement("div", { className: "input-group" },
                React.createElement("label", { htmlFor: "search-student-trimestre" }, "Buscar Alumno por Nombre o CI"),
                React.createElement("input", { type: "text", id: "search-student-trimestre", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), placeholder: "Escriba para filtrar...", autoComplete: "off" }))),
        React.createElement("div", { className: "table-container" },
            React.createElement("table", { className: "styled-table" },
                React.createElement("thead", null,
                    React.createElement("tr", null,
                        React.createElement("th", null, "Nombre del Alumno"),
                        React.createElement("th", null, "CI"),
                        React.createElement("th", null, "1er Trimestre"),
                        React.createElement("th", null, "2do Trimestre"),
                        React.createElement("th", null, "3er Trimestre"))),
                React.createElement("tbody", null, filteredAlumnos.map(student => {
                    const trimestresStatus = {
                        1: appData.trimestres.some(t => t.id_alumno === student.id_alumno && t.trimestre === 1 && t.desbloqueado),
                        2: appData.trimestres.some(t => t.id_alumno === student.id_alumno && t.trimestre === 2 && t.desbloqueado),
                        3: appData.trimestres.some(t => t.id_alumno === student.id_alumno && t.trimestre === 3 && t.desbloqueado),
                    };
                    return (React.createElement("tr", { key: student.id_alumno },
                        React.createElement("td", null, student.nombre),
                        React.createElement("td", null, student.ci),
                        [1, 2, 3].map(num => (React.createElement("td", { key: num },
                            React.createElement("label", { className: "switch" },
                                React.createElement("input", { type: "checkbox", checked: trimestresStatus[num], onChange: () => handleToggle(student.id_alumno, num) }),
                                React.createElement("span", { className: "slider" })))))));
                }))),
            filteredAlumnos.length === 0 && React.createElement("p", { className: "placeholder-text" }, "No se encontraron alumnos."))));
};
const DireccionDashboard = ({ user, onLogout, appData, onDataChange }) => {
    const [activeView, setActiveView] = useState('admin');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const dropdownRef = useRef(null);
    const viewTitles = {
        admin: 'Registrar Administradores',
        profesores: 'Registrar Profesores',
        alumnos: 'Registrar Alumnos',
        cursos: 'Registrar Cursos',
        notas: 'Registrar Notas',
        gestrimestres: 'Gestionar Trimestres',
        boletas: 'Boletas de Notas',
    };
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);
    const renderActiveView = () => {
        switch (activeView) {
            case 'admin':
                return React.createElement(AdminManagement, { appData: appData, onDataChange: onDataChange });
            case 'profesores':
                return React.createElement(TeacherManagement, { appData: appData, onDataChange: onDataChange });
            case 'alumnos':
                return React.createElement(StudentManagement, { appData: appData, onDataChange: onDataChange });
            case 'cursos':
                return React.createElement(CourseManagement, { appData: appData, onDataChange: onDataChange });
            case 'notas':
                return React.createElement(GradeManagement, { appData: appData, onDataChange: onDataChange });
            case 'gestrimestres':
                return React.createElement(TrimesterManagement, { appData: appData, onDataChange: onDataChange });
            case 'boletas':
                return React.createElement(BoletaManagement, { appData: appData });
            default:
                return (React.createElement("div", { className: "management-container" },
                    React.createElement("h3", null,
                        viewTitles[activeView],
                        " (Pr\u00F3ximamente)"),
                    React.createElement("p", null,
                        "Aqu\u00ED podr\u00E1 gestionar ",
                        viewTitles[activeView].toLowerCase(),
                        ".")));
        }
    };
    return (React.createElement("div", { className: "dashboard" },
        React.createElement("div", { className: "dashboard-header" },
            React.createElement("button", { className: "hamburger-menu", onClick: () => setIsMobileMenuOpen(true) }, "\u2630"),
            React.createElement("h1", null, "Panel de Direcci\u00F3n"),
            React.createElement("div", { className: "header-controls" },
                React.createElement("span", null,
                    "Bienvenido, ",
                    user.nombre),
                React.createElement("div", { className: "dropdown", ref: dropdownRef },
                    React.createElement("button", { onClick: () => setIsMenuOpen(prev => !prev), className: "dropdown-btn" }, "Gesti\u00F3n \u25BE"),
                    isMenuOpen && (React.createElement("div", { className: "dropdown-content" }, Object.entries(viewTitles).map(([key, title]) => (React.createElement("button", { key: key, onClick: () => { setActiveView(key); setIsMenuOpen(false); } }, title)))))),
                React.createElement("button", { onClick: onLogout }, "Cerrar Sesi\u00F3n"))),
        isMobileMenuOpen && (React.createElement(React.Fragment, null,
            React.createElement("div", { className: "mobile-nav-overlay", onClick: () => setIsMobileMenuOpen(false) }),
            React.createElement("div", { className: `mobile-nav ${isMobileMenuOpen ? 'open' : ''}` },
                React.createElement("button", { className: "mobile-nav-close", onClick: () => setIsMobileMenuOpen(false) }, "\u00D7"),
                Object.entries(viewTitles).map(([key, title]) => (React.createElement("button", { key: key, className: activeView === key ? 'active' : '', onClick: () => {
                        setActiveView(key);
                        setIsMobileMenuOpen(false);
                    } }, title)))))),
        React.createElement("div", { className: "dashboard-content" }, renderActiveView())));
};
const App = () => {
    const [currentUser, setCurrentUser] = useState(null);
    const [appData, setAppData] = useState(null);
    const [loadingMessage, setLoadingMessage] = useState('Conectando con la base de datos...');
    const [saveStatus, setSaveStatus] = useState({ message: '', type: 'idle' });
    const saveTimeoutRef = useRef(null);
    const loadData = useCallback(async () => {
        if (WEB_APP_URL.includes('PASTE_YOUR')) {
            setLoadingMessage('Error: La URL de la API no está configurada.');
            return;
        }
        try {
            const response = await fetch(WEB_APP_URL);
            if (!response.ok)
                throw new Error('Network response was not ok.');
            const data = await response.json();
            setAppData(data);
        }
        catch (error) {
            console.error("Failed to load data:", error);
            setLoadingMessage('Error al cargar los datos. Verifique la URL y la configuración del script.');
        }
    }, []);
    useEffect(() => {
        loadData();
    }, [loadData]);
    const handleDataChange = async (newAppData) => {
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
        setAppData(newAppData); // Optimistic update
        setSaveStatus({ message: 'Guardando...', type: 'saving' });
        try {
            const response = await fetch(WEB_APP_URL, {
                method: 'POST',
                redirect: 'follow',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({ action: 'setAllData', payload: newAppData })
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Error del servidor: ${errorText}`);
            }
            setSaveStatus({ message: '¡Cambios guardados!', type: 'success' });
        }
        catch (error) {
            console.error("Failed to save data:", error);
            setSaveStatus({ message: 'Error al guardar. Intente de nuevo.', type: 'error' });
        }
        finally {
            saveTimeoutRef.current = window.setTimeout(() => {
                setSaveStatus({ message: '', type: 'idle' });
            }, 3000);
        }
    };
    const handleLogin = (user) => {
        setCurrentUser(user);
    };
    const handleLogout = () => {
        setCurrentUser(null);
    };
    if (!appData) {
        return React.createElement(SplashScreen, { message: loadingMessage });
    }
    const renderDashboard = () => {
        if (!currentUser) {
            return React.createElement(LoginScreen, { onLogin: handleLogin, appData: appData, onDataChange: handleDataChange });
        }
        switch (currentUser.rol) {
            case 'Dirección':
                return React.createElement(DireccionDashboard, { user: currentUser, onLogout: handleLogout, appData: appData, onDataChange: handleDataChange });
            case 'Profesor':
                return React.createElement(ProfesorDashboard, { user: currentUser, onLogout: handleLogout, appData: appData, onDataChange: handleDataChange });
            case 'Alumno':
                return React.createElement(AlumnoDashboard, { user: currentUser, onLogout: handleLogout, appData: appData });
            default:
                return React.createElement(LoginScreen, { onLogin: handleLogin, appData: appData, onDataChange: handleDataChange });
        }
    };
    return (React.createElement(React.Fragment, null,
        renderDashboard(),
        React.createElement(SavingIndicator, { status: saveStatus })));
};
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(App, null));
