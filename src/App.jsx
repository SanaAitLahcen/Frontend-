import React, { useState } from "react";
import "./App.css";

const ROWS = 20; // Nombre de lignes
const COLS = 30; // Nombre de colonnes

const generateMaze = () => 
  {
  return Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => (Math.random() < 0.3 ? 1 : 0)) // 30% d'obstacles
  );
};


//retrace le chemin en partant de la destination et en remontant jusqu'à l'origine(a partir des distances minimales)
const extractPathFromDistances = (distances, start, end, cols) => 
  {
  const path = [];
  let current = end[0] * cols + end[1]; // Convertir les coordonnées en index

  while (current !== start[0] * cols + start[1]) {
    path.push([Math.floor(current / cols), current % cols]); // Convertir l'index en coordonnées
    // Trouver la cellule précédente avec la distance minimale
    const neighbors = [
      current - cols, // Haut
      current + cols, // Bas
      current - 1,    // Gauche
      current + 1,    // Droite
    ];
    let next = current;
    for (const neighbor of neighbors) {
      if (distances[neighbor] < distances[next]) {
        next = neighbor;
      }
    }
    current = next;
  }

  path.push([Math.floor(start[0]), start[1]]); // Ajouter le point de départ
  return path.reverse(); // Inverser pour obtenir l'ordre correct
};

const App = () => {
  const [maze, setMaze] = useState(generateMaze);
  const [start, setStart] = useState(null);
  const [end, setEnd] = useState(null);
  const [path, setPath] = useState([]);
  const [visited, setVisited] = useState([]); // État pour les cases visitées
  const [distances, setDistances] = useState([]);

  //Génère un nouveau labyrinthe aléatoire.
  const handleGenerateMaze = () => {
    setMaze(generateMaze());
    setStart(null);
    setEnd(null);
    setPath([]);
    setVisited([]);
    setDistances([]);
  };

  //Permet à l’utilisateur de sélectionner un point de départ et un point d’arrivée en cliquant sur une cellule
  const handleCellClick = (rowIndex, colIndex) => {
    console.log("Clic sur la cellule :", rowIndex, colIndex);

    if (maze[rowIndex][colIndex] === 1) {
      console.log("Clic sur un mur, ignoré.");
      return; // Ignorer les murs
    }

    if (!start) 
      {
      setStart([rowIndex, colIndex]);
      console.log("Point de départ défini :", [rowIndex, colIndex]);
    } else if (!end) {
      setEnd([rowIndex, colIndex]);
      console.log("Point d'arrivée défini :", [rowIndex, colIndex]);
    } else {
      setStart([rowIndex, colIndex]);
      setEnd(null);
      console.log("Nouveau point de départ défini :", [rowIndex, colIndex]);
    }
  };

  const handleFindPath = async () => 
    {
    if (!start || !end) {
        alert("Veuillez sélectionner un point de départ et un point d'arrivée.");
        return;
    }

    const algorithm = document.querySelector(".dropdown").value;

    try {
        const response = await fetch(`http://localhost:8080/${algorithm}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                maze,
                start,
                end,
            }),
        });

        if (!response.ok) 
        {
            throw new Error("Erreur lors de la requête");
        }

        const result = await response.json();
        console.log("Réponse du serveur:", result); // Inspecter la réponse

        if (algorithm === "dijkstra") {
            setDistances(result.distances || []);
            setPath(extractPathFromDistances(result.distances, start, end, COLS));
        } else {
            setPath(result.path || []);
        }
        setVisited(result.visited || []); // Mettre à jour les cases visitées
        console.log("Updated visited state:", result.visited);
    } catch (error) {
        console.error("Erreur :", error);
        alert("Une erreur s'est produite lors de la recherche du chemin.");
    }
};
  const handleResetPath = () => 
    {
    setPath([]);
    setVisited([]);
    setDistances([]);
  };

  return (
    <div>
      <div className="navbar">
        <button onClick={handleGenerateMaze} className="button">Generate Maze</button>
        <select className="dropdown">
          <option value="dijkstra">Dijkstra</option>
          <option value="bfs">BFS</option>
        </select>
        <button onClick={handleFindPath} className="button">Visualize!</button>
        <button onClick={handleResetPath} className="button">Clear Path</button>
      </div>

      <div className="app">
        <div
          className="maze"
          style={{
            gridTemplateColumns: `repeat(${COLS}, 30px)`,
          }}
        >
        {maze.map((row, rowIndex) =>
        row.map((cell, colIndex) => {
        const isVisited = Array.isArray(visited) && visited.some(([x, y]) => x === rowIndex && y === colIndex);
        if (isVisited) {
        console.log(`Cell [${rowIndex}, ${colIndex}] is visited`);
         }
       return (
       <div
        key={`${rowIndex}-${colIndex}`}
        className={`cell ${cell === 1 ? "wall" : "path"} ${
          start && rowIndex === start[0] && colIndex === start[1] ? "start" : ""
        } ${
          end && rowIndex === end[0] && colIndex === end[1] ? "end" : ""
        } ${
          Array.isArray(path) && path.some(([x, y]) => x === rowIndex && y === colIndex) ? "path-cell" : ""
        } ${
          isVisited ? "visited" : ""
        }`}
        onClick={() => handleCellClick(rowIndex, colIndex)}
      ></div>
        );
        })
        )}
        </div>
      </div>
    </div>
  );
};

export default App;