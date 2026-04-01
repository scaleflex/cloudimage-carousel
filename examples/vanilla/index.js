import CloudImageCarousel from '@cloudimage/carousel';

new CloudImageCarousel('#carousel', {
  images: [
    'https://demo.cloudimg.io/v7/https://samples.scaleflex.com/hotel.jpg',
    'https://demo.cloudimg.io/v7/https://samples.scaleflex.com/birds.jpg',
    'https://demo.cloudimg.io/v7/https://samples.scaleflex.com/perfume.jpg',
    'https://demo.cloudimg.io/v7/https://samples.scaleflex.com/mountains.jpg',
    'https://demo.cloudimg.io/v7/https://samples.scaleflex.com/house.jpg',
  ],
  theme: 'light',
  showThumbnails: true,
  showBullets: true,
  transitionEffect: 'fade',
}).init();
