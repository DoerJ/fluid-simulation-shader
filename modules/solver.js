var N;

// this function flatten 2-D coordinates for the efficiency purpose 
var FlattenCords = (x, y) => {
  return x + (N + 2) * y; 
}

class FluidGrid {
  constructor(dt, diffusion, viscosity, dimension) {
    var self = this;
    var size = (N + 2) * (N + 2);

    N = dimension;
    // the densities of fluid grid cells 
    self.DENSITIES = new Array(size * size).fill(0);
    self.PREV_DENSITIES = new Array(size * size).fill(0);

    // the velocities of fluid grid cells 
    self.VELOCITIES_X = new Array(size * size).fill(0);
    self.VELOCITIES_Y = new Array(size * size).fill(0);
    self.PREV_VELOCITIES_X = new Array(size * size).fill(0);
    self.PREV_VELOCITIES_Y = new Array(size * size).fill(0);

    // time spacing of fluid simulation snapshots 
    self.TIME_SPACING = dt;
    // diffusion defines how fluid spread across the grid
    self.DIFFUSION = diffusion; 
    // viscosity defines how fast fluid grid cell exchange its velocities with neighbors
    self.VISCOSITY = viscosity;
  }

  // add density to fluid grid cell 
  addDensity() {
    var self = this;
    for (let i = 0 ; i < N * N; i++) {
      self.DENSITIES[i] += self.TIME_SPACING * self.PREV_DENSITIES[i];
    }
  }

  // add velocities to fluid grid cell 
  addVelocities() {
    var self = this;
    for (let i = 0 ; i < N * N; i ++) {
      self.VELOCITIES_X[i] += self.TIME_SPACING * self.PREV_VELOCITIES_X[i];
      self.VELOCITIES_Y[i] += self.TIME_SPACING * self.PREV_VELOCITIES_Y[i];
    }
  }

  // compute the net movement of each fluid grid cell 
  // in this case, we only consider each grid cell exchange their density and velocities
  // with its four neighbor cells (i-1, j), (i+1, j), (i, j-1), (i, j+1)
  diffuse(b, x, prev_x, diff) {
    var self = this;
    // amount of diffusion change at the current snapshot 
    var amount = self.TIME_SPACING * diff * N * N;
    // iteraction of diffusion exchanges 
    var iteration = 20;
    for (let k = 0; k < iteration; k++) {
      for (let i = 0; i < N; i++) {
        for (let j = 0; j < N; j++) {
          let pos = FlattenCords(i, j);
          // compute the net difference of fluid cell with its four neighbors
          x[pos] = (prev_x[pos] + amount * (x[FlattenCords(i - 1, j)] + x[FlattenCords(i + 1, j)] + 
            x[FlattenCords(i, j - 1)] + x[FlattenCords(i, j + 1)])) / (1 + 4 * amount);
        }
      }
      self.setBoundary(b, x);
    }
  }

