// Se elimina la importación de tipos como MatchingConfig y Activity si solo se usan para tipado
// Si Activity se exporta como un valor en './types', entonces se debería importar desde donde sea su origen real.
// Asumiendo que GameBase es una clase exportada para runtime:
import { GameBase } from "./abstract/GameBase";
import React from 'react'; // Necesario si el método render usa JSX


// Se eliminan todas las definiciones de tipos personalizadas
// type MatchingGameData = { ... };
// type MatchingState = { ... };


// Se elimina 'private' y las anotaciones de tipo de las propiedades de clase.
// gameData; // Declarada, se asigna en initializeGame
// gameState; // Declarada, se inicializa en el constructor


export class MatchingGame extends GameBase {
  // En JS, declaras las propiedades o las inicializas en el constructor/directamente
  // Aunque TypeScript requiere la declaración si no se inicializan en el constructor,
  // en JS no es estrictamente necesario declararlas antes si se asignan en el constructor o métodos.
  // Sin embargo, declararlas aquí ayuda a la legibilidad.
  gameData; // Corresponde a MatchingGameData en TS
  gameState; // Corresponde a MatchingState & GameState en TS

  // Se elimina la anotación de tipo del parámetro 'activity: Activity'
  constructor(activity) {
    // Llama al constructor de GameBase
    super(activity);

    // Inicializa/Completa gameState.
    // El '...this.gameState' trae las propiedades base { score: 0, completed: false } de GameBase.
    this.gameState = {
      ...this.gameState, // Mantiene score y completed de GameBase
      selectedLeft: null,
      selectedRight: null,
      matches: {}
    };

    // Nota: this.gameData NO se inicializa en el constructor como en el ejemplo anterior.
    // Se asigna en initializeGame(). Esto es válido en JS.
  }

  // --- Implementación de Métodos Abstractos de GameBase ---

  // Se elimina la anotación de tipo ': void'
  initializeGame() {
    // Se elimina la aserción de tipo 'as MatchingConfig'.
    const config = this.activity.config; // En JS, accedes directamente
    // Asume que config es el objeto esperado por generateMatchingGame
    this.gameData = this.generateMatchingGame(config);
  }

  /**
   * Maneja las acciones del usuario.
   */
  // Se elimina la anotación de tipo del parámetro 'action: { type: string; payload: any }' y del retorno ': void'
  handleAction(action) {
    switch(action.type) {
      case 'SELECT_LEFT':
        // Se elimina la anotación de tipo del parámetro de handleLeftSelection
        this.handleLeftSelection(action.payload.index);
        break;
      case 'SELECT_RIGHT':
        // Se elimina la anotación de tipo del parámetro de handleRightSelection
        this.handleRightSelection(action.payload.index);
        break;
      // ... otros tipos de acción
      default:
        console.warn("Acción desconocida:", action);
    }
  }

  /**
   * Renderiza la interfaz de usuario del juego.
   */
  // Se elimina la anotación de tipo ': React.ReactNode'
  render() {
    // El código JSX se mantiene
    return (
      <div className="matching-game">
        {/* Renderizado del juego de emparejamiento usando this.gameData y this.gameState */}
        {/* Necesitarás renderizar los items y manejar clicks llamando a this.handleAction */}
        <h2>Matching Game: {this.activity.title}</h2>
        <div style={{ display: 'flex', justifyContent: 'space-around' }}>
            {/* Columna Izquierda */}
            <div>
                <h3>Izquierda</h3>
                {this.gameData?.leftItems?.map((item, index) => (
                    <div
                        key={item.id}
                        onClick={() => this.handleAction({ type: 'SELECT_LEFT', payload: { index } })}
                        style={{
                            padding: '10px',
                            margin: '5px',
                            border: '1px solid #ccc',
                            cursor: 'pointer',
                            // Ejemplo de estilo basado en estado:
                            backgroundColor: this.gameState?.selectedLeft === index ? '#a5d6a7' :
                                (this.gameState?.matches && this.gameState.matches[index] !== undefined) ? '#c8e6c9' : '#fff' // Verde claro si emparejado
                        }}
                    >
                        {item.content}
                    </div>
                ))}
            </div>
            {/* Columna Derecha */}
             <div>
                <h3>Derecha</h3>
                {this.gameData?.rightItems?.map((item, index) => (
                    <div
                        key={item.id}
                        onClick={() => this.handleAction({ type: 'SELECT_RIGHT', payload: { index } })}
                         style={{
                            padding: '10px',
                            margin: '5px',
                            border: '1px solid #ccc',
                            cursor: 'pointer',
                            // Ejemplo de estilo basado en estado:
                             backgroundColor: this.gameState?.selectedRight === index ? '#a5d6a7' :
                                (this.gameState?.matches && Object.values(this.gameState.matches).includes(index)) ? '#c8e6c9' : '#fff'
                        }}
                    >
                        {item.content}
                    </div>
                ))}
            </div>
        </div>
         <p>Score: {this.gameState?.score || 0}</p>
         {this.gameState?.completed && <p>¡Juego Completado!</p>}
      </div>
    );
  }


  // --- Métodos Específicos de MatchingGame ---

