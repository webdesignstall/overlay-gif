import React, { useRef, useState, useEffect } from 'react';
import { fabric } from 'fabric';
import GIF from 'gif.js';
import * as gifler from 'gifler';

const GifOverlayApp = () => {
    const [canvas, setCanvas] = useState(null);
    const [gifUrl, setGifUrl] = useState('');
    const canvasRef = useRef(null);

    useEffect(() => {
        const fabricCanvas = new fabric.Canvas(canvasRef.current);
        setCanvas(fabricCanvas);
    }, []);

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const imgElement = document.createElement('img');
                imgElement.src = event.target.result;
                imgElement.onload = () => {
                    fabric.Image.fromURL(imgElement.src, (img) => {
                        canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas));
                    });
                };
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAddGif = (gifUrl) => {
        setGifUrl(gifUrl);
        if (canvas) {
            gifler.gifler(gifUrl).frames(canvasRef.current, (ctx, frame) => {
                ctx.drawImage(frame.buffer, 0, 0);
            });
        }
    };

    const handleExport = () => {
        if (!canvas || !gifUrl) return;

        const gif = new GIF({
            workers: 2,
            quality: 10,
            repeat: 0,
        });

        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');

        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;

        const frameCount = 10; // Simulated frame count for example
        for (let i = 0; i < frameCount; i++) {
            const dataUrl = canvas.toDataURL('image/png');
            const img = new Image();
            img.src = dataUrl;

            img.onload = () => {
                tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
                tempCtx.drawImage(img, 0, 0);
                gif.addFrame(tempCanvas, { delay: 500 });

                if (i === frameCount - 1) {
                    gif.on('finished', (blob) => {
                        const link = document.createElement('a');
                        link.href = URL.createObjectURL(blob);
                        link.download = 'output.gif';
                        link.click();
                    });

                    gif.render();
                }
            };

            img.onerror = () => {
                console.error('Failed to load image for GIF export');
            };
        }
    };

    return (
        <div>
            <input type="file" accept="image/*" onChange={handleImageUpload} />
            <button onClick={() => handleAddGif('https://media.giphy.com/media/3o6Zt2zVzr3U3XkC8E/giphy.gif')}>Add Dancing Dog</button>
            <button onClick={handleExport}>Export GIF</button>
            <canvas ref={canvasRef} width={800} height={600} />
        </div>
    );
};

export default GifOverlayApp;
