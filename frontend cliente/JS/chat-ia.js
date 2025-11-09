// frontend_cliente/JS/chat-ia.js

document.addEventListener('DOMContentLoaded', () => {

  // 1. Obtenemos los elementos del HTML
  const chatForm = document.querySelector('form'); // [cite: 406]
  const userInput = document.getElementById('userInput'); // [cite: 407]
  const chatMessages = document.getElementById('chat-messages'); // El ID que acabas de agregar

  // 2. Asignamos el evento al formulario
  chatForm.addEventListener('submit', (e) => {
    e.preventDefault(); // Evita que la página se recargue
    const message = userInput.value.trim();

    if (message) {
      addMessage(message, 'user'); // Muestra la burbuja del usuario
      userInput.value = ''; // Limpia el campo de texto
      getAIResponse(message); // Llama al backend
    }
  });

  // 3. Función para AÑADIR burbujas de chat
  function addMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'flex items-start gap-4';

    let innerHTML = '';

    if (sender === 'user') {
      messageDiv.classList.add('justify-end'); // Alinea a la derecha
      innerHTML = `
        <div class="bg-[#2c2c2c] text-white rounded-2xl rounded-tr-none px-6 py-4 shadow-sm max-w-md">
          <p>${text}</p>
        </div>
        <div class="w-10 h-10 bg-[#d4af37] rounded-full flex items-center justify-center flex-shrink-0">
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
        </div>
      `; // [cite: 402-405]
    } else { // 'ai'
      innerHTML = `
        <div class="w-10 h-10 bg-[#2c2c2c] rounded-full flex items-center justify-center flex-shrink-0">
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
        </div>
        <div class="bg-white rounded-2xl rounded-tl-none px-6 py-4 shadow-sm">
          <p class="text-gray-700">${text}</p>
        </div>
      `; // [cite: 396-397]
    }
    
    messageDiv.innerHTML = innerHTML;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight; // Auto-scroll
  }

  // 4. Función para MOSTRAR que la IA está "escribiendo..."
  function showTypingIndicator() {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'flex items-start gap-4';
    messageDiv.id = 'typing-indicator'; // Le damos un ID para poder borrarlo
    messageDiv.innerHTML = `
      <div class="w-10 h-10 bg-[#2c2c2c] rounded-full flex items-center justify-center flex-shrink-0">
        <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
      </div>
      <div class="bg-white rounded-2xl rounded-tl-none px-6 py-4 shadow-sm">
        <div class="typing-dots">
          <span></span><span></span><span></span>
        </div>
      </div>
    `; // [cite: 388, 396-397]
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // 5. Función para QUITAR el "escribiendo..."
  function hideTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
      chatMessages.removeChild(typingIndicator);
    }
  }

  // 6. Función para OBTENER la respuesta del Backend (¡La Magia!)
  async function getAIResponse(userMessage) {
    showTypingIndicator(); // Muestra "escribiendo..."

    try {
      const response = await fetch('http://localhost:3000/api/chat', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({ question: userMessage }), 
      });

      if (!response.ok) {
          // Si falló (ej. error 429 de crédito), muestra el error
          const errorData = await response.json();
          throw new Error(errorData.error || 'Error en la respuesta del servidor.');
      }

      const data = await response.json();
      
      hideTypingIndicator(); // Oculta "escribiendo..."
      addMessage(data.answer, 'ai'); // Muestra la respuesta real

    } catch (error) {
      console.error('Error al contactar al servidor:', error);
      hideTypingIndicator(); // Oculta "escribiendo..."
      // Muestra un mensaje de error en el chat
      addMessage(`Lo siento, hubo un error al contactar al asistente. (Detalle: ${error.message})`, 'ai');
    }
  }

  // (Opcional) Hacer que los botones de categoría también funcionen
  const categoryBtns = document.querySelectorAll('.category-btn'); // [cite: 409]
  categoryBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      const message = `¿Qué opciones tienes para alguien ${this.textContent.trim()}?`;
      addMessage(message, 'user');
      getAIResponse(message);
    });
  });

});