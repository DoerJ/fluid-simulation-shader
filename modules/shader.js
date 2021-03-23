import { FlattenCords, FluidGrid } from './solver.js';

// density diffusion
var diffusion = 1.0;
// velocity diffusion 
var viscosity = 0.5;
// time spacing 
var timeSpacing = 0.01;
var dimension = 500;

export class FluidShader {
  constructor() {
    var self = this;

    // set up canvas
    self.canvas = document.getElementById('canvas');
    self.canvas.width = dimension;
    self.canvas.height = dimension;
    self.context = self.canvas.getContext('2d');
    self.context.fillstyle = 'black';
    self.context.fill();

    self.fluid = new FluidGrid(timeSpacing, diffusion, viscosity, dimension);

    // store the x-y cords of mouse from last timestamp to compute the velocity components 
    self.prev_point_x;
    self.prev_point_y;

    // add mouse event listener to canvas
    // when mouse drops down on canvas 
    self.canvas.addEventListener('mousedown', (e) => {
      self.prev_point_x = e.offsetX;
      self.prev_point_y = e.offsetY;
    });
    // when mouse is dragged over canvas
    self.canvas.addEventListener('mousemove', (e) => {
      var x0 = self.prev_point_x;
      var y0 = self.prev_point_y;
      // add density source to previous mouse point 
      self.addFluidSource(x0, y0, x0 - e.offsetX, y0 - e.offsetY);
      self.prev_point_x = e.offsetX;
      self.prev_point_y = e.offsetY;
    });

    window.requestAnimationFrame(renderFluidGrid);
  }

  renderFluidGrid() {
    var self = this;
    self.context.globalCompositeOperation = 'source-over';
    // clear-out phase during canvas animation cycle
    self.context.clearReact(0, 0, dimension, dimension);

    self.context.strokeStyle = 'rgba(255, 255, 255, 1)';
    self.context.save();

    window.requestAnimationFrame(self.renderFluidGrid);
  }

  // add density and velocity sources to fluid object
  // (x0, y0) is the cord where density source is added, and vx-vy are the velocity components at (x0, y0)
  addFluidSource(x0, y0, vx, vy) {
    var self = this;
    var pos = FlattenCords(x0, y0);
    self.fluid.PREV_DENSITIES[pos] += 100;
    self.fluid.PREV_VELOCITIES_X += vx;
    self.fluid.PREV_VELOCITIES_Y += vy;

    self.fluid.addDensity();
    self.fluid.addVelocities();
  }
}