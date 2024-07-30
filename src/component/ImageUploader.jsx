import { useState } from 'react';
import { Rnd } from 'react-rnd';
import GIF from 'gif.js.optimized';
import { GifReader } from 'omggif';

import gif1 from '../../public/gif/dancing_dog.gif';
import gif2 from '../../public/gif/pikachu.gif';
import gif3 from '../../public/gif/200w.gif';

const gifs = [gif1, gif2, gif3];

const ImageUploader = () => {
    const [image, setImage] = useState(null);
    const [gifInstance, setGifInstance] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onloadend = () => {
            setImage(reader.result);
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

    return (
        <div>
            {loading && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        border: '16px solid #f3f3f3',
                        borderRadius: '50%',
                        borderTop: '16px solid #3498db',
                        animation: 'spin 2s linear infinite'
                    }} />
                </div>
            )}

            <label htmlFor="imageUpload" style={{ cursor: 'pointer', background: '#f9f9f9', padding: '15px 35px', borderRadius: '10px' }}>
                Upload Image
            </label>
            <input id="imageUpload" hidden type="file" accept="image/*" onChange={handleImageUpload} />

            {image && (
                <>
                    <div
                        style={{
                            position: 'relative',
                            border: '1px solid #ddd',
                            marginTop: '20px',
                            overflow: 'hidden',
                        }}
                    >
                        <img src={image} alt="Uploaded" style={{ width: '100%', height: 'auto' }} />
                        {gifInstance && (
                            <Rnd
                                position={{ x: gifInstance.x, y: gifInstance.y }}
                                size={{ width: gifInstance.width, height: gifInstance.height }}
                                onDragStop={(e, d) => handleGifChange({ x: d.x, y: d.y })}
                                onResizeStop={(e, direction, ref, delta, position) => {
                                    handleGifChange({
                                        ...position,
                                        width: ref.style.width,
                                        height: ref.style.height,
                                    });
                                }}
                                style={{
                                    border: '1px dashed yellow',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <div style={{ position: 'relative' }}>
                                    <img src={gifInstance.gif} alt="GIF" style={{ width: gifInstance.width, height: gifInstance.height }} />
                                    <button
                                        onClick={removeGifInstance}
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            right: 0,
                                            background: 'red',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '50%',
                                            width: '20px',
                                            height: '20px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                            padding: 0,
                                            lineHeight: '20px',
                                        }}
                                    >
                                        &times;
                                    </button>
                                </div>
                            </Rnd>
                        )}
                    </div>

                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            margin: '20px 0',
                            gap: '20px',
                        }}
                    >
                        <p>Choose a GIF to insert:</p>

                        <div style={{ display: 'flex', gap: '10px' }}>
                            {gifs.map((gif, index) => (
                                <button key={index} onClick={() => addGifInstance(gif)}>
                                    <img width={100} height={100} src={gif} alt="GIF Thumbnail" />
                                </button>
                            ))}
                        </div>

                        <button onClick={exportImage}>Export GIF</button>
                    </div>
                </>
            )}

            <style>
                {`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}
            </style>
        </div>
    );
};

export default ImageUploader;
