import { App } from './App';

document.addEventListener('DOMContentLoaded', async () => {
  const app = new App('scene-container');
  window.addEventListener('resize', app.resize);
  app.update();
});
