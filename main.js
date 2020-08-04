import * as twgl from './lib/twgl/twgl.js'
import * as Vec3 from './lib/twgl/v3.js'
import * as Mat4 from './lib/twgl/m4.js'
import Stats from './lib/stats.module.js'
import { texture_vs, texture_fs } from './shader/texture.js'
import { water_vs, water_fs } from './shader/water.js'
import { test_vs, test_fs } from './shader/testwater.js'
import { testinit_vs, testinit_fs } from './shader/testinit.js'
import { testsim_vs, testsim_fs } from './shader/testsim.js'
import { degToRad, createOrbitCamera } from './lib/utils.js'
import HeightfieldSimulator from './simulators/HeightfieldSimulator.js'
import ShaderSimulator from './simulators/ShaderSimulator.js'
import { simulation } from './simulators/simulations/simplewater.js'



//////////////////
//     GUI      //
//////////////////

const stats = new Stats()
document.body.appendChild(stats.dom)





//////////////////
//  SETUP WEBGL //
//////////////////

var paused = false
const canvas = document.getElementById("canvas")
const gl = canvas.getContext("webgl", {antialias: true})
twgl.resizeCanvasToDisplaySize(gl.canvas)
gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
gl.getExtension('OES_element_index_uint') // to use bigger indice arrays, already enabled in chrome but for older versions

gl.enable(gl.BLEND)
gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

const poolTexProgram = twgl.createProgramInfo(gl, [texture_vs, texture_fs])
const initProgram = twgl.createProgramInfo(gl, [testinit_vs, testinit_fs])
const simulationProgram = twgl.createProgramInfo(gl, [testsim_vs, testsim_fs])
const waterProgram = twgl.createProgramInfo(gl, [test_vs, test_fs])




//////////////////
//   TEXTURES   //
//////////////////
const colorTexture = twgl.createTexture(gl, { src: [255, 0, 0, 255] })

const tilesTexture = twgl.createTexture(gl, { 
    //mag: gl.LINEAR,
    //min: gl.LINEAR,
    src: "assets/tiles.jpg" 
})

const cubeMapTiles = twgl.createTexture(gl, {
    target: gl.TEXTURE_CUBE_MAP,
    //mag: gl.LINEAR,
    //min: gl.LINEAR,
    src: [
        "assets/tiles.jpg",
        "assets/tiles.jpg",
        "assets/tiles.jpg", // y transparent machen?
        "assets/tiles.jpg",
        "assets/tiles.jpg",
        "assets/tiles.jpg"
      ],
})
const cubeMapEnv = twgl.createTexture(gl, {
    target: gl.TEXTURE_CUBE_MAP,
    mag: gl.LINEAR,
    min: gl.LINEAR,
    src: [
        'assets/env/xpos.jpg',
        'assets/env/xneg.jpg',
        'assets/env/ypos.jpg',
        'assets/env/yneg.jpg', // gibts nicht
        'assets/env/zpos.jpg',
        'assets/env/zneg.jpg',
      ],
})
const cubeMapTest = twgl.createTexture(gl, {
    target: gl.TEXTURE_CUBE_MAP,
    src: [
        'assets/test/xpos.png',
        'assets/test/xneg.png',
        'assets/test/ypos.png',
        'assets/test/yneg.png', 
        'assets/test/zpos.png',
        'assets/test/zneg.png',
      ],
})





//////////////////
// CAMERA, etc..//
//////////////////
const fov = degToRad(45)
const projection = Mat4.perspective(fov,  canvas.width/canvas.height, 0.01, 100)

window.addEventListener("resize", e => {
    gl.viewport(0, 0, canvas.width, canvas.width)
    twgl.resizeCanvasToDisplaySize(canvas)
    Mat4.perspective(fov,  canvas.width/canvas.height, 0.01, 100, projection)
})

const camera = createOrbitCamera(canvas, Vec3.create(0, -0.1, 4), 25, 0)

