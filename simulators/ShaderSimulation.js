import * as Vec3 from '../lib/twgl/v3.js'
import * as Mat4 from '../lib/twgl/m4.js'
import { makeUniformGrid, makeTriangleStripIndices } from '../lib/utils.js'


export default class ShaderSimulation{

    DRAW_MODE = "TRIANGLES"

    constructor(vertCountX, vertCountZ){
        this.vertCountX = vertCountX
        this.vertCountZ = vertCountZ

        this.vertices = makeUniformGrid(this.vertCountX, this.vertCountZ)
        this.indices = makeTriangleStripIndices(this.vertCountX, this.vertCountZ)
        this.normals = [] 
    }

    update(){

    }
}