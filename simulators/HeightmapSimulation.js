import * as Vec3 from '../lib/twgl/v3.js'
import * as Mat4 from '../lib/twgl/m4.js'
import { makeUniformGrid, makeTriangleStripIndices } from '../utils.js'


export default class HeightmapSimulation{

    constructor(verticesX, verticesZ, simulation){
        this.verticesX = verticesX
        this.verticesZ = verticesZ

        this.vertices = makeUniformGrid(verticesX, verticesZ)
        this.indices = makeTriangleStripIndices(verticesX, verticesZ)
        this.normals = [] 

        this._triangles = this._makeTriangles(this.indices) // <VertexId, Array<TriagleId>>
        this._triangleNormals = Array.from({length: this.indices.length}, e => Array(3).fill(0)); // <TriagleId, TriangleNormal>
    
        this._simulation = simulation
        this._simulation.initialize(this.verticesX, this.verticesZ)
    }

    /** 
     * triangles[vertex id] = Array<triangle id aller adjazenten Dreiecke>
     * @returns {Array} 
     */
    _makeTriangles(){
        let triangles = []

        // fill with empty arrays
        for(var i=0; i<this.vertices.length/3; i++)
            triangles.push([])

        // push triangle id to vertice id
        for (let i=0; i<this.indices.length-2; i++) {
            let vId1 = this.indices[i]
            let vId2 = this.indices[i+1]
            let vId3 = this.indices[i+2]

            if(this._isTriangle(vId1, vId2, vId3)) {
                triangles[vId1].push(i)
                triangles[vId2].push(i)
                triangles[vId3].push(i)
            }
        }    
        return triangles
    }

    update(){
        let heightmap = this._simulation.update()  
        for(let i=0; i<this.vertices.length/3; i++){
            let x = i % this.verticesX
            let y = Math.floor(i/this.verticesX)
            this.vertices[i*3+1] = heightmap[x][y]
        }
        this._updateTriangleNormals()
        this._updateVertexNormals()
    }

    _updateTriangleNormals(){
        for(let i=0; i<this.indices.length; i++){
            let vId1 = this.indices[i]
            let vId2 = this.indices[i+1]
            let vId3 = this.indices[i+2]

            if(this._isTriangle(vId1, vId2, vId3)) {
                let v1 = [this.vertices[vId1*3], this.vertices[vId1*3+1], this.vertices[vId1*3+2]]
                let v2 = [this.vertices[vId2*3], this.vertices[vId2*3+1], this.vertices[vId2*3+2]]
                let v3 = [this.vertices[vId3*3], this.vertices[vId3*3+1], this.vertices[vId3*3+2]]
                    
                let v21 = Vec3.subtract(v2, v1)
                let v31 = Vec3.subtract(v3, v1)
                let n = Vec3.cross(v21, v31)
                
                // in triangle strip the triangles are not equally arranged in termes of clockwise/counterclockwise 
                // every second triangle need to get flipped
                // not sure if my implementation is conventional correct but its uniform and worming
                if(i%2==1) Vec3.mulScalar(n, -1, n)

                Vec3.normalize(n, n)
                Vec3.copy(n, this._triangleNormals[i]) 
            }
        }          
    }

    _updateVertexNormals(){
        for(let i=0; i<this.vertices.length/3; i++){
            let adjacentTriangleIds = this._triangles[i]
            let n = Vec3.create()
            
            for(let t of adjacentTriangleIds){                                    
                Vec3.add(n, this._triangleNormals[t], n)
            }

            Vec3.normalize(n, n)                        
            this.normals[i*3] = n[0]
            this.normals[i*3+1] = n[1]
            this.normals[i*3+2] = n[2]
        }          
    }

    /**
     * Wenn ein Indice zwei mal hintereinader steht ist es kein Dreieck (und wird im Triangle Strip übersprungen)
     * @param {*} vId1 
     * @param {*} vId2 
     * @param {*} vId3 
     */
    _isTriangle(vId1, vId2, vId3){
        return vId1 && vId2 && vId3 && vId1!=vId2 && vId1!=vId3 && vId2!=vId3
    }
}

