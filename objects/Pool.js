import * as twgl from './../lib/twgl/twgl.js'
import * as Vec3 from './../lib/twgl/v3.js'
import * as Mat4 from './../lib/twgl/m4.js'
import { texture_vs, texture_fs } from './../rendering/texture.js'

export default class Pool{

    constructor(gl){

        this.programInfo = twgl.createProgramInfo(gl, [texture_vs, texture_fs])

        // this.texture = twgl.createTexture(gl, { src: [255, 0, 0, 255] })
        this.texture = twgl.createTexture(gl, { 
            //mag: gl.LINEAR,
            //min: gl.LINEAR,
            src: "assets/tiles.jpg" 
        })

        const s = 12/24 // scale calculated by tiles (e.g. want to see 14 of 24 tiles -> s = 14/24), set u_poolHeight to s

        this.modelMat = Mat4.identity()
        Mat4.translate(this.modelMat, [0, s-1, 0], this.modelMat) 
        Mat4.scale(this.modelMat, [1, s, 1], this.modelMat)

        this.bufferInfo = twgl.createBufferInfoFromArrays(gl, {
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

        this.uniforms = {
            u_model: this.modelMat,
            u_texture: this.texture,
        }
    }

    render(gl, globalUniforms, lightUniforms){
        gl.enable(gl.CULL_FACE);
        gl.cullFace(gl.FRONT);
        gl.useProgram(this.programInfo.program) 
        twgl.setUniforms(this.programInfo, globalUniforms)
        twgl.setUniforms(this.programInfo, lightUniforms)
        twgl.setUniforms(this.programInfo, this.uniforms)
        twgl.setBuffersAndAttributes(gl, this.programInfo, this.bufferInfo)
        twgl.bindFramebufferInfo(gl, null);
        twgl.drawBufferInfo(gl, this.bufferInfo, gl.TRIANGLES) 
        gl.disable(gl.CULL_FACE);
    }
}