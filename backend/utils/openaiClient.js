// backend/utils/openaiClient.js

import { OpenAI } from 'openai';

// Creamos la instancia. 
// 'index.js' y 'package.json' se encargan de cargar
// el .env, por lo que process.env.OPENAI_API_KEY estará disponible.
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Exportamos la instancia para usarla en nuestras rutas
export default openai;