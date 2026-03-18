import CloudImageCarousel from 'js-cloudimage-carousel';

new CloudImageCarousel('#carousel', {
  images: [
    'https://scaleflex.cloudimg.io/v7/https://samples.scaleflex.com/hotel.jpg',
    'https://scaleflex.cloudimg.io/v7/https://samples.scaleflex.com/birds.jpg',
    'https://scaleflex.cloudimg.io/v7/https://samples.scaleflex.com/perfume.jpg',
    'https://scaleflex.cloudimg.io/v7/https://samples.scaleflex.com/mountains.jpg',
    'https://scaleflex.cloudimg.io/v7/https://samples.scaleflex.com/house.jpg',
  ],
  theme: 'light',
  showThumbnails: true,
  showBullets: true,
  transitionEffect: 'fade',
}).init();
