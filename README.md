### Fluid simulation shader 
##### Description 
The shader for now only works for compressible fluid(i.e., smoke, air) running in 2-D space. The 3-D fluid simulation is to be added in future by additional volumetrical rendering implementations. 

This fluid simulation is based on Navier-Stokes equation, and all low-level implementation including mathematical representations come from the paper by Jos Stam in 2003: https://www.dgp.toronto.edu/public_user/stam/reality/Research/pdf/GDC03.pdf.