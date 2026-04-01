import React, { useRef } from 'react';
import { CloudImageCarouselViewer } from '@cloudimage/carousel/react';

const images = [
  'https://demo.cloudimg.io/v7/https://samples.scaleflex.com/hotel.jpg',
  'https://demo.cloudimg.io/v7/https://samples.scaleflex.com/birds.jpg',
  'https://demo.cloudimg.io/v7/https://samples.scaleflex.com/perfume.jpg',
  'https://demo.cloudimg.io/v7/https://samples.scaleflex.com/mountains.jpg',
  'https://demo.cloudimg.io/v7/https://samples.scaleflex.com/house.jpg',
];

export default function App() {
  /** @type {import('react').RefObject<import('@cloudimage/carousel/react').CloudImageCarouselViewerRef | null>} */
  const carouselRef = useRef(null);

  return (
    <div>
      <h1>Carousel Viewer</h1>

      <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
        <button onClick={() => carouselRef.current?.prev()}>Prev</button>
        <button onClick={() => carouselRef.current?.next()}>Next</button>
        <button onClick={() => carouselRef.current?.zoomIn()}>Zoom In</button>
        <button onClick={() => carouselRef.current?.zoomOut()}>Zoom Out</button>
        <button onClick={() => carouselRef.current?.resetZoom()}>Reset Zoom</button>
      </div>

      <CloudImageCarouselViewer
        ref={carouselRef}
        images={images}
        theme="light"
        showThumbnails
        showBullets
        transitionEffect="fade"
      />
    </div>
  );
}
