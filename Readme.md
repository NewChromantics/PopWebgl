PopWebGl
=================
This code/library is intended as a very modular and abstractable interface to graphics coding that I personally use a lot that so many libraries miss; 
- Immediate rendering to a target (screen, part of a screen, texture, abstract surface). I do this for, essentially, GPGPU work
 - Generating masks, Computer Vision filters 
 - Physics/Math processing (ie. 4096x4096 states to move & animate giant pointclouds on GPU)
 - Very minimal code (ie. just a frag shader) for graphics in elements 
- Abstractable so I can use the same interface for my own engine (C/++/metal/gl/dx/vulkan/opencl low level with javascript/v8/JavascriptCore high level). I also generate render command queues low level, but it means I can take things like TensorFlow.js and abstract away the webgl implementation and then run it at a much larger parallel scale

Examples
------------------
- http://electric.horse/ Testing rendering of SDF in webgl
- http://draw.electric.horse/ Very simple JS code for potentially powerful tools.