  // advection describes the mass or quantity of fluid being transported through the velocity vector field
  // also means forcing the density to follow a given velocity field
  advect(b, d, prev_d, u, v) {
    var self = this;
    var dt0 = self.TIME_SPACING * N;
    var x, y, i0, i1, j0, j1, s0, s1, t0, t1;

    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        let pos = FlattenCords(x, y);
        x = i - dt0 * u[pos];
        y = j - dt0 * v[pos];
        if (x < 0.5) x = 0.5;
        if (x > N + 0.5) x = N + 0.5;
        i0 = Math.floor(x);
        i1 = i0 + 1;

        if (y < 0.5) y = 0.5;
        if (y > N + 0.5) y = N + 0.5;
        j0 = Math.floor(y);
        j1 = j0 + 1;

        s1 = x - i0;
        s0 = 1 - s1;
        t1 = y - j0;
        t0 = 1 - t1;
        
        // udpate fluid cell
        d[pos] = s0 * (t0 * prev_d[FlattenCords(i0, j0)] + t1 * prev_d[FlattenCords(i0, j1)]) + 
          s1 * (t0 * prev_d[FlattenCords(i1, j0)] + t1 * prev_d[FlattenCords(i1, j1)]);
      }
    }
    self.setBoundary(b, d);
  }

  // compute density for each timestamp 
  densityStep() {
    var self = this;
    self.addDensity();
    
    self.diffuse(0, self.DENSITIES, self.PREV_DENSITIES, self.DIFFUSION);
    self.advect(0, self.DENSITIES, self.PREV_DENSITIES, self.VELOCITIES_X, self.VELOCITIES_Y);
  }

  // project step enforces the velocity field to be mass conserving
  project(u, v, p, div) {
    var self = this;
    var iteration = 20;
    var h = 1.0 / N;

    for (let i = 1; i < N; i++) {
      for (let j = 1; j < N; j++) {
        let pos = FlattenCords(i, j);
        div[pos] = -0.5 * h * (u[FlattenCords(i + 1, j)] - u[FlattenCords(i - 1, j)] + 
          v[FlattenCords(i, j + 1)] - v[FlattenCords(i, j - 1)]);
        p[pos] = 0;
      }
    }
    self.setBoundary(0, div);
    self.setBoundary(0, p);

    for (let k = 0; k < iteration; k++) {
      for (let i = 1; i <= N; i++) {
        for (let j = 1; j <= N; j++) {
          let pos = FlattenCords(i, j);
          p[pos] = (div[pos] + p[FlattenCords(i - 1, j)] + p[FlattenCords(i + 1, j)] + 
            p[FlattenCords(i, j + 1)] + p[FlattenCords(i, j + 1)]) / 4;
        }
      }
      self.setBoundary(0, p);
    }

    for (let i = 1; i <= N; i++) {
      for (let j = 1; j <= N; j++) {
        let pos = FlattenCords(i, j);
        u[pos] -= 0.5 * (p[FlattenCords(i + 1, j)] - p[FlattenCords(i - 1, j)]) / h;
        v[pos] -= 0.5 * (p[FlattenCords(i, j + 1)] - p[FlattenCords(i, j - 1)]) / h;
      }
    }
    self.setBoundary(1, u);
    self.setBoundary(2, v);
  }

  // the whole fluid simulation is considered to be contained in a sealed box
  // that means the horizontal component of velocity will become 0 at vertial walls
  // and the same apply to the vertical component of velocity at horizontal walls 
  setBoundary(b, x) {
    for (let i = 1; i <= N; i++) {
      x[FlattenCords(0, i)] = b === 1 ? -x[FlattenCords(1, i)] : x[FlattenCords(1, i)];
      x[FlattenCords(N + 1, i)] = b === 1 ? -x[FlattenCords(N, i)] : x[FlattenCords(N, i)];
      x[FlattenCords(i, 0)] = b === 2 ? -x[FlattenCords(i, 1)] : x[FlattenCords(i, N + 1)];
      x[FlattenCords(i, N)] = b === 2 ? -x[FlattenCords(i, N)] : x[FlattenCords(i, N)];
    }
    x[FlattenCords(0, 0)] = 0.5 * (x[FlattenCords(1, 0)] + x[FlattenCords(0, 1)]);
    x[FlattenCords(0, N + 1)] = 0.5 * (x[FlattenCords(1, N + 1)] + x[FlattenCords(0, N)]);
    x[FlattenCords(N + 1, 0)] = 0.5 * (x[FlattenCords(N, 0)] + x[FlattenCords(N + 1, 1)]);
    x[FlattenCords(N + 1, N + 1)] = 0.5 * (x[FlattenCords(N, N + 1)] + x[FlattenCords(N + 1, N)]);
  }

  // compute velocities for each timestamp
  velocityStep() {
    var self = this;
    self.addVelocities();
    
    self.diffuse(1, self.VELOCITIES_X, self.PREV_VELOCITIES_X, self.VISCOSITY);
    self.diffuse(2, self.VELOCITIES_Y, self.PREV_VELOCITIES_Y, self.VISCOSITY);
    
    self.project(self.VELOCITIES_X, self.VELOCITIES_Y, self.PREV_VELOCITIES_X, self.PREV_VELOCITIES_Y);

    self.advect(1, self.VELOCITIES_X, self.PREV_VELOCITIES_X, self.PREV_VELOCITIES_X, self.PREV_VELOCITIES_Y);
    self.advect(2, self.VELOCITIES_Y, self.PREV_VELOCITIES_Y, self.PREV_VELOCITIES_X, self.PREV_VELOCITIES_Y);

    self.project(self.VELOCITIES_X, self.VELOCITIES_Y, self.PREV_VELOCITIES_X, self.PREV_VELOCITIES_Y);
  }
}

export { FlattenCords, FluidGrid };