const lightUniforms = {
    ambient: [0.3, 0.3, 0.3],
    sunColor: [0.8, 0.8, 0.8],
    sunPosition: [0, 3, 0],
}

const globalUniforms = {
    u_projection: projection,
    u_view: Mat4.identity(),
} 




//////////////////
//    POOL      //
//////////////////
const s = 14/24 // scale calculated by tiles (want to see 14 of 24 tiles)

const poolModelMat = Mat4.identity()
Mat4.translate(poolModelMat, [0, s-1, 0], poolModelMat) 
Mat4.scale(poolModelMat, [1, s, 1], poolModelMat)

const poolBufferInfo = twgl.createBufferInfoFromArrays(gl, {
    indices: { numComponents: 3, data: [
        0,  1,  2,      0,  2,  3,    // vorne
        4,  5,  6,      4,  6,  7,    // hinten
        8,  9,  10,     8,  10, 11,   // unten
        12, 13, 14,     12, 14, 15,   // rechts
        16, 17, 18,     16, 18, 19,   // links
    ]},
    a_position: { numComponents: 3, data: [
        // vorderne
        -1.0, -1.0,  1.0,
        1.0, -1.0,  1.0,
        1.0,  1.0,  1.0,
        -1.0,  1.0,  1.0,
       // hinteren
       -1.0, -1.0, -1.0,
       -1.0,  1.0, -1.0,
        1.0,  1.0, -1.0,
        1.0, -1.0, -1.0,
       // unteren
       -1.0, -1.0, -1.0,
        1.0, -1.0, -1.0,
        1.0, -1.0,  1.0,
       -1.0, -1.0,  1.0,
       // rechts
        1.0, -1.0, -1.0,
        1.0,  1.0, -1.0,
        1.0,  1.0,  1.0,
        1.0, -1.0,  1.0,
       // links
       -1.0, -1.0, -1.0,
       -1.0, -1.0,  1.0,
       -1.0,  1.0,  1.0,
       -1.0,  1.0, -1.0
    ]},
    a_texcoord: { numComponents: 2, data: [
        // vorne
        0.0,  0.0,
        1.0,  0.0,
        1.0,  1.0*s,
        0.0,  1.0*s,
        // hinten
        0.0,  0.0,
        1.0*s,  0.0,
        1.0*s,  1.0,
        0.0,  1.0,
        // unten
        0.0,  0.0,
        1.0,  0.0,
        1.0,  1.0,
        0.0,  1.0,
        // rechts
        0.0,  0.0,
        1.0*s,  0.0,
        1.0*s,  1.0,
        0.0,  1.0,
        // links
        0.0,  0.0,
        1.0,  0.0,
        1.0,  1.0*s,
        0.0,  1.0*s
    ]},
    a_normal: { numComponents: 3, data: [
        //vorne
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,
        //hinten
        0, 0, -1,
        0, 0, -1,
        0, 0, -1,
        0, 0, -1,
        // unten
        0, 1, 0,
        0, 1, 0,
        0, 1, 0,
        0, 1, 0,
        // rechts
        1, 0, 0,
        1, 0, 0,
        1, 0, 0,
        1, 0, 0,
        // links
        -1, 0, 0,
        -1, 0, 0,
        -1, 0, 0,
        -1, 0, 0,
    ]},
})

const poolUniforms = {
    u_model: poolModelMat,
    u_texture: tilesTexture,
}



//////////////////
//      FBO     //
//////////////////
const countX = 80
const countZ = 80

const fbBufferInfo = twgl.createBufferInfoFromArrays(gl, { 
    a_position: { numComponents: 2, data: [-1, 1, -1, -1, 1, 1, 1, -1] } // cover clip space
})

let fb1 = twgl.createFramebufferInfo(gl, undefined, 8, 8);
let fb2 = twgl.createFramebufferInfo(gl, undefined, 8 , 8);
if(gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) { console.log("Not working") }