  // Se elimina 'private', y las anotaciones de tipo del parámetro 'config: MatchingConfig' y del retorno ': MatchingGameData'
  generateMatchingGame(config) {
    // Implementación de la generación de pares se mantiene (es válido JS)
    const { matching } = config;
    let { pairs, shuffle } = matching;

    // Copia el array antes de ordenar si shuffle es true para no modificar el original en config
    if (shuffle) {
      pairs = [...pairs].sort(() => Math.random() - 0.5);
    }

    const leftItems = pairs.map((pair, index) => ({
      id: `left-${index}`,
      content: pair.left,
      originalIndex: index // originalIndex del par en el array de configuración
    }));

    // Mezcla los rightItems independientemente
    const rightItems = pairs.map((pair, index) => ({
      id: `right-${index}`,
      content: pair.right,
      originalIndex: index // originalIndex del par en el array de configuración
    })).sort(() => Math.random() - 0.5); // Mezcla

    // El array original 'pairs' (mezclado o no) es útil para verificar matches
    return { leftItems, rightItems, pairs };
  }

  // Se elimina 'private' y la anotación de tipo del parámetro 'index: number'. Se añade cuerpo.
  handleLeftSelection(index) {
     console.log(`Seleccionado ítem izquierdo con índice: ${index}`);
     this.updateGameState({ selectedLeft: index, selectedRight: null }); // Limpiar selección derecha al seleccionar izquierda
     this.checkForMatch(); // Comprobar si hay un match si ya había un ítem derecho seleccionado
  }

  // Se elimina 'private' y la anotación de tipo del parámetro 'index: number'. Se añade cuerpo.
  handleRightSelection(index) {
    console.log(`Seleccionado ítem derecho con índice: ${index}`);
    // Solo actualiza la selección derecha
    this.updateGameState({ selectedRight: index });
    this.checkForMatch(); // Comprobar si hay un match inmediatamente
  }

   /**
    * Comprueba si las selecciones actuales izquierda y derecha forman un par válido.
    * Implementación de ejemplo - NECESITA LÓGICA ROBUSTA.
    */
   // Nuevo método en JS (no estaba completamente definido en TS snippet)
   checkForMatch() {
       const { selectedLeft, selectedRight, matches } = this.gameState;
       const { leftItems, rightItems, pairs } = this.gameData;

       // Asegurarse de que ambos ítems estén seleccionados
       if (selectedLeft !== null && selectedRight !== null) {
           const leftItem = leftItems[selectedLeft];
           const rightItem = rightItems[selectedRight];

           // Lógica para verificar si coinciden.
           // Esto depende de cómo generaste el juego y qué defines como "match".
           // Un enfoque común es usar el originalIndex para verificar el par.
           // Verificar si el par original (basado en originalIndex) de leftItem
           // coincide con el par original de rightItem.

           const isMatch = leftItem.originalIndex === rightItem.originalIndex;

           if (isMatch) {
               console.log(`¡Match encontrado entre ${leftItem.content} y ${rightItem.content}!`);
               const newMatches = { ...matches, [selectedLeft]: selectedRight }; // Guarda el match [indiceIzquierda]: indiceDerecha

               // Actualizar estado: añadir match, limpiar selecciones, calcular score
               this.updateGameState({
                   matches: newMatches,
                   selectedLeft: null,
                   selectedRight: null,
               });

               // Calcular y actualizar score
               const newScore = this.calculateScore();
               this.updateGameState({ score: newScore });

               // Comprobar si el juego ha terminado (todos los pares encontrados)
               if (Object.keys(newMatches).length === pairs.length) {
                   console.log("¡Todos los pares encontrados!");
                   this.completeGame(); // Llama al método de GameBase para completar el juego
               } else {
                    // Guardar progreso después de encontrar un match (opcional)
                    this.saveProgress();
               }

           } else {
               console.log("No hay match. Limpiando selecciones.");
               // Limpiar selecciones si no hay match después de un breve retraso
               // para que el usuario pueda ver su error
               setTimeout(() => {
                    this.updateGameState({
                        selectedLeft: null,
                        selectedRight: null,
                    });
               }, 500); // Espera 500ms antes de limpiar
           }
       }
   }


  /**
   * Calcula la puntuación basada en los pares correctos encontrados.
   * Sobrescribe el método base.
   */
  // Se elimina la anotación de tipo ': number'
  calculateScore() {
    // Puntaje basado en pares correctos
    // Object.keys(this.gameState.matches).length da el número de pares encontrados
    const matches = Object.keys(this.gameState.matches).length;
    const totalPairs = this.gameData.pairs.length; // Total de pares posibles
     if (totalPairs === 0) {
       return 0; // Evitar división por cero
     }
    const score = Math.floor((matches / totalPairs) * this.activity.points);
    return score;
  }

  // Hereda y puede usar:
  // this.activity (datos de la actividad)
  // this.getGameState() (obtiene el estado actual)
  // this.updateGameState(updates) (actualiza parcialmente el estado)
  // this.completeGame() (marca el juego como completado y guarda)
  // this.saveProgress() (guarda el progreso)
}