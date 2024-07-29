// components/ImageUploader.js

import { useState } from 'react';
import { Rnd } from 'react-rnd';
import GIF from 'gif.js.optimized';
import { GifReader } from 'omggif';

import gif1 from '../../public/gif/dancing_dog.gif';
import gif2 from '../../public/gif/pikachu.gif';
import gif3 from '../../public/gif/200w.gif';


const gifs = [  gif1, gif2, gif3  ];

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

    const addGifInstance = (gif) => {
        setGifInstances([...gifInstances, { gif: gif, x: 0, y: 0 }]);
    };

    const removeGifInstance = (index) => {
        setGifInstances(gifInstances.filter((_, idx) => idx !== index));
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

             allFrames.forEach(frame => gif.addFrame(frame, { delay: 100 }));
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

            {/*<div>*/}
            {/*    Upload Image*/}
            {/*    <input hidden type="file" accept="image/*" onChange={handleImageUpload}/>*/}
            {/*</div>*/}

            <label htmlFor="imageUpload" style={{cursor: 'pointer', background: '#f9f9f9', padding: '15px 35px', borderRadius: '10px'}}>
                Upload Image
            </label>
            <input id="imageUpload" hidden type="file" accept="image/*" onChange={handleImageUpload}/>


            {
                image && <>

                    <div style={{
                        position: 'relative',
                        width: '100%',
                        height: '500px',
                        border: '1px solid #ddd',
                        marginTop: '20px',
                        overflow: 'hidden'
                    }}>
                        {image && <img src={image} alt="Uploaded" style={{width: '100%', height: 'auto'}}/>}
                        {gifInstances.map((instance, index) => (
                            <Rnd
                                key={index}
                                default={{
                                    x: instance.x,
                                    y: instance.y,
                                    width: instance.width,
                                    height: instance.height,
                                }}
                                onDragStop={(e, d) => handleGifChange(index, {x: d.x, y: d.y})}
                                onResizeStop={(e, direction, ref, delta, position) => {
                                    handleGifChange(index, {
                                        width: ref.style.width,
                                        height: ref.style.height,
                                        ...position,
                                    });
                                }}
                                style={{
                                    border: '1px dashed black',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <div style={{position: 'relative'}}>
                                    <img src={instance.gif} alt="GIF"
                                         style={{width: instance.width, height: instance.height}}/>
                                    <button
                                        onClick={() => removeGifInstance(index)}
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
                                        }}
                                    >
                                        &times;
                                    </button>
                                </div>
                            </Rnd>
                        ))}
                    </div>

                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        margin: '20px 0',
                        gap: '20px', // Add gap between each row
                    }}>

                        <p>Choose a GIF to insert:</p>

                        <div style={{display: 'flex', gap: '10px'}}>
                            {gifs.map((gif, index) => (
                                <>

                                    <button key={index} onClick={() => {
                                        // setSelectedGif(gif)
                                        addGifInstance(gif)
                                    }}>
                                        <img width={100} height={100} src={gif}/>
                                    </button>

                                </>

                            ))}
                        </div>

                        <button onClick={exportImage}>Export GIF</button>
                    </div>


                </>
            }


        </div>
    );
};

export default ImageUploader;
