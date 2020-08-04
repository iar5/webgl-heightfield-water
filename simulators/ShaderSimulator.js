import * as Vec3 from '../lib/twgl/v3.js'
import * as Mat4 from '../lib/twgl/m4.js'
import { makeUniformGrid, makeTriangleStripIndices, makeUniformGridUVs } from '../lib/utils.js'


export default class ShaderSimulator{

    DRAW_MODE = "TRIANGLE_STRIP"

    constructor(vertCountX, vertCountZ){
        this.vertCountX = vertCountX
        this.vertCountZ = vertCountZ

        this.vertices = makeUniformGrid(this.vertCountX, this.vertCountZ)
        this.indices = makeTriangleStripIndices(this.vertCountX, this.vertCountZ)
        this.uv = makeUniformGridUVs(this.vertCountX, this.vertCountZ)
    }

    update(){

    }
}