gl.useProgram(initProgram.program);
twgl.setBuffersAndAttributes(gl, initProgram, fbBufferInfo);
twgl.setUniforms(initProgram, {u_test: 1.23456})
twgl.bindFramebufferInfo(gl, fb1);
twgl.drawBufferInfo(gl, fbBufferInfo, gl.TRIANGLE_STRIP);




//////////////////
//     WATER    //
//////////////////
const waterModelMat = Mat4.identity() 
Mat4.translate(waterModelMat, [0, 0, 0], waterModelMat) 
Mat4.scale(waterModelMat, [2, 1, 2], waterModelMat)

const simulator = new ShaderSimulator(countX, countZ)

const waterBufferInfo = twgl.createBufferInfoFromArrays(gl, {
    indices: { numComponents: 3, data: Uint32Array.from(simulator.indices) }, // use gl.drawElements() with 32 Bit (waterBufferInfo.elementType is set to gl.UNSIGNED_INT)
    a_position: { numComponents: 3, data: simulator.vertices },
    a_uv: { numComponents: 2, data: simulator.uv },
})

const waterUniforms = { 
    u_model: waterModelMat,
    u_cubeMap: cubeMapTiles,
    u_cubeEnvMap: cubeMapEnv,
    u_bottomModelMat: poolModelMat, 
    u_cameraPosition: Vec3.create(), 
}





//////////////////
//   MAIN LOOP  //
//////////////////
requestAnimationFrame(update)

function update(){
    requestAnimationFrame(update)
    stats.begin()
    updateCamera()
    if(!paused) {
        simulator.update()
    }
    render()
    stats.end()
}

function updateCamera() {
    Mat4.inverse(camera.mat, globalUniforms.u_view)
    Mat4.getTranslation(camera.mat, waterUniforms.u_cameraPosition)
}

let i = 0
function render() {
    twgl.resizeCanvasToDisplaySize(gl.canvas)
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)

    gl.disable(gl.DEPTH_TEST)
    gl.useProgram(simulationProgram.program) 
    twgl.setBuffersAndAttributes(gl, simulationProgram, fbBufferInfo)
    twgl.setUniforms(simulationProgram, {
        u_framenumber: i, 
        u_texture: fb1.attachments[0],
        u_color: [Math.random(), Math.random(), Math.random(), 1]
    })
    twgl.bindFramebufferInfo(gl, fb2) 
    twgl.drawBufferInfo(gl, fbBufferInfo, gl.TRIANGLE_STRIP)
    gl.enable(gl.DEPTH_TEST)

    gl.useProgram(waterProgram.program) 
    twgl.setUniforms(waterProgram, globalUniforms)
    twgl.setUniforms(waterProgram, lightUniforms)
    twgl.setUniforms(waterProgram, waterUniforms)
    twgl.setUniforms(waterProgram, { u_texture: fb2.attachments[0] })
    twgl.setAttribInfoBufferFromArray(gl, waterBufferInfo.attribs.a_position, simulator.vertices)
    twgl.setBuffersAndAttributes(gl, waterProgram, waterBufferInfo)
    twgl.bindFramebufferInfo(gl, null)
    twgl.drawBufferInfo(gl, waterBufferInfo, gl[simulator.DRAW_MODE])

    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.FRONT);
    gl.useProgram(poolTexProgram.program) 
    twgl.setUniforms(poolTexProgram, globalUniforms)
    twgl.setUniforms(poolTexProgram, lightUniforms)
    twgl.setUniforms(poolTexProgram, poolUniforms)
    twgl.setBuffersAndAttributes(gl, poolTexProgram, poolBufferInfo)
    twgl.bindFramebufferInfo(gl, null);
    twgl.drawBufferInfo(gl, poolBufferInfo, gl.TRIANGLES) 
    gl.disable(gl.CULL_FACE);

    i++
    let temp = fb1;
    fb1 = fb2;
    fb2 = temp;
}

window.addEventListener('keydown', e => {
    if(e.keyCode == 32)
        paused = !paused
})

