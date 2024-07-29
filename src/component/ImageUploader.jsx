// components/ImageUploader.js

import { useState } from 'react';
import { Rnd } from 'react-rnd';
import GIF from 'gif.js.optimized';
import { GifReader } from 'omggif';

import dancingDog1 from '../assets/img/dancing-dog1.gif';
import dog2 from '../assets/img/dog2.png';

const gifs = [
    dancingDog1,
    dog2,
];

const ImageUploader = () => {
    const [image, setImage] = useState(null);
    const [selectedGif, setSelectedGif] = useState(gifs[0]);
    const [gifInstances, setGifInstances] = useState([]);

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onloadend = () => {
            setImage(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const addGifInstance = () => {
        setGifInstances([...gifInstances, { gif: selectedGif, x: 0, y: 0, width: 100, height: 100 }]);
    };

    const handleGifChange = (index, data) => {
        const updatedGifs = gifInstances.map((instance, idx) => (idx === index ? { ...instance, ...data } : instance));
        setGifInstances(updatedGifs);
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
            frames.push({ frameData, frameInfo });
        }

        return frames;
    };





     const exportImage = async () => {
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

             for (const instance of gifInstances) {
                 const frames = await extractFrames(instance.gif);
                 frames.forEach((frame, idx) => {
                     if (!allFrames[idx]) {
                         allFrames[idx] = document.createElement('canvas');
                         allFrames[idx].width = img.width;
                         allFrames[idx].height = img.height;
                         const frameCtx = allFrames[idx].getContext('2d');
                         frameCtx.drawImage(img, 0, 0);
                     }

                     const frameCtx = allFrames[idx].getContext('2d');
                     const frameImage = new ImageData(new Uint8ClampedArray(frame.frameData.buffer), frame.frameInfo.width, frame.frameInfo.height);
                     frameCtx.putImageData(frameImage, instance.x, instance.y);
                 });
             }

             allFrames.forEach(frame => gif.addFrame(frame, { delay: 80 }));
             gif.on('finished', (blob) => {
                 const link = document.createElement('a');
                 link.href = URL.createObjectURL(blob);
                 link.download = 'exported-image.gif';
                 link.click();
             });
             gif.render();
         };
     };






    return (
        <div>
            <input type="file" accept="image/*" onChange={handleImageUpload} />
            <div>
                {gifs.map((gif, index) => (
                    <button key={index} onClick={() => setSelectedGif(gif)}>
                        Select GIF {index + 1}
                    </button>
                ))}
            </div>
            <button onClick={addGifInstance}>Add Dancing Dog</button>
            <button onClick={exportImage}>Export Image</button>
            <div style={{ position: 'relative', width: '100%', height: '500px', border: '1px solid #ddd', marginTop: '20px' }}>
                {image && <img src={image} alt="Uploaded" style={{ width: '100%', height: 'auto' }} />}
                {gifInstances.map((instance, index) => (
                    <Rnd
                        key={index}
                        default={{
                            x: instance.x,
                            y: instance.y,
                            width: instance.width,
                            height: instance.height,
                        }}
                        onDragStop={(e, d) => handleGifChange(index, { x: d.x, y: d.y })}
                        onResizeStop={(e, direction, ref, delta, position) => {
                            handleGifChange(index, {
                                width: ref.style.width,
                                height: ref.style.height,
                                ...position,
                            });
                        }}
                    >
                        <img src={instance.gif} alt="GIF" style={{width: instance.width, height: instance.height}} />
                    </Rnd>
                ))}
            </div>
        </div>
    );
};

export default ImageUploader;
