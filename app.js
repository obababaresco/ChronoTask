document.addEventListener("DOMContentLoaded", () => {
  const taskForm = document.getElementById("task-form");
  const taskInput = document.getElementById("task-input");
  const taskTimeInput = document.getElementById("task-time");
  const taskStatusInput = document.getElementById("task-status");
  const taskList = document.getElementById("task-list");
  const alertSound = document.getElementById("alert-sound");
  const themeToggleButton = document.getElementById("theme-toggle");
  const deleteModal = document.getElementById("delete-modal");
  const deleteModalText = document.getElementById("delete-modal-text");
  const deleteConfirmBtn = document.getElementById("delete-confirm-btn");
  const deleteCancelBtn = document.getElementById("delete-cancel-btn");
  const alertModal = document.getElementById("task-alert-modal");
  const alertModalTitle = document.getElementById("task-alert-title");
  const alertModalText = document.getElementById("task-alert-text");
  const alertModalCloseBtn = document.getElementById("task-alert-close-btn");
  const body = document.body;
  const PRE_ALERT_WINDOW_MS = 60 * 1000; // 1 minuto antes del inicio

  let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
  let taskPendingDeletion = null;
  let elementPendingDeletion = null;

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
      if (typeof task.alerted === "undefined") {
        task.alerted = false;
        needsSave = true;
      }
      if (typeof task.preAlerted === "undefined") {
        task.preAlerted = false;
        needsSave = true;
      }
    });
    if (needsSave) saveTasks();
  };

  const playAlertSound = () => {
    if (!alertSound) return;
    try {
      alertSound.currentTime = 0;
      alertSound.play();
    } catch (error) {
      console.error("No se pudo reproducir la alerta:", error);
    }
  };

  const saveTasks = () => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  };

  const openModal = (modal) => {
    if (!modal) return;
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
  };

  const closeModal = (modal) => {
    if (!modal) return;
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
  };

  const closeDeleteModal = () => {
    closeModal(deleteModal);
    taskPendingDeletion = null;
    elementPendingDeletion = null;
  };

  const showDeleteModal = (task, listItem) => {
    taskPendingDeletion = task;
    elementPendingDeletion = listItem;
    deleteModalText.textContent = `La tarea "${task.text}" se eliminará permanentemente.`;
    openModal(deleteModal);
  };

  deleteConfirmBtn?.addEventListener("click", () => {
    if (!taskPendingDeletion || !elementPendingDeletion) {
      closeDeleteModal();
      return;
    }
    const taskId = taskPendingDeletion.id;
    const liElement = elementPendingDeletion;

    liElement.classList.add("exiting");

    setTimeout(() => {
      tasks = tasks.filter((t) => t.id !== taskId);
      saveTasks();
      renderTasks();
    }, 300);

    closeDeleteModal();
  });

  deleteCancelBtn?.addEventListener("click", closeDeleteModal);

  deleteModal?.addEventListener("click", (event) => {
    if (event.target === deleteModal) {
      closeDeleteModal();
    }
  });

  const closeAlertModal = () => closeModal(alertModal);

  const showTaskAlertModal = (task, type) => {
    if (!task) return;
    const isPreAlert = type === "pre";
    alertModalTitle.textContent = isPreAlert
      ? "Tu próxima tarea comienza pronto"
      : "Es momento de iniciar";
    alertModalText.textContent = `${formatTime12h(task.time)} · ${task.text}`;
    openModal(alertModal);
  };

  alertModalCloseBtn?.addEventListener("click", closeAlertModal);

  alertModal?.addEventListener("click", (event) => {
    if (event.target === alertModal) {
      closeAlertModal();
    }
  });

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
                        <button class="btn-curso ${
                          task.status === "en-curso" ? "active-status" : ""
                        }" data-action="curso">En Curso</button>
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
    const status = taskStatusInput.value || "en-espera";

    if (text === "" || time === "") {
      alert("Por favor, completa todos los campos.");
      return;
    }

    const newTask = {
      id: Date.now(),
      text,
      time,
      status,
      alerted: false,
      preAlerted: false,
      isEditing: false,
    };

    tasks.push(newTask);
    saveTasks();
    renderTasks();
    taskForm.reset();
    taskStatusInput.value = "en-espera";
  });

  taskList.addEventListener("click", (e) => {
    const target = e.target;
    const action = target.dataset.action;
    if (!action) return;

    const li = target.closest(".task-item");
    const taskId = Number(li.dataset.id);
    const task = tasks.find((t) => t.id === taskId);
    let shouldRender = true;

    if (["realizada", "espera", "cancelada", "curso"].includes(action)) {
      if (action === "espera") {
        task.status = "en-espera";
        task.alerted = false;
        task.preAlerted = false;
      } else if (action === "curso") {
        task.status = "en-curso";
      } else {
        task.status = action;
      }
    } else if (action === "delete") {
      showDeleteModal(task, li);
      shouldRender = false; // Evitamos el renderizado inmediato
    } else if (action === "edit") {
      tasks.forEach((t) => (t.isEditing = t.id === taskId));
    } else if (action === "save-edit") {
      const newText = li.querySelector(".edit-input").value.trim();
      const newTime = li.querySelector(".edit-time").value;
      if (newText && newTime) {
        task.text = newText;
        task.time = newTime;
        task.alerted = false;
        task.preAlerted = false;
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
    let shouldSave = false;

    tasks.forEach((task) => {
      if (task.status !== "en-espera" || !task.time) return;

      const [hours, minutes] = task.time.split(":");
      const taskTimeToday = new Date();
      taskTimeToday.setHours(hours, minutes, 0, 0);

      const diffMs = taskTimeToday.getTime() - now.getTime();

      if (diffMs <= PRE_ALERT_WINDOW_MS && diffMs > 0 && !task.preAlerted) {
        playAlertSound();
        showTaskAlertModal(task, "pre");
        task.preAlerted = true;
        shouldSave = true;
      }

      if (diffMs <= 0 && !task.alerted) {
        playAlertSound();
        showTaskAlertModal(task, "start");
        task.alerted = true;
        shouldSave = true;
      }
    });

    if (shouldSave) saveTasks();
  };

  // --- INICIALIZACIÓN ---
  const savedTheme = localStorage.getItem("theme") || "light";
  applyTheme(savedTheme);
  migrateTasks();
  renderTasks();
  setInterval(checkAlarms, 10000);
});
