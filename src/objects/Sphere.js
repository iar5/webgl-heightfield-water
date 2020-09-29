import * as twgl from '../../lib/twgl/twgl.js'
import * as twglprimitives from '../../lib/twgl/primitives.js'
import * as Vec3 from '../../lib/twgl/v3.js'
import * as Mat4 from '../../lib/twgl/m4.js'


const sphere_vs = `

    precision highp float;

    uniform mat4 u_model;
    uniform mat4 u_view;
    uniform mat4 u_projection;

    attribute vec3 a_position;
    attribute vec3 a_normal;
    attribute vec2 a_texcoord;

    varying vec4 v_position;

    void main() {
        v_position = u_model * vec4(a_position, 1.0);
        gl_Position = u_projection * u_view * v_position;
    }
`

const sphere_fs = `
    precision highp float;

    void main() {
        gl_FragColor = vec4(1, 0, 0, 1);
    }
`
/**
 * TODO add depth test to scene (fix problem with skybox)
 */
export default class Sphere{

    constructor(gl, pos=Vec3.create(0,0,0), r=0.2){

        this.programInfo = twgl.createProgramInfo(gl, [sphere_vs, sphere_fs])

        twgl.setAttributePrefix("a_")
        this.bufferInfo = twglprimitives.createSphereBufferInfo(gl, 1, 12, 12)
        twgl.setAttributePrefix("") 

        this.modelMat = Mat4.identity()
        Mat4.translate(this.modelMat, pos, this.modelMat)
        Mat4.scale(this.modelMat, [r, r, r], this.modelMat)

        this.uniforms = { 
            u_model: this.modelMat, 
        }
    }

    render(gl, globalUniforms){
        gl.useProgram(this.programInfo.program)
        twgl.setUniforms(this.programInfo, globalUniforms)
        twgl.setUniforms(this.programInfo, this.uniforms)
        twgl.setBuffersAndAttributes(gl, this.programInfo, this.bufferInfo)
        twgl.drawBufferInfo(gl, this.bufferInfo, gl.TRIANGLE)
    }
}