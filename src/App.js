import "./App.css";

import { useEffect, useRef, useState } from "react";

let ctx; // context for the canvas

function App() {
  const canvasRef = useRef();
  const [images, setImages] = useState([]); // this will hold all of the images
  const [activeElements, setActiveElements] = useState([]); // this will hold everything being dragged

  const loadImage = (src) => {
    // Initial check to see that image isn't already loaded
    if (!images.some((img) => img.src === src)) {
      const image = new Image();
      image.src = src;
      image.onload = () => {
        const { width, height } = image;
        setImages((prevImages) => {
          // If image is already in the array, don't add it again
          if (prevImages.some((img) => img.src === src)) return prevImages;

          // Randomize position of image, constraining it to the canvas area
          const x = Math.random() * (canvasRef.current.width - width);
          const y = Math.random() * (canvasRef.current.height - height);

          return [
            ...prevImages,
            {
              image,
              src,
              width,
              height,
              x,
              y,

              // Allows image to scale with the canvas
              widthRatio: width / canvasRef.current.width,
              heightRatio: height / canvasRef.current.height,

              // Used for keeping track of the position from which the image is being dragged
              xLast: x,
              yLast: y,

              // Allows image position to scale with the canvas
              xRatio: x / canvasRef.current.width,
              yRatio: y / canvasRef.current.height,
            },
          ];
        });
      };
    }
  };

  // Given a mousedown event and an image src, save the position of the mouse and activte the image for dragging
  const activateDrag = (e, src) => {
    e.preventDefault();
    setActiveElements((prevActiveElements) => {
      if (prevActiveElements.some((el) => el.src === src)) {
        return prevActiveElements;
      }
      return [...prevActiveElements, { src, x: e.clientX, y: e.clientY }];
    });
  };

  // Given an image src, remove it from the active elements and update its position
  const deactivateDrag = (src) => {
    setImages((prevImages) =>
      prevImages.map((img) => {
        const activeDrag = activeElements.find((el) => el.src === img.src);
        if (activeDrag) {
          // Update the additional position properties to reflect the new position of the image
          img.xLast = img.x;
          img.yLast = img.y;
          img.xRatio = img.x / canvasRef.current.width;
          img.yRatio = img.y / canvasRef.current.height;
        }
        return img;
      })
    );
    setActiveElements((prevActiveElements) => {
      return prevActiveElements.filter((el) => el.src !== src);
    });
  };

  const dragImage = (e) => {
    e.preventDefault();

    // Check that there are any active elements to begin with
    if (activeElements.length === 0) return;

    setImages((prevImages) =>
      prevImages.map((img) => {
        const activeDrag = activeElements.find((el) => el.src === img.src);
        if (activeDrag) {
          const movedX = img.xLast + (e.clientX - activeDrag.x);
          const movedY = img.yLast + (e.clientY - activeDrag.y);

          // Constrain the movement of the image to fit within the canvas
          const leftConstraint = 0;
          const rightConstraint = canvasRef.current.width - img.width;
          const topConstraint = 0;
          const bottomConstraint = canvasRef.current.height - img.height;

          if (movedX < leftConstraint) img.x = leftConstraint;
          else if (movedX > rightConstraint) img.x = rightConstraint;
          else img.x = movedX;

          if (movedY < topConstraint) img.y = topConstraint;
          else if (movedY > bottomConstraint) img.y = bottomConstraint;
          else img.y = movedY;
        }
        return img;
      })
    );
  };

  // Scales the canvas and images to follow the canvas element's responsive resizing
  const handleResize = () => {
    if (ctx && canvasRef.current) {
      // These are the updated dimensions of the canvas element
      const updatedWidth = canvasRef.current.offsetWidth;
      const updatedHeight = canvasRef.current.offsetHeight;

      // Resize the dimensions of the canvas
      ctx.canvas.width = updatedWidth;
      ctx.canvas.height = updatedHeight;

      // Resize the images and proportionally update the positions of the images
      setImages((prevImages) => {
        return prevImages.map((img) => {
          img.width = img.widthRatio * updatedWidth;
          img.height = img.heightRatio * updatedHeight;
          img.x = img.xRatio * updatedWidth;
          img.y = img.yRatio * updatedHeight;
          img.xLast = img.x;
          img.yLast = img.y;
          return img;
        });
      });
    }
  };

  // When component is first loaded
  useEffect(() => {
    // Call the resize function once to set the initial dimensions of the canvas
    handleResize();

    // Add event listener for window resize
    window.addEventListener("resize", handleResize);

    // Load images
    loadImage("/cat.png");
    loadImage("/dog.png");

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // When the canvas is first loaded
  useEffect(() => {
    ctx = canvasRef.current.getContext("2d");
  }, [canvasRef.current]);

  // Redraw images whenever there is a change in the images array
  useEffect(() => {
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    images.forEach(({ image, width, height, x, y }) => {
      ctx.drawImage(image, x, y, width, height);
    });
  }, [images]);

  return (
    <div className="App">
      <div className="canvasWrapper">
        <canvas ref={canvasRef}></canvas>
        <div className="draggablesWrapper">
          {images.map(({ src, width, height, x, y }) => (
            <div
              className={`draggable ${
                activeElements.some((el) => el.src === src) ? "active" : ""
              }`}
              key={src}
              style={{ width, height, left: x, top: y }}
              onMouseDown={(e) => activateDrag(e, src)}
              onMouseUp={() => deactivateDrag(src)}
              onMouseOut={() => deactivateDrag(src)}
              onMouseMove={dragImage}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
