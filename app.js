// app.js
// --- Gestión del tema ---
const toggleBtn = document.getElementById('theme-toggle');
toggleBtn.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme');
  if (current === 'light') {
    document.documentElement.removeAttribute('data-theme');
    toggleBtn.textContent = '🌙';
  } else {
    document.documentElement.setAttribute('data-theme', 'light');
    toggleBtn.textContent = '☀️';
  }
});

// --- Año automático y carga inicial ---
document.addEventListener('DOMContentLoaded', () => {
  // Año en el footer
  const yearSpan = document.getElementById('current-year');
  if (yearSpan) yearSpan.textContent = new Date().getFullYear();

  // Cargar tareas
  fetchTasks();

  // --- Menú hamburguesa (solo móvil) ---
  const menuToggle = document.getElementById('menu-toggle');
  const navLinks = document.querySelector('.nav-links');

  if (menuToggle && navLinks) {
    // Al hacer clic en el ícono hamburguesa, alternar la clase 'active'
    menuToggle.addEventListener('click', () => {
      navLinks.classList.toggle('active');
    });
    // Al hacer clic en cualquier enlace del menú, cerrar el menú
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('active');
      });
    });
  }
});

// --- API y tareas ---
const API_URL = 'http://localhost:5000/api/tasks';
const form = document.getElementById('task-form');
const taskList = document.getElementById('task-list');

async function fetchTasks() {
  try {
    const res = await fetch(API_URL);
    const tasks = await res.json();
    
    taskList.innerHTML = '';
    tasks.forEach(t => {
      const li = document.createElement('li');

      const taskText = document.createElement('span');
      taskText.textContent = `${t.title} - ${t.description}`;

      const btnContainer = document.createElement('div');
      btnContainer.classList.add('task-buttons');

      const editBtn = document.createElement('button');
      editBtn.textContent = '✏️';
      editBtn.classList.add('edit-btn');
      editBtn.addEventListener('click', () => editTask(t));
      
      const delBtn = document.createElement('button');
      delBtn.textContent = '❌';
      delBtn.classList.add('delete-btn');
      delBtn.addEventListener('click', () => deleteTask(t._id));

      btnContainer.appendChild(editBtn);
      btnContainer.appendChild(delBtn);

      li.appendChild(taskText);
      li.appendChild(btnContainer);

      taskList.appendChild(li);
    });
  } catch (err) {
    console.error('Error al obtener tareas:', err);
  }
}

form.addEventListener('submit', async e => {
  e.preventDefault();
  const title = document.getElementById('title').value.trim();
  const description = document.getElementById('description').value.trim();
  if (!title || !description) return;

  Swal.fire({ title: 'Agregando tarea...', html: '<i>Por favor espera</i>', allowOutsideClick: false, showConfirmButton: false, didOpen: () => Swal.showLoading() });
  try {
    const res = await fetch(API_URL, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ title, description }) });
    const data = await res.json();
    if (res.ok) {
      Swal.fire({ icon: 'success', title: 'Tarea agregada', timer: 1200, showConfirmButton: false });
      form.reset();
      fetchTasks();
    } else {
      Swal.fire({ icon: 'error', title: 'Error', text: data.error || 'No se pudo crear la tarea' });
    }
  } catch (err) {
    Swal.fire({ icon: 'error', title: 'Error de red', text: 'Revisa tu conexión.' });
    console.error(err);
  }
});

// --- Funciones de edición y eliminación ---
async function editTask(task) {
  const { value: formValues } = await Swal.fire({
    title: 'Editar tarea',
    html: `
      <input id="swal-input1" class="swal2-input" placeholder="Título" value="${task.title}">
      <textarea id="swal-input2" class="swal2-textarea" placeholder="Descripción">${task.description}</textarea>
    `,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: 'Guardar cambios',
    cancelButtonText: 'Cancelar',
    background: 'var(--bg-color)',
    color: 'var(--text-color)',
    preConfirm: () => {
      const title = document.getElementById('swal-input1').value.trim();
      const description = document.getElementById('swal-input2').value.trim();
      if (!title || !description) {
        Swal.showValidationMessage('Por favor, completa ambos campos');
        return false;
      }
      return { title, description };
    }
  });

  if (formValues) {
    try {
      const res = await fetch(`${API_URL}/${task._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formValues)
      });

      if (res.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Tarea actualizada',
          timer: 1200,
          showConfirmButton: false,
          background: 'var(--bg-color)',
          color: 'var(--text-color)'
        });
        fetchTasks();
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo actualizar la tarea.',
          background: 'var(--bg-color)',
          color: 'var(--text-color)'
        });
      }
    } catch (err) {
      console.error('Error al actualizar tarea:', err);
    }
  }
}

async function deleteTask(id) {
  const result = await Swal.fire({
    title: '¿Estás seguro?',
    text: 'Esta acción eliminará la tarea permanentemente.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#e11d48',
    cancelButtonColor: '#64748b',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar',
    background: 'var(--bg-color)',
    color: 'var(--text-color)'
  });

  if (result.isConfirmed) {
    try {
      const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      if (res.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Eliminado',
          text: 'La tarea ha sido eliminada.',
          timer: 1200,
          showConfirmButton: false,
          background: 'var(--bg-color)',
          color: 'var(--text-color)'
        });
        fetchTasks();
      }
    } catch (err) {
      console.error('Error al eliminar tarea:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo eliminar la tarea.',
        background: 'var(--bg-color)',
        color: 'var(--text-color)'
      });
    }
  }
}
