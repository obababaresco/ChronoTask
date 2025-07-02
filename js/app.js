document.addEventListener("DOMContentLoaded", () => {
  const taskForm = document.getElementById("task-form");
  const taskInput = document.getElementById("task-input");
  const taskTimeInput = document.getElementById("task-time");
  const taskList = document.getElementById("task-list");
  const alertSound = document.getElementById("alert-sound");
  const themeToggleButton = document.getElementById("theme-toggle");
  const body = document.body;

  let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

  // --- LÓGICA PARA MODO OSCURO ---
  const applyTheme = (theme) => {
    if (theme === "dark") {
      body.classList.add("dark-mode");
      themeToggleButton.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
      body.classList.remove("dark-mode");
      themeToggleButton.innerHTML = '<i class="fas fa-moon"></i>';
    }
  };

  themeToggleButton.addEventListener("click", () => {
    const currentTheme = body.classList.contains("dark-mode")
      ? "light"
      : "dark";
    localStorage.setItem("theme", currentTheme);
    applyTheme(currentTheme);
  });

  // --- LÓGICA DE LA APLICACIÓN ---
  const migrateTasks = () => {
    let needsSave = false;
    tasks.forEach((task) => {
      if (task.dateTime && !task.time) {
        task.time = task.dateTime.split("T")[1];
        delete task.dateTime;
        needsSave = true;
      }
    });
    if (needsSave) saveTasks();
  };

  const saveTasks = () => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  };

  const formatTime12h = (time24) => {
    if (!time24) return "";
    const [hours, minutes] = time24.split(":");
    const h = hours % 12 || 12;
    const ampm = hours < 12 ? "AM" : "PM";
    return `${h.toString().padStart(2, "0")}:${minutes} ${ampm}`;
  };

  const renderTasks = () => {
    taskList.innerHTML = "";
    tasks.sort((a, b) => a.time.localeCompare(b.time));

    if (tasks.length === 0) {
      taskList.innerHTML =
        '<li><p class="no-tasks-msg">No hay tareas pendientes. ¡Añade una!</p></li>';
      return;
    }

    tasks.forEach((task) => {
      const li = document.createElement("li");
      li.className = `task-item ${task.status}`;
      li.dataset.id = task.id;

      if (task.isEditing) {
        li.innerHTML = `
                    <div class="task-info">
                        <input type="text" class="edit-input" value="${task.text}">
                        <input type="time" class="edit-time" value="${task.time}">
                    </div>
                    <div class="task-actions">
                        <button class="btn-guardar-edicion" data-action="save-edit">Guardar</button>
                    </div>
                `;
      } else {
        li.innerHTML = `
                    <div class="task-info">
                        <span class="task-time">${formatTime12h(
                          task.time
                        )}</span>
                        <span class="task-text" title="${task.text}">${
          task.text
        }</span>
                    </div>
                    <div class="task-actions">
                        <button class="btn-realizada ${
                          task.status === "realizada" ? "active-status" : ""
                        }" data-action="realizada">Realizada</button>
                        <button class="btn-espera ${
                          task.status === "en-espera" ? "active-status" : ""
                        }" data-action="espera">En Espera</button>
                        <button class="btn-cancelada ${
                          task.status === "cancelada" ? "active-status" : ""
                        }" data-action="cancelada">Cancelada</button>
                        <i class="fas fa-pencil-alt icon-action icon-edit" title="Editar Tarea" data-action="edit"></i>
                        <i class="fas fa-trash-alt icon-action icon-delete" title="Borrar Tarea" data-action="delete"></i>
                    </div>
                `;
      }
      taskList.appendChild(li);
    });
  };

  taskForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = taskInput.value.trim();
    const time = taskTimeInput.value;

    if (text === "" || time === "") {
      alert("Por favor, completa todos los campos.");
      return;
    }

    const newTask = {
      id: Date.now(),
      text,
      time,
      status: "en-espera",
      alerted: false,
      isEditing: false,
    };

    tasks.push(newTask);
    saveTasks();
    renderTasks();
    taskForm.reset();
  });

  taskList.addEventListener("click", (e) => {
    const target = e.target;
    const action = target.dataset.action;
    if (!action) return;

    const li = target.closest(".task-item");
    const taskId = Number(li.dataset.id);
    const task = tasks.find((t) => t.id === taskId);
    let shouldRender = true;

    if (["realizada", "espera", "cancelada"].includes(action)) {
      task.status = `${action === "espera" ? "en-espera" : action}`;
    } else if (action === "delete") {
      if (confirm("¿Estás seguro de que quieres borrar esta tarea?")) {
        // Lógica de animación de borrado
        li.classList.add("exiting");

        // Esperar a que la animación termine para borrar el dato y renderizar
        setTimeout(() => {
          tasks = tasks.filter((t) => t.id !== taskId);
          saveTasks();
          renderTasks();
        }, 300); // Debe coincidir con la duración de la animación fadeOut

        shouldRender = false; // Evitamos el renderizado inmediato
      }
    } else if (action === "edit") {
      tasks.forEach((t) => (t.isEditing = t.id === taskId));
    } else if (action === "save-edit") {
      const newText = li.querySelector(".edit-input").value.trim();
      const newTime = li.querySelector(".edit-time").value;
      if (newText && newTime) {
        task.text = newText;
        task.time = newTime;
        task.isEditing = false;
      } else {
        alert("El texto y la hora no pueden estar vacíos.");
      }
    }

    if (shouldRender) {
      saveTasks();
      renderTasks();
    }
  });

  const checkAlarms = () => {
    const now = new Date();
    tasks.forEach((task) => {
      if (task.status !== "en-espera" || task.alerted || !task.time) return;
      const [hours, minutes] = task.time.split(":");
      const taskTimeToday = new Date();
      taskTimeToday.setHours(hours, minutes, 0, 0);
      if (now >= taskTimeToday) {
        alertSound.play();
        task.alerted = true;
        saveTasks();
      }
    });
  };

  // --- INICIALIZACIÓN ---
  const savedTheme = localStorage.getItem("theme") || "light";
  applyTheme(savedTheme);
  migrateTasks();
  renderTasks();
  setInterval(checkAlarms, 10000);
});
