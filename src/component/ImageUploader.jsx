import { useState, useEffect, useRef } from 'react';
import { Rnd } from 'react-rnd';
import GIF from 'gif.js.optimized';
import { GifReader } from 'omggif';

import gif1 from '../../public/gif/dancing_dog.gif';
import gif2 from '../../public/gif/pikachu.gif';
import gif3 from '../../public/gif/200w.gif';

const gifs = [gif1, gif2, gif3];

const ImageUploader = () => {
    const [image, setImage] = useState(null);
    const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
    const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });
    const [gifInstance, setGifInstance] = useState(null);
    const [loading, setLoading] = useState(false);
    const containerRef = useRef(null);

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onloadend = () => {
            const img = new Image();
            img.src = reader.result;
            img.onload = () => {
                setImage(reader.result);
                setImageDimensions({ width: img.width, height: img.height });
            };
        };
        reader.readAsDataURL(file);
    };

    const addGifInstance = (gif) => {
        setGifInstance({ gif: gif, x: 0, y: 0, width: 100, height: 100 });
    };

    const removeGifInstance = () => {
        setGifInstance(null);
    };

    const handleGifChange = (data) => {
        setGifInstance((prev) => ({ ...prev, ...data }));
    };

    const extractFrames = async (gifUrl) => {
        const response = await fetch(gifUrl);
        const buffer = await response.arrayBuffer();
        const gifReader = new GifReader(new Uint8Array(buffer));
        const frames = [];

        for (let i = 0; i < gifReader.numFrames(); i++) {
            const frameInfo = gifReader.frameInfo(i);
            const frameData = new Uint8Array(frameInfo.width * frameInfo.height * 4);
            gifReader.decodeAndBlitFrameRGBA(i, frameData);
            frames.push({ frameData, frameInfo, delay: frameInfo.delay * 10 });
        }

        return frames;
    };

    const exportImage = async () => {
        setLoading(true);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.src = image;

        img.onload = async () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            const gif = new GIF({
                workers: 2,
                quality: 10,
                workerScript: '/gif.worker.js',
            });

            const allFrames = [];
            const frames = await extractFrames(gifInstance.gif);

            frames.forEach((frame, idx) => {
                if (!allFrames[idx]) {
                    allFrames[idx] = {
                        canvas: document.createElement('canvas'),
                        delays: [],
                    };
                    allFrames[idx].canvas.width = img.width;
                    allFrames[idx].canvas.height = img.height;
                    const frameCtx = allFrames[idx].canvas.getContext('2d');
                    frameCtx.drawImage(img, 0, 0);
                }

                const frameCtx = allFrames[idx].canvas.getContext('2d');
                const frameImage = new ImageData(new Uint8ClampedArray(frame.frameData.buffer), frame.frameInfo.width, frame.frameInfo.height);

                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = frame.frameInfo.width;
                tempCanvas.height = frame.frameInfo.height;
                const tempCtx = tempCanvas.getContext('2d');
                tempCtx.putImageData(frameImage, 0, 0);

                const resizedCanvas = document.createElement('canvas');
                resizedCanvas.width = parseInt(gifInstance.width);
                resizedCanvas.height = parseInt(gifInstance.height);
                const resizedCtx = resizedCanvas.getContext('2d');
                resizedCtx.drawImage(tempCanvas, 0, 0, resizedCanvas.width, resizedCanvas.height);

                frameCtx.drawImage(resizedCanvas, gifInstance.x, gifInstance.y, resizedCanvas.width, resizedCanvas.height);
                allFrames[idx].delays.push(frame.delay);
            });

            allFrames.forEach((frame) => {
                gif.addFrame(frame.canvas, { delay: Math.max(...frame.delays) });
            });

            gif.on('finished', (blob) => {
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = 'exported-image.gif';
                link.click();
                setLoading(false);
            });
            gif.render();
        };
    };

    useEffect(() => {
        if (containerRef.current) {
            const handleResize = () => {
                const rect = containerRef.current.getBoundingClientRect();
                setContainerDimensions({ width: rect.width, height: rect.height });
            };

            handleResize();

            window.addEventListener('resize', handleResize);
            return () => window.removeEventListener('resize', handleResize);
        }
    }, [imageDimensions]);

    return (
        <div className="image-uploader">
            {loading && (
                <div className="loading-overlay">
                    <div className="spinner" />
                </div>
            )}

            <label htmlFor="imageUpload" className="upload-label">
                Upload Image
            </label>
            <input id="imageUpload" hidden type="file" accept="image/*" onChange={handleImageUpload} />

            {image && (
                <>
                    <div
                        className="image-container"
                        style={{ width: '100%', height: 'auto', maxWidth: '90vw' }}
                        ref={containerRef}
                    >
                        <img src={image} alt="Uploaded" style={{ width: '100%', height: 'auto' }} />
                        {gifInstance && (
                            <Rnd
                                position={{
                                    x: gifInstance.x * (containerDimensions.width / imageDimensions.width),
                                    y: gifInstance.y * (containerDimensions.height / imageDimensions.height),
                                }}
                                size={{
                                    width: gifInstance.width * (containerDimensions.width / imageDimensions.width),
                                    height: gifInstance.height * (containerDimensions.height / imageDimensions.height),
                                }}
                                onDragStop={(e, d) => handleGifChange({
                                    x: d.x * (imageDimensions.width / containerDimensions.width),
                                    y: d.y * (imageDimensions.height / containerDimensions.height),
                                })}
                                onResizeStop={(e, direction, ref, delta, position) => {
                                    handleGifChange({
                                        ...position,
                                        width: parseFloat(ref.style.width) * (imageDimensions.width / containerDimensions.width),
                                        height: parseFloat(ref.style.height) * (imageDimensions.height / containerDimensions.height),
                                    });
                                }}
                                lockAspectRatio={true}
                                style={{
                                    border: '1px dashed yellow',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <div style={{ position: 'relative' }}>
                                    <img src={gifInstance.gif} alt="GIF" style={{ width: '100%', height: '100%' }} />
                                    <button
                                        onClick={removeGifInstance}
                                        className="remove-gif-button"
                                    >
                                        &times;
                                    </button>
                                </div>
                            </Rnd>
                        )}
                    </div>

                    <div className="controls">
                        <p className="choose-gif-text">Choose a GIF to insert:</p>

                        <div className="gif-options">
                            {gifs.map((gif, index) => (
                                <button className="gif-button" key={index} onClick={() => addGifInstance(gif)}>
                                    <img width={100} height={100} src={gif} alt="GIF Thumbnail" />
                                </button>
                            ))}
                        </div>

                        <button className="export-button" onClick={exportImage}>Export GIF</button>
                    </div>
                </>
            )}

            <style jsx>{`
                .image-uploader {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding: 20px;
                }

                .upload-label {
                    cursor: pointer;
                    background: #f9f9f9;
                    padding: 15px 35px;
                    border-radius: 10px;
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                    font-weight: bold;
                    text-align: center;
                }

                .image-container {
                    position: relative;
                    border: 1px solid #ddd;
                    margin-top: 20px;
                    overflow: hidden;
                }

                .controls {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    margin: 20px 0;
                    gap: 20px;
                }

                .choose-gif-text {
                    font-weight: bold;
                }

                .gif-options {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 10px;
                    justify-content: center;
                }

                .gif-button {
                    padding: 0;
                    background: none;
                    border: none;
                    cursor: pointer;
                }

                .export-button {
                    padding: 10px 20px;
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                    background: #3498db;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    font-weight: bold;
                }

                .loading-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0, 0, 0, 0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                }

                .spinner {
                    width: 80px;
                    height: 80px;
                    border: 16px solid #f3f3f3;
                    border-radius: 50%;
                    border-top: 16px solid #3498db;
                    animation: spin 2s linear infinite;
                }

                .remove-gif-button {
                    position: absolute;
                    top: 0;
                    right: 0;
                    background: red;
                    color: white;
                    border: none;
                    border-radius: 50%;
                    width: 20px;
                    height: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    padding: 0;
                    line-height: 20px;
                }

                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                @media (max-width: 768px) {
                    .upload-label {
                        padding: 10px 20px;
                    }

                    .image-container {
                        max-width: 100%;
                    }

                    .gif-button img {
                        width: 80px;
                        height: 80px;
                    }

                    .export-button {
                        padding: 8px 16px;
                    }
                }

                @media (max-width: 480px) {
                    .upload-label {
                        padding: 8px 15px;
                        font-size: 14px;
                    }

                    .gif-button img {
                        width: 60px;
                        height: 60px;
                    }

                    .export-button {
                        padding: 6px 12px;
                        font-size: 14px;
                    }
                    .remove-gif-button {
                        display: none;
                    }
                }
            `}</style>
        </div>
    );
};

export default ImageUploader;
