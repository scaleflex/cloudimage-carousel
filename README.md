<h1 align="center">
   JS carousel | Cloudimage (DMO)
</h1>

<h3 align="center">
   A lightning-fast, lightweight JS carousel built for modern web performance
</h3>
<p align="center">
		<img
			alt="Close-up of a frog's picture on top of a carousel of other images"
			src="https://scaleflex.cloudimg.io/v7/plugins/js-carousel/carousel_exemple.png">
</p>

### Introduction:

Meet `js-carousel` by Scaleflex—a minimal, no-nonsense JavaScript carousel plugin that does _exactly_ what you need it to do: load fast, look slick, and play nice with performance. Designed with zero dependencies and a featherlight footprint, this carousel is tailor-made for developers and performance-obsessed teams who don’t want to trade speed for style. Whether you're running a headless CMS or optimizing for that last Lighthouse point, `js-carousel` by Scaleflex is the go-to solution.

`js-carousel` by Scaleflex does not bundle in more features than you'll ever use, it focuses on doing one thing exceptionally well: delivering a fast, responsive, and ultra-smooth image slider & zoomer experience with minimal setup. It’s the smart choice for frontend engineers who value UX as much as DX. Simple to integrate, easy to customize, and built for scale.

To see the Carousel plugin in action, please check out the [Demo page](https://scaleflex.cloudimg.io/v7/plugins/js-carousel/carousel-demo.html).

# JS Carousel Options

## Setup and Build Instructions

### Installation

Clone the repository and install dependencies:

```bash
npm install
```

### Building for Production

To build minified files for production:

```bash
npm run build
```

This will create two minified files in the `dist` directory:

- `js-carousel.min.js` - Minified JavaScript bundle
- `js-carousel.min.css` - Minified CSS bundle

### Using the Minified Files

Include the minified files in your HTML:

```html
<link rel="stylesheet" href="path/to/js-carousel.min.css" />
<script src="path/to/js-carousel.min.js"></script>
```

The carousel is exposed as a UMD module, so it works with:

- Browser globals (`window.CloudImageCarousel`)
- AMD modules
- CommonJS/Node.js modules

## Basic Usage

```javascript
const carousel = new CloudImageCarousel('#carousel', {
  // your options here
  images: ['path/to/image1.jpg', 'path/to/image2.jpg'],
})

// initialize carousel
carousel.init()
```

## Available Options

### `autoplay` (boolean)

- **Default**: `false`
- **Description**: Enables automatic slideshow of images
- **Example**:

```javascript
{
  autoplay: true
}
```

### `autoplayInterval` (number)

- **Default**: `3000` (3 seconds)
- **Description**: Sets the time interval (in milliseconds) between slides when autoplay is enabled
- **Example**:

```javascript
{
  autoplayInterval: 5000 // Changes slide every 5 seconds
}
```

### `cycle` (boolean)

- **Default**: `true`
- **Description**: Determines if the carousel should loop back to the first image after reaching the last one
- **Example**:

```javascript
{
  cycle: false // Stops at the last image
}
```

### `showFilenames` (boolean)

- **Default**: `false`
- **Description**: Shows/hides the filename caption below each image. Filenames are automatically extracted from the image URL
- **Example**:

```javascript
{
  showFilenames: true // Displays image filenames
}
```

### `showThumbnails` (boolean)

- **Default**: `true`
- **Description**: Shows/hides the thumbnail navigation bar at the bottom of the carousel
- **Example**:

```javascript
{
  showThumbnails: false // Hides thumbnail navigation
}
```

### `showControls` (boolean)

- **Default**: `true`
- **Description**: Shows/hides the control buttons (previous/next navigation, zoom controls, fullscreen toggle)
- **Example**:

```javascript
{
  showControls: false // Hides all control buttons
}
```

### `showBullets` (boolean)

- **Default**: `false`
- **Description**: Shows/hides bullet navigation indicators below the carousel
- **Example**:

```javascript
{
  showBullets: true // Shows bullet navigation
}
```

### `transitionEffect` (string)

- **Default**: `'fade'`
- **Options**: `'fade'`, `'slide'`
- **Description**: Sets the transition effect when changing slides
- **Example**:

```javascript
{
  transitionEffect: 'fade' // Uses fade transition between slides
}
```

### `thumbnailFitMode` (string)

- **Default**: `'crop-fit'`
- **Options**: `'crop-fit'`, `'fit'`
- **Description**: Controls how thumbnail images are fitted within their containers
- **Example**:

```javascript
{
  thumbnailFitMode: 'fit' // Makes thumbnails fit within their container without cropping
}
```

### `thumbnailAlignment` (string)

- **Default**: `'space-evenly'`
- **Options**: `'left'`, `'center'`, `'right'`, `'space-evenly'`, `'space-between'`
- **Description**: Controls the horizontal alignment of thumbnails in the thumbnail container
- **Example**:

```javascript
{
  thumbnailAlignment: 'space-between' // Distributes thumbnails with equal space between them
}
```

## Complete Example

Here's an example showing all options with their default values:

```html
<div id="my-carousel"></div>
```

```javascript
const carousel = new CloudImageCarousel('#my-carousel', {
  autoplay: false,
  autoplayInterval: 3000,
  cycle: true,
  showFilenames: false,
  showThumbnails: true,
  showControls: true,
  showBullets: false,
  transitionEffect: 'fade',
  thumbnailFitMode: 'crop-fit',
  thumbnailAlignment: 'space-evenly',
  images: ['path/to/image1.jpg', 'path/to/image2.jpg', 'path/to/image3.jpg'],
})

// initialize carousel
carousel.init()
```

## Features

### Built-in Features

- **Lazy Loading**: Images are loaded on-demand using IntersectionObserver for better performance
- **Keyboard Navigation**:
  - Left/Right arrow keys to navigate between slides
  - Escape key to exit fullscreen mode
- **Touch Support**: Swipe gestures for mobile devices
- **Responsive Design**: Automatically adjusts to container width
- **Zoom Controls**:
  - Zoom in/out functionality
  - Reset zoom level
  - Mouse wheel zoom support
- **Fullscreen Mode**: Toggle fullscreen view of the carousel

### API Methods

The carousel instance provides several methods for programmatic control:

```javascript
// Navigation
carousel.next() // Go to next slide
carousel.prev() // Go to previous slide
carousel.goToSlide(index) // Go to specific slide

// Zoom Controls
carousel.zoomIn() // Increase zoom level
carousel.zoomOut() // Decrease zoom level
carousel.resetZoom() // Reset zoom to default

// Fullscreen
carousel.toggleFullscreen() // Toggle fullscreen mode

// Autoplay Controls
carousel.startAutoplay() // Start automatic slideshow
carousel.stopAutoplay() // Stop automatic slideshow
carousel.resetAutoplay() // Reset autoplay timer

// Cleanup
carousel.destroy() // Clean up resources and event listeners
```

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Fallback support for browsers without IntersectionObserver
- Touch events support for mobile devices

## Notes

- All options are optional and will fall back to their default values if not specified
- The carousel container element can be specified either as a CSS selector string or as a DOM element
- Image sources should be provided as an array of URLs using the `loadImages()` method
- For best performance, consider using optimized image sizes and formats
- The carousel automatically handles window resize events and orientation changes
