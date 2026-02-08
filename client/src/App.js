import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import './App.css';

// Connect to the backend
const socket = io.connect("http://localhost:5000");

function App() {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#000000");

  useEffect(() => {
    const canvas = canvasRef.current;
    
    // Scale for high-resolution displays
    canvas.width = window.innerWidth * 2;
    canvas.height = window.innerHeight * 2;
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;

    const ctx = canvas.getContext("2d");
    ctx.scale(2, 2);
    ctx.lineCap = "round";
    ctx.lineWidth = 5;
    ctxRef.current = ctx;

    // Receive drawing data from other users
    socket.on("receive_drawing", (data) => {
      const { x, y, color: incomingColor, type } = data;
      ctxRef.current.strokeStyle = incomingColor;
      
      if (type === "start") {
        ctxRef.current.beginPath();
        ctxRef.current.moveTo(x, y);
      } else {
        ctxRef.current.lineTo(x, y);
        ctxRef.current.stroke();
      }
    });

    // Receive clear command
    socket.on("clear_canvas", () => {
      ctxRef.current.clearRect(0, 0, canvas.width, canvas.height);
    });

    return () => {
      socket.off("receive_drawing");
      socket.off("clear_canvas");
    };
  }, []);

  const startDrawing = ({ nativeEvent }) => {
    const { offsetX, offsetY } = nativeEvent;
    ctxRef.current.strokeStyle = color;
    ctxRef.current.beginPath();
    ctxRef.current.moveTo(offsetX, offsetY);
    setIsDrawing(true);
    
    socket.emit("send_drawing", { x: offsetX, y: offsetY, color, type: "start" });
  };

  const draw = ({ nativeEvent }) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = nativeEvent;
    
    ctxRef.current.lineTo(offsetX, offsetY);
    ctxRef.current.stroke();
    
    socket.emit("send_drawing", { x: offsetX, y: offsetY, color, type: "draw" });
  };

  const stopDrawing = () => {
    ctxRef.current.closePath();
    setIsDrawing(false);
  };

  const clearBoard = () => {
    const canvas = canvasRef.current;
    ctxRef.current.clearRect(0, 0, canvas.width, canvas.height);
    socket.emit("clear_canvas");
  };

  const downloadImage = () => {
    const canvas = canvasRef.current;
    const link = document.createElement("a");
    link.download = "whiteboard-export.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="App">
      <div className="toolbar">
        <input 
          type="color" 
          value={color} 
          onChange={(e) => setColor(e.target.value)} 
          title="Change Color"
        />
        <button className="clear-btn" onClick={clearBoard}>Clear</button>
        <button className="download-btn" onClick={downloadImage}>Download</button>
      </div>
      <canvas
        onMouseDown={startDrawing}
        onMouseUp={stopDrawing}
        onMouseOut={stopDrawing}
        onMouseMove={draw}
        ref={canvasRef}
      />
    </div>
  );
}

export default App;