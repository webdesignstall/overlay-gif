// src/App.js
import React from 'react';
// import GifOverlayApp from './component/GifOverlayApp';
import ImageUploader from './component/ImageUploader.jsx';
import './App.css';

function App() {
    return (
        <div className='app'>
            <h1>GIF Overlay App</h1>
            <ImageUploader />
        </div>
    );
}

export default App;